/**
 * @fileoverview ChatService - Infrastructure service for chat operations
 * @description Implements chat operations using Microsoft Graph API
 */

import { IChatService } from '../../domain/interfaces/IChatService';
import { OnBehalfOfCredential, ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import prisma from '../database/PrismaClientService';

/**
 * Infrastructure service for chat operations
 */
export class ChatService implements IChatService {
  private tenantId = process.env.AZURE_TENANT_ID!;
  private clientId = process.env.AZURE_CLIENT_ID!;
  private clientSecret = process.env.AZURE_CLIENT_SECRET!;

  /**
   * Gets or creates a chat for contact managers
   * @param token - Authentication token from the user
   * @returns Promise that resolves to chat ID
   * @throws Error if chat operation fails
   */
  async getOrSyncChat(token: string): Promise<string>;
  async getOrSyncChat(token: string, participants?: Array<{ userId: string; azureAdObjectId: string }>, topic?: string): Promise<string> {
    try {
      // If participants and topic are provided, use them for specific chat creation
      if (participants && topic) {
        return await this.createSpecificChat(token, participants, topic);
      }

      // Default behavior: Contact Managers chat
      const chatTopic = 'InContactApp – Contact Managers';

      // Load only Contact Managers, Admins, and Super Admins from DB
      const users = await prisma.user.findMany({
        where: { role: { in: ['Admin', 'ContactManager', 'SuperAdmin'] } }
      });
      console.log(`Found ${users.length} users for contact managers chat`);
      
      const desired = users.map((u: any) => ({ userId: u.id, oid: u.azureAdObjectId.toLowerCase() }));
      console.log('Desired participants:', desired);

      // Check for existing record
      const record = await prisma.chat.findFirst({
        where: { topic: chatTopic },
        include: { members: true }
      });

      let chatId: string;
      if (!record) {
        console.log('No existing chat found, creating new one...');
        // Create new chat in Graph using user token
        chatId = await this.createGraphChat(token, desired, chatTopic);
        console.log('Created chat with ID:', chatId);

        // Persist in DB with correct ID
        await prisma.chat.create({
          data: {
            id: chatId,
            topic: chatTopic,
            createdAt: getCentralAmericaTime(),
            updatedAt: getCentralAmericaTime(),
            members: { create: desired.map(d => ({ userId: d.userId, joinedAt: getCentralAmericaTime() })) }
          }
        });
        console.log('Chat persisted to database');
      } else {
        chatId = record.id;
        console.log('Found existing chat:', chatId);
        // Skip sync - Employee is not a member and cannot sync
        console.log('Skipping chat membership sync - Employee is not a member');
      }

      return chatId;
    } catch (error: any) {
      console.error('ChatService.getOrSyncChat error:', error);
      throw new Error(`Failed to get or sync chat: ${error.message}`);
    }
  }

  /**
   * Sends a message to a chat by temporarily adding the user to the chat
   * @param token - Authentication token from the user
   * @param chatId - ID of the chat
   * @param message - Message content
   * @returns Promise that resolves when message is sent
   * @throws Error if message sending fails
   */
  async sendMessage(token: string, chatId: string, message: any): Promise<void> {
    try {
      const graph = this.initGraphClient(token);
      
      // 1. Get current user info to add them temporarily to the chat
      const currentUser = await graph.api('/me').get();
      const userId = currentUser.id;
      
      console.log(`Temporarily adding user ${userId} to chat ${chatId}`);
      
      // 2. Add user to chat temporarily
      await this.addUserToChatTemporarily(token, chatId, userId);
      
      // 3. Send the message
      await this.sendMessageToChat(graph, chatId, message);
      
      // 4. Remove user from chat
      await this.removeUserFromChat(token, chatId, userId);
      
      console.log(`User ${userId} removed from chat ${chatId}`);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Adds a user to a chat temporarily
   */
  private async addUserToChatTemporarily(token: string, chatId: string, userId: string): Promise<void> {
    const graph = this.initGraphClient(token);
    
    try {
      await graph.api(`/chats/${chatId}/members`).post({
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`
      });
      console.log(`Successfully added user ${userId} to chat ${chatId}`);
    } catch (error: any) {
      // If user is already in chat, that's fine
      if (error.message?.includes('already a member')) {
        console.log(`User ${userId} is already a member of chat ${chatId}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Removes a user from a chat
   */
  private async removeUserFromChat(token: string, chatId: string, userId: string): Promise<void> {
    const graph = this.initGraphClient(token);
    
    try {
      // First, get the member ID
      const members = await graph.api(`/chats/${chatId}/members`).get();
      const member = members.value.find((m: any) => m.userId === userId);
      
      if (member) {
        await graph.api(`/chats/${chatId}/members/${member.id}`).delete();
        console.log(`Successfully removed user ${userId} from chat ${chatId}`);
      }
    } catch (error: any) {
      console.warn(`Failed to remove user ${userId} from chat ${chatId}:`, error.message);
      // Don't throw error - this is cleanup
    }
  }

  /**
   * Sends the actual message to the chat
   */
  private async sendMessageToChat(graph: any, chatId: string, message: any): Promise<void> {
    try {
      // Build the Adaptive Card JSON object
      const cardPayload = {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
          {
            type: 'TextBlock',
            text: message.subject,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: `Sender: ${message.senderName}`,
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: `Form Type: ${message.formType}`,
            wrap: true,
          },
          // Map each data field into its own TextBlock with a humanized label
          ...Object.entries(message.data).map(([key, value]: [string, any]) => ({
            type: 'TextBlock',
            text: `**${this.humanizeKey(key)}:** ${value}`,
            wrap: true,
          })),
          // Optionally include an image
          ...(message.imageUrl
            ? [
                {
                  type: 'Image',
                  url: message.imageUrl,
                  size: 'Medium',
                  style: 'Default',
                },
              ]
            : []),
        ],
      };

      // Generate a unique ID for the attachment
      const attachmentId = `card-${Date.now()}`;

      // Construct the chatMessage with attachments
      const messagePayload = {
        body: {
          contentType: 'html',
          content: `<attachment id="${attachmentId}"></attachment>`,
        },
        attachments: [
          {
            id: attachmentId,
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: JSON.stringify(cardPayload),
          },
        ],
      };

      // Post the message to the chat
      await graph
        .api(`/chats/${chatId}/messages`)
        .post(messagePayload);
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Initializes a Graph client with user token
   */
  private initGraphClient(userAssertion: string): Client {
    const credential = new OnBehalfOfCredential({
      tenantId: this.tenantId,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      userAssertionToken: userAssertion,
    });

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Creates a new Teams group chat via Microsoft Graph
   */
  private async createGraphChat(
    token: string,
    participants: readonly { userId: string; oid: string }[],
    topic: string
  ): Promise<string> {
    console.log('Creating Graph chat with participants:', participants.length);
    
    const graph = this.initGraphClient(token);

    // Microsoft Teams has limits on chat creation - try with smaller batches
    const MAX_INITIAL_MEMBERS = 20; // Start with a smaller group
    const initialParticipants = participants.slice(0, MAX_INITIAL_MEMBERS);
    
    const members = initialParticipants.map(p => ({
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      roles: ['owner'],
      'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${p.oid}')`
    }));

    console.log(`Creating chat with ${initialParticipants.length} initial members`);

    try {
      const graphChat: any = await graph
        .api('/chats')
        .post({ chatType: 'group', topic, members });

      console.log('Graph chat created successfully:', graphChat.id);
      
      if (participants.length > MAX_INITIAL_MEMBERS) {
        console.log(`Adding remaining ${participants.length - MAX_INITIAL_MEMBERS} participants in batches`);
        await this.addParticipantsInBatches(token, graphChat.id, participants.slice(MAX_INITIAL_MEMBERS));
      }
      
      return graphChat.id;
    } catch (error: any) {
      console.error('Failed to create Graph chat:', error);
      throw error;
    }
  }

  /**
   * Adds participants to a chat in batches
   */
  private async addParticipantsInBatches(
    token: string,
    chatId: string,
    remainingParticipants: readonly { userId: string; oid: string }[]
  ): Promise<void> {
    const graph = this.initGraphClient(token);
    const BATCH_SIZE = 10; // Add 10 participants at a time
    
    for (let i = 0; i < remainingParticipants.length; i += BATCH_SIZE) {
      const batch = remainingParticipants.slice(i, i + BATCH_SIZE);
      console.log(`Adding batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} participants`);
      
      for (const participant of batch) {
        try {
          await graph.api(`/chats/${chatId}/members`).post({
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${participant.oid}')`
          });
          console.log(`Successfully added participant: ${participant.oid}`);
        } catch (error: any) {
          console.warn(`Failed to add participant ${participant.oid}:`, error.message);
        }
      }
      
      if (i + BATCH_SIZE < remainingParticipants.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Syncs chat members with desired participants
   */
  private async syncGraphMembers(
    token: string,
    currentParticipants: { userId: string; chatId: string }[],
    desired: { userId: string; oid: string }[],
    chatId: string
  ): Promise<void> {
    const graph = this.initGraphClient(token);

    // Get current Graph members
    const resp: any = await graph.api(`/chats/${chatId}/members`).get();
    const graphMembers = (resp.value as any[]).map(m => ({
      oid: m.user?.id?.toLowerCase(),
      memberId: m.id
    }));

    const desiredOids = desired.map(d => d.oid);
    const toAdd = desired.filter(d => !graphMembers.some(g => g.oid === d.oid));
    const toRemove = graphMembers.filter(g => !desiredOids.includes(g.oid));

    // Add missing members
    for (const d of toAdd) {
      try {
        await graph.api(`/chats/${chatId}/members`).post({
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${d.oid}')`
        });
        console.log(`Added member: ${d.oid}`);
      } catch (error: any) {
        console.warn(`Failed to add member ${d.oid}:`, error.message);
      }
    }

    // Remove extra members
    for (const g of toRemove) {
      try {
        await graph.api(`/chats/${chatId}/members/${g.memberId}`).delete();
        console.log(`Removed member: ${g.oid}`);
      } catch (error: any) {
        console.warn(`Failed to remove member ${g.oid}:`, error.message);
      }
    }
  }

  /**
   * Creates a specific chat between two participants
   * @param token - Authentication token
   * @param participants - Array of exactly two participants
   * @param topic - Chat topic
   * @returns Promise that resolves to chat ID
   * @private
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
   * Creates a one-on-one chat via Microsoft Graph API
   * @param token - Authentication token
   * @param participants - Array of exactly two participants
   * @param topic - Chat topic
   * @returns Promise that resolves to chat ID
   * @private
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
   * Humanizes a key for display in the adaptive card
   */
  private humanizeKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}