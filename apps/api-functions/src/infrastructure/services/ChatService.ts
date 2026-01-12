/**
 * @fileoverview ChatService
 * @description Infrastructure service that manages Teams chats using Microsoft Graph.
 */

import { IChatService } from '../../domain/interfaces/IChatService';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { UserRole } from '../../domain/enums/UserRole';
import { ChatNoParticipantsError, ChatInvalidParticipantsError } from '../../domain/errors/InfrastructureErrors';
import { wrapChatServiceError } from '../../utils/error/ErrorHelpers';
import { ClientSecretCredential, OnBehalfOfCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import prisma from '../database/PrismaClientService';
import { config } from '../../config';
import { GraphChatMember } from '../../domain/types/GraphTypes';

export class ChatService implements IChatService {
  private readonly tenantId = config.azureTenantId;
  private readonly clientId = config.azureClientId;
  private readonly clientSecret = config.azureClientSecret;
  private readonly appScopes = ['https://graph.microsoft.com/.default'];

  /**
   * Retrieves or creates a chat.
   *
   * @param token - Caller token used for delegated Graph operations.
   * @param participants - Optional participant list; when omitted the Contact Managers chat is returned.
   * @param topic - Optional topic for custom chats.
   * @returns Chat identifier corresponding to the resolved conversation.
   * @throws Error when synchronization with Microsoft Graph fails.
   */
  async getOrSyncChat(token: string): Promise<string>;
  async getOrSyncChat(
    token: string,
    participants?: Array<{ userId: string; azureAdObjectId: string }>,
    topic?: string
  ): Promise<string> {
    try {
      if (!participants || !topic) {
        return await this.getContactManagersChatId();
      }

      if (participants.length === 2) {
        return await this.createSpecificChat(token, participants, topic);
      }

      const graphParticipants = participants.map((p) => ({
        userId: p.userId,
        oid: p.azureAdObjectId.toLowerCase()
      }));

      const chatId = await this.createGraphChat(token, graphParticipants, topic);
      await this.ensureChatRecordAndMembers(chatId, topic, graphParticipants);
      return chatId;
    } catch (error: unknown) {
      throw wrapChatServiceError('Failed to get or sync chat', error);
    }
  }

  /**
   * Ensures the Contact Managers chat exists and that only allowed roles remain members.
   *
   * @returns Chat identifier in Microsoft Teams.
   * @throws Error when no eligible users are found or Graph operations fail.
   */
  async getContactManagersChatId(): Promise<string> {
    const chatTopic = 'InContactApp – Contact Managers';
    return this.ensureManagedChat(chatTopic, 'Contact Managers', async () =>
      this.buildParticipantsForRoles('Contact Managers', [UserRole.SuperAdmin, UserRole.Admin, UserRole.ContactManager])
    );
  }

  /**
   * Ensures the Snapshot Reports chat exists and is limited to the configured roles.
   *
   * @returns Chat identifier in Microsoft Teams.
   * @throws Error when no eligible users are found or Graph operations fail.
   */
  async getSnapshotReportsChatId(): Promise<string> {
    const chatTopic = 'InContactApp – Snapshot Reports';
    return this.ensureManagedChat(chatTopic, 'Snapshot Reports', async () =>
      this.buildParticipantsForRoles('Snapshot Reports', [UserRole.SuperAdmin, UserRole.Admin])
    );
  }

  /**
   * Creates or synchronizes a managed chat, enforcing membership and persisting metadata.
   *
   * @param chatTopic - Topic used to identify the managed chat.
   * @param context - Log context used for diagnostics.
   * @param participantsFactory - Function that resolves the desired participant list.
   * @returns Chat identifier that is guaranteed to exist.
   * @throws Error when no participants are resolved.
   */
  private async ensureManagedChat(
    chatTopic: string,
    context: string,
    participantsFactory: () => Promise<Array<{ userId: string; oid: string }>>
  ): Promise<string> {
    const desired = await participantsFactory();

    if (!desired.length) {
      throw new ChatNoParticipantsError(`No participants resolved for ${context} chat`);
    }

    const graph = this.initGraphClientAsApp();
    const record = await prisma.chat.findFirst({
      where: { topic: chatTopic }
    });

    let chatId: string;

    if (record) {
      chatId = record.id;
      await this.syncChatMembersWithClient(graph, chatId, desired);
    } else {
      chatId = await this.createGraphChatWithClient(graph, desired, chatTopic);
    }

    await this.ensureChatRecordAndMembers(chatId, chatTopic, desired);
    return chatId;
  }

  /**
   * Resolves all users that should belong to a managed chat based on role membership.
   *
   * @param context - Name of the chat for logging purposes.
   * @param roles - Roles allowed to participate.
   * @returns Array of participants with database ids and AAD object ids.
   * @throws Error when no users with the specified roles are found.
   */
  private async buildParticipantsForRoles(
    context: string,
    roles: UserRole[]
  ): Promise<Array<{ userId: string; oid: string }>> {
    const participants = await prisma.user.findMany({
      where: { role: { in: roles } }
    });

    if (!participants.length) {
      throw new ChatNoParticipantsError(
        `No users with roles [${roles.join(', ')}] found to compose the ${context} chat`
      );
    }

    return participants
      .filter((user: any) => user.azureAdObjectId)
      .map((user: any) => ({
        userId: user.id,
        oid: String(user.azureAdObjectId).toLowerCase()
      }));
  }

  /**
   * Sends a message to the specified chat using app-only credentials.
   *
   * @param chatId - Microsoft Teams chat identifier.
   * @param message - Message payload (Adaptive Card data).
   * @returns Promise that resolves once the message is submitted to Graph.
   */
  async sendMessageAsApp(chatId: string, message: Record<string, unknown>): Promise<void> {
    const graph = this.initGraphClientAsApp();
    await this.sendMessageToChat(graph, chatId, message);
  }

  /**
   * Creates image card element for adaptive card
   * @param imageUrl - Image URL
   * @returns Image card element
   */
  private createImageCardElement(imageUrl: string): Record<string, unknown> {
    return {
      type: 'Image',
      url: imageUrl,
      size: 'Large',
      style: 'Default',
      width: '100%',
      height: 'auto',
      selectAction: {
        type: 'Action.OpenUrl',
        url: imageUrl
      }
    };
  }

  /**
   * Converts a value to a string representation safely
   * @param value - Value to convert
   * @returns String representation of the value
   */
  private valueToString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Creates a text block element for adaptive cards
   * @param label - Label for the field
   * @param value - Value to display
   * @returns TextBlock element or null if value is falsy
   */
  private createTextBlock(label: string, value: unknown): any {
    if (!value) {
      return null;
    }
    return {
      type: 'TextBlock',
      text: `**${label}:** ${this.valueToString(value)}`,
      wrap: true
    };
  }

  /**
   * Builds adaptive card body for snapshot report message
   * @param message - Message data
   * @returns Array of card body elements
   */
  private buildSnapshotReportCardBody(message: Record<string, unknown>): any[] {
    const cardBody: any[] = [];

    const fields = [
      { key: 'psoEmail', label: 'Email' },
      { key: 'capturedAt', label: 'Captured At (Central Time)' },
      { key: 'capturedBy', label: 'Captured By' },
      { key: 'reason', label: 'Reason' }
    ];

    for (const field of fields) {
      const textBlock = this.createTextBlock(field.label, message[field.key]);
      if (textBlock) {
        cardBody.push(textBlock);
      }
    }

    if (message.imageUrl && typeof message.imageUrl === 'string') {
      cardBody.push(this.createImageCardElement(message.imageUrl));
    }

    return cardBody;
  }

  /**
   * Builds adaptive card body for form report message
   * @param message - Message data
   * @returns Array of card body elements
   */
  private buildFormReportCardBody(message: Record<string, unknown>): any[] {
    const cardBody: any[] = [];
    const formType = typeof message.formType === 'string' ? message.formType : undefined;
    const formTypeLabel = formType ? this.humanizeFormType(formType) : 'Form';

    if (message.senderEmail && typeof message.senderEmail === 'string') {
      cardBody.push({
        type: 'TextBlock',
        text: `**Email:** ${message.senderEmail}`,
        wrap: true
      });
    }

    cardBody.push({
      type: 'TextBlock',
      text: `**Form Type:** ${formTypeLabel}`,
      wrap: true
    });

    if (message.data && typeof message.data === 'object') {
      cardBody.push(
        ...Object.entries(message.data).map(([key, value]: [string, any]) => ({
          type: 'TextBlock',
          text: `**${this.humanizeKey(key)}:** ${value}`,
          wrap: true
        }))
      );
    }

    if (message.imageUrl && typeof message.imageUrl === 'string') {
      cardBody.push(this.createImageCardElement(message.imageUrl));
    }

    return cardBody;
  }

  /**
   * Builds complete adaptive card body based on message type
   * @param message - Message data
   * @param subjectText - Subject text for card header
   * @returns Array of card body elements
   */
  private buildAdaptiveCardBody(message: Record<string, unknown>, subjectText: string): any[] {
    const messageType = message?.type ?? 'contactManagerForm';
    const cardBody: any[] = [
      {
        type: 'TextBlock',
        text: subjectText,
        weight: 'Bolder',
        size: 'Medium',
        wrap: true
      }
    ];

    if (messageType === 'snapshotReport') {
      /**
       * Converts psoName to string safely
       * Handles objects by JSON.stringify, null/undefined by default value, and primitive types
       * @param value - psoName value
       * @returns String representation of the value
       */
      const psoNameToString = (value: unknown): string => {
        if (typeof value === 'string') {
          return value;
        }
        if (value == null) {
          return 'Unknown';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        // At this point, value is a primitive (number, boolean, symbol, bigint, function, undefined)
        // Handle each primitive type explicitly to avoid object stringification
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
          return String(value);
        }
        if (typeof value === 'symbol') {
          return value.toString();
        }
        if (typeof value === 'function') {
          return value.toString();
        }
        // This should never be reached in practice, but provide a safe fallback
        return 'Unknown';
      };
      
      const psoNameStr = psoNameToString(message.psoName);
      cardBody.push(
        {
          type: 'TextBlock',
          text: 'A new snapshot report has been received.',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: `**PSO:** ${psoNameStr}`,
          wrap: true
        },
        ...this.buildSnapshotReportCardBody(message)
      );
    } else {
      cardBody.push(
        {
          type: 'TextBlock',
          text: `**PSO** **${message.senderName}** has submitted the following report:`,
          wrap: true
        },
        ...this.buildFormReportCardBody(message)
      );
    }

    return cardBody;
  }

  /**
   * Posts an adaptive card message to the given chat.
   * @param graph - Graph client already authenticated.
   * @param chatId - Chat identifier.
   * @param message - Domain message payload to format into an adaptive card.
   */
  private async sendMessageToChat(graph: Client, chatId: string, message: Record<string, unknown>): Promise<void> {
    try {
      const subjectText = (typeof message?.subject === 'string' ? message.subject : null) ?? 'Notification';
      const cardBody = this.buildAdaptiveCardBody(message, subjectText);

      const cardPayload = {
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: cardBody
      };

      const attachmentId = `card-${Date.now()}`;
      const messagePayload = {
        body: {
          contentType: 'html',
          content: `<attachment id="${attachmentId}"></attachment>`
        },
        attachments: [
          {
            id: attachmentId,
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: JSON.stringify(cardPayload)
          }
        ]
      };

      await graph.api(`/chats/${chatId}/messages`).post(messagePayload);
    } catch (error: unknown) {
      throw wrapChatServiceError('Failed to send message', error);
    }
  }

  /**
   * Creates a Graph client authenticated with the caller's token (on-behalf-of flow).
   *
   * @param userAssertion - Bearer token received from the caller.
   * @returns Graph client authenticated on behalf of the caller.
   */
  private initGraphClient(userAssertion: string): Client {
    const credential = new OnBehalfOfCredential({
      tenantId: this.tenantId,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      userAssertionToken: userAssertion,
    });

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: [
        'https://graph.microsoft.com/Chat.ReadWrite',
        'https://graph.microsoft.com/ChatMember.ReadWrite',
        'https://graph.microsoft.com/User.Read'
      ],
    });

    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Creates a Graph client authenticated as the application using client credentials.
   */
  private initGraphClientAsApp(): Client {
    const credential = new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Creates a new Teams group chat via Microsoft Graph using the caller's token.
   *
   * @param token - Caller token.
   * @param participants - Participants to include.
   * @param topic - Topic for the chat.
   * @returns Chat identifier.
   */
  private async createGraphChat(
    token: string,
    participants: readonly { userId: string; oid: string }[],
    topic: string
  ): Promise<string> {
    const graph = this.initGraphClient(token);
    return await this.createGraphChatWithClient(graph, participants, topic);
  }

  /**
   * Adds participants to a chat in batches using the provided Graph client.
   *
   * @param graph - Graph client.
   * @param chatId - Chat identifier.
   * @param participants - Participants to add.
   * @returns Promise that resolves once all batches are processed.
   */
  private async addParticipantsInBatchesWithClient(
    graph: Client,
    chatId: string,
    participants: readonly { userId: string; oid: string }[]
  ): Promise<void> {
    const BATCH_SIZE = 10;

    for (let i = 0; i < participants.length; i += BATCH_SIZE) {
      const batch = participants.slice(i, i + BATCH_SIZE);

      for (const participant of batch) {
        try {
          await graph.api(`/chats/${chatId}/members`).post({
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${participant.oid}')`
          });
        } catch {
          // Failed to add participant - continue with next
        }
      }

      if (i + BATCH_SIZE < participants.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Creates a group chat or synchronizes membership when it already exists.
   *
   * @param graph - Graph client.
   * @param participants - Desired participants.
   * @param topic - Chat topic.
   * @returns Chat identifier.
   * @throws Error when Graph chat creation fails.
   */
  private async createGraphChatWithClient(
    graph: Client,
    participants: readonly { userId: string; oid: string }[],
    topic: string
  ): Promise<string> {
    try {
      const existingChats = await graph
        .api('/chats')
        .filter(`topic eq '${topic}'`)
        .get();

      if (existingChats.value && existingChats.value.length > 0) {
        const existingChatId = existingChats.value[0].id;
        await this.syncChatMembersWithClient(graph, existingChatId, participants);
        return existingChatId;
      }
    } catch {
      // No existing chat found or filter not supported; proceed to create
    }

    const MAX_INITIAL_MEMBERS = 120;
    const initialParticipants = participants.slice(0, MAX_INITIAL_MEMBERS);
    const members = initialParticipants.map((p) => ({
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      roles: ['owner'],
      'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${p.oid}')`
    }));

    try {
      const graphChat: any = await graph
        .api('/chats')
        .post({ chatType: 'group', topic, members });

      if (participants.length > MAX_INITIAL_MEMBERS) {
        await this.addParticipantsInBatchesWithClient(
          graph,
          graphChat.id,
          participants.slice(MAX_INITIAL_MEMBERS)
        );
      }

      await this.syncChatMembersWithClient(graph, graphChat.id, participants);
      return graphChat.id;
    } catch (error: unknown) {
      throw wrapChatServiceError('Failed to create Graph chat', error);
    }
  }

  /**
   * Aligns the actual chat membership with the desired participant list.
   *
   * @param graph - Graph client.
   * @param chatId - Chat identifier.
   * @param desired - Desired participants.
   * @returns Promise that resolves when synchronization completes.
   */
  private async syncChatMembersWithClient(
    graph: Client,
    chatId: string,
    desired: readonly { userId: string; oid: string }[]
  ): Promise<void> {
    try {
      const resp = await graph.api(`/chats/${chatId}/members`).get() as { value: GraphChatMember[] };
      const graphMembers = resp.value.map((m) => ({
        oid: (m.user?.id as string)?.toLowerCase(),
        memberId: m.id
      }));

      const desiredOids = new Set(desired.map((d) => d.oid));
      const toAdd = desired.filter((d) => !graphMembers.some((g) => g.oid === d.oid));
      const protectedSuperAdminOids = new Set(
        (
          await prisma.user.findMany({
            where: {
              role: { in: ['SuperAdmin'] }
            },
            select: { azureAdObjectId: true }
          })
        )
          .map((record) => record?.azureAdObjectId)
          .filter((oid): oid is string => typeof oid === 'string' && oid !== '')
          .map((oid) => oid.toLowerCase())
      );

      const toRemove = graphMembers.filter(
        (g) =>
          g.oid &&
          !desiredOids.has(g.oid) &&
          !protectedSuperAdminOids.has(g.oid)
      );

      if (toAdd.length > 0) {
        await this.addParticipantsInBatchesWithClient(graph, chatId, toAdd);
      }

      for (const member of toRemove) {
        try {
          await graph.api(`/chats/${chatId}/members/${member.memberId}`).delete();
        } catch {
          // Failed to remove member - continue with next
        }
      }
    } catch {
      // Failed to sync members - fail silently
    }
  }

  /**
   * Updates the local persistence to reflect the current participant list.
   *
   * @param chatId - Chat identifier.
   * @param participants - Participants that should remain in the chat.
   * @returns Promise that resolves when the database is updated.
   */
  private async syncChatParticipantsInDb(
    chatId: string,
    participants: readonly { userId: string; oid: string }[]
  ): Promise<void> {
    const desiredIds = participants.map((p) => p.userId);

    await prisma.chatParticipant.deleteMany({
      where: {
        chatId,
        userId: { notIn: desiredIds }
      }
    });

    for (const participant of participants) {
      await prisma.chatParticipant.upsert({
        where: {
          chatId_userId: {
            chatId,
            userId: participant.userId
          }
        },
        update: {
          joinedAt: getCentralAmericaTime()
        },
        create: {
          chatId,
          userId: participant.userId,
          joinedAt: getCentralAmericaTime()
        }
      });
    }
  }

  /**
   * Guarantees the chat record exists and that local membership matches the desired state.
   */
  private async ensureChatRecordAndMembers(
    chatId: string,
    topic: string,
    participants: readonly { userId: string; oid: string }[]
  ): Promise<void> {
    const existing = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (existing) {
      return;
    }

    await prisma.chat.create({
      data: {
        id: chatId,
        topic,
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime(),
        members: {
          create: participants.map((p) => ({
            userId: p.userId,
            joinedAt: getCentralAmericaTime()
          }))
        }
      }
    });

    await this.syncChatParticipantsInDb(chatId, participants);
  }

  /**
   * Creates or reuses a one-on-one chat between two participants.
   *
   * @param token - Caller token used for delegated Graph calls.
   * @param participants - Exactly two participants (database id + AAD object id).
   * @param topic - Topic to assign to the chat.
   * @returns Chat identifier.
   * @throws Error when participant count is not equal to two.
   */
  private async createSpecificChat(
    token: string, 
    participants: Array<{ userId: string; azureAdObjectId: string }>, 
    topic: string
  ): Promise<string> {
    if (participants.length !== 2) {
      throw new ChatInvalidParticipantsError("createSpecificChat requires exactly 2 participants");
    }

    const [p1, p2] = participants;
    const participantIds = [p1.userId, p2.userId].sort((a, b) => a.localeCompare(b));

    // Check for existing chat
    const existingChat = await prisma.chat.findFirst({
      where: {
        topic,
        AND: [
          { members: { some: { userId: participantIds[0] } } },
          { members: { some: { userId: participantIds[1] } } },
          { members: { every: { userId: { in: participantIds } } } },
        ],
      },
      include: { members: { select: { userId: true } } },
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Create new chat using Microsoft Graph API (moved from legacy)
    return await this.createGraphOneOnOneChat(token, participants, topic);
  }

  /**
   * Creates a one-on-one chat via Microsoft Graph API.
   *
   * @param token - Caller token used for delegated Graph calls.
   * @param participants - Exactly two participants.
   * @param topic - Chat topic.
   * @returns Chat identifier.
   */
  private async createGraphOneOnOneChat(
    token: string,
    participants: Array<{ userId: string; azureAdObjectId: string }>,
    topic: string
  ): Promise<string> {
    const graph = this.initGraphClient(token);

    // Resolve roles for both participants (owner vs guest)
    const membersPayload = await Promise.all(
      participants.map(async (p) => {
        const user = await graph
          .api(`/users/${p.azureAdObjectId}`)
          .select("userType")
          .get();
        const role = user.userType === "Guest" ? "guest" : "owner";
        return {
          "@odata.type": "#microsoft.graph.aadUserConversationMember",
          roles: [role],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p.azureAdObjectId}')`,
        };
      })
    );

    const payload = {
      chatType: "oneOnOne",
      members: membersPayload,
    };

    const graphChat = await graph.api("/chats").post(payload);
    const chatId: string = graphChat.id;

    // Persist in database
    await prisma.chat.create({
      data: {
        id: chatId,
        topic,
        createdAt: getCentralAmericaTime(),
        updatedAt: getCentralAmericaTime(),
        members: { create: participants.map((p) => ({ userId: p.userId, joinedAt: getCentralAmericaTime() })) },
      },
    });

    return chatId;
  }

  /**
   * Converts a camelCase or snake_case key into a human-readable label.
   *
   * @param key - Original property name.
   * @returns Human-readable label.
   */
  private humanizeKey(key: string): string {
    return key
      .replaceAll(/([A-Z])/g, ' $1')
      .replace(/^./, (str: string) => str.toUpperCase())
      .trim();
  }

  /**
   * Produces a readable form type label for adaptive card rendering.
   *
   * @param formType - Form type string.
   * @returns Human-readable form type.
   */
  private humanizeFormType(formType: string | undefined): string {
    if (!formType) {
      return 'Unknown';
    }

    const map: Record<string, string> = {
      DISCONNECTIONS: 'Disconnections',
      ADMISSIONS: 'Admissions',
      ASSISTANCE: 'Acute Assessment'
    };

    if (map[formType]) {
      return map[formType];
    }

    return formType
      .toLowerCase()
      .split(/[_\s]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

}

