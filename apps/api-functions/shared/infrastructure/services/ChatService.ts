/**
 * @fileoverview ChatService
 * @description Infrastructure service that manages Teams chats using Microsoft Graph.
 */

import { IChatService } from '../../domain/interfaces/IChatService';
import { ClientSecretCredential, OnBehalfOfCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import prisma from '../database/PrismaClientService';
import { ServiceAccountManager } from './ServiceAccountManager';
import { IServiceAccountCredentials } from '../../domain/interfaces/IServiceAccountCredentials';
import { UserRole } from '../../domain/enums/UserRole';

export class ChatService implements IChatService {
  private tenantId = process.env.AZURE_TENANT_ID!;
  private clientId = process.env.AZURE_CLIENT_ID!;
  private clientSecret = process.env.AZURE_CLIENT_SECRET!;
  private readonly serviceAccountScopes = [
    'https://graph.microsoft.com/Chat.ReadWrite',
    'https://graph.microsoft.com/ChatMessage.Send'
  ];

  constructor(private readonly serviceAccountManager: ServiceAccountManager) {}

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
    } catch (error: any) {
      console.error('ChatService.getOrSyncChat error:', error);
      throw new Error(`Failed to get or sync chat: ${error.message}`);
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
    return this.ensureManagedChat(chatTopic, 'Contact Managers', async (_serviceAccount) =>
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
    return this.ensureManagedChat(chatTopic, 'Snapshot Reports', async (_serviceAccount) =>
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
    participantsFactory: (
      serviceAccount: IServiceAccountCredentials
    ) => Promise<Array<{ userId: string; oid: string }>>
  ): Promise<string> {
    console.log('[ChatService] ensureManagedChat invoked', { chatTopic, context });

    const serviceAccount = await this.serviceAccountManager.ensureServiceAccount();
    const serviceAccountOid = serviceAccount.azureAdObjectId.toLowerCase();
    const desired = await participantsFactory(serviceAccount);

    if (!desired.length) {
      throw new Error(`No participants resolved for ${context} chat`);
    }

    if (!desired.some((member) => member.oid === serviceAccountOid)) {
      const serviceAccountUser = await prisma.user.findUnique({
        where: { azureAdObjectId: serviceAccount.azureAdObjectId }
      });

      if (serviceAccountUser) {
        desired.push({
          userId: serviceAccountUser.id,
          oid: serviceAccountOid
        });
      } else {
        console.warn('[ChatService] Service account user not found in database; skipping chat membership', {
          context,
          serviceAccountOid
        });
      }
    }

    const graph = this.initGraphClientAsApp();
    const record = await prisma.chat.findFirst({
      where: { topic: chatTopic }
    });

    let chatId: string;

    if (!record) {
      chatId = await this.createGraphChatWithClient(graph, desired, chatTopic);
      console.log('[ChatService] Created new managed chat', { chatId, context });
    } else {
      chatId = record.id;
      await this.syncChatMembersWithClient(graph, chatId, desired);
      console.log('[ChatService] Synced existing managed chat members', { chatId, context });
    }

    await this.ensureChatRecordAndMembers(chatId, chatTopic, desired);
    console.log('[ChatService] Managed chat ready', { chatId, context });
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

    console.log('[ChatService] Found eligible users for chat', {
      context,
      roles,
      count: participants.length,
      userIds: participants.map((user: any) => user.id)
    });

    if (!participants.length) {
      throw new Error(
        `No users with roles [${roles.join(', ')}] found to compose the ${context} chat`
      );
    }

    const participantsWithoutOid = participants.filter((user: any) => !user.azureAdObjectId);
    if (participantsWithoutOid.length) {
      console.warn('[ChatService] Users missing azureAdObjectId; skipping in chat sync', {
        context,
        userIds: participantsWithoutOid.map((user: any) => user.id)
      });
    }

    return participants
      .filter((user: any) => user.azureAdObjectId)
      .map((user: any) => ({
        userId: user.id,
        oid: String(user.azureAdObjectId).toLowerCase()
      }));
  }

  /**
   * Sends a message to the specified chat impersonating the managed service account.
   *
   * @param chatId - Microsoft Teams chat identifier.
   * @param message - Message payload (Adaptive Card data).
   * @returns Promise that resolves once the message is submitted to Graph.
   */
  async sendMessageAsServiceAccount(chatId: string, message: any): Promise<void> {
    console.log('[ChatService] Sending message with service account', {
      chatId,
      subject: message?.subject,
      hasImage: Boolean(message?.imageUrl)
    });

    const accessToken = await this.serviceAccountManager.getDelegatedToken(this.serviceAccountScopes);
    const graph = this.initGraphClientWithAccessToken(accessToken);
    await this.sendMessageToChat(graph, chatId, message);
  }

  /**
   * Posts an adaptive card message to the given chat.
   * @param graph - Graph client already authenticated.
   * @param chatId - Chat identifier.
   * @param message - Domain message payload to format into an adaptive card.
   */
  private async sendMessageToChat(graph: any, chatId: string, message: any): Promise<void> {
    try {
      const messageType = message?.type ?? 'contactManagerForm';
      const subjectText = message?.subject ?? 'Notification';

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
        cardBody.push(
          {
            type: 'TextBlock',
            text: 'A new snapshot report has been received.',
            wrap: true
          },
          {
            type: 'TextBlock',
            text: `**PSO:** ${message.psoName ?? 'Unknown'}`,
            wrap: true
          }
        );

        if (message.psoEmail) {
          cardBody.push({
            type: 'TextBlock',
            text: `**Email:** ${message.psoEmail}`,
            wrap: true
          });
        }

        if (message.capturedAt) {
          cardBody.push({
            type: 'TextBlock',
            text: `**Captured At (Central Time):** ${message.capturedAt}`,
            wrap: true
          });
        }

        if (message.capturedBy) {
          cardBody.push({
            type: 'TextBlock',
            text: `**Captured By:** ${message.capturedBy}`,
            wrap: true
          });
        }

        if (message.reason) {
          cardBody.push({
            type: 'TextBlock',
            text: `**Reason:** ${message.reason}`,
            wrap: true
          });
        }

        if (message.imageUrl) {
          cardBody.push({
            type: 'Image',
            url: message.imageUrl,
            size: 'Large',
            style: 'Default',
            width: '100%',
            height: 'auto',
            selectAction: {
              type: 'Action.OpenUrl',
              url: message.imageUrl
            }
          });
        }
      } else {
        const formTypeLabel = this.humanizeFormType(message.formType);
        cardBody.push(
          {
            type: 'TextBlock',
            text: `**PSO** **${message.senderName}** has submitted the following report:`,
            wrap: true
          },
        );

        if (message.senderEmail) {
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

        if (message.data) {
          cardBody.push(
            ...Object.entries(message.data).map(([key, value]: [string, any]) => ({
              type: 'TextBlock',
              text: `**${this.humanizeKey(key)}:** ${value}`,
              wrap: true
            }))
          );
        }

        if (message.imageUrl) {
          cardBody.push({
            type: 'Image',
            url: message.imageUrl,
            size: 'Large',
            style: 'Default',
            width: '100%',
            height: 'auto',
            selectAction: {
              type: 'Action.OpenUrl',
              url: message.imageUrl
            }
          });
        }
      }

      const cardPayload = {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
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
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
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
   * Creates a Graph client using an access token acquired elsewhere.
   *
   * @param accessToken - OAuth access token.
   * @returns Graph client that uses the provided access token.
   */
  private initGraphClientWithAccessToken(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => done(null, accessToken)
    });
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
        } catch (error: any) {
          console.warn(`Failed to add participant ${participant.oid}:`, error.message);
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
    } catch (error: any) {
      console.error('Failed to create Graph chat:', error);
      throw error;
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
      const serviceAccount = await this.serviceAccountManager.ensureServiceAccount();
      const serviceAccountOid = serviceAccount.azureAdObjectId.toLowerCase();

      const resp: any = await graph.api(`/chats/${chatId}/members`).get();
      const graphMembers = (resp.value as any[]).map((m) => ({
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
          .filter((oid): oid is string => Boolean(oid))
          .map((oid) => oid.toLowerCase())
      );

      const toRemove = graphMembers.filter(
        (g) =>
          g.oid &&
          !desiredOids.has(g.oid) &&
          g.oid !== serviceAccountOid &&
          !protectedSuperAdminOids.has(g.oid)
      );

      if (toAdd.length > 0) {
        await this.addParticipantsInBatchesWithClient(graph, chatId, toAdd);
      }

      for (const member of toRemove) {
        try {
          await graph.api(`/chats/${chatId}/members/${member.memberId}`).delete();
        } catch (error: any) {
          console.warn(`Failed to remove member ${member.oid}:`, error.message);
        }
      }
    } catch (error: any) {
      console.warn(`Failed to sync members for chat ${chatId}:`, error.message);
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

    if (!existing) {
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
    } else {
      await prisma.chat.update({
        where: { id: chatId },
        data: {
          topic,
          updatedAt: getCentralAmericaTime()
        }
      });
    }

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
      throw new Error("createSpecificChat requires exactly 2 participants");
    }

    const [p1, p2] = participants;
    const participantIds = [p1.userId, p2.userId].sort();

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
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
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

