/**
 * @fileoverview ChatService - Infrastructure service for chat operations
 * @description Implements chat operations using Microsoft Graph API
 */

import { IChatService } from '../../domain/interfaces/IChatService';
import { OnBehalfOfCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import prisma from '../../services/prismaClienService';

/**
 * Infrastructure service for chat operations
 */
export class ChatService implements IChatService {
  private tenantId = process.env.AZURE_TENANT_ID!;
  private clientId = process.env.AZURE_CLIENT_ID!;
  private clientSecret = process.env.AZURE_CLIENT_SECRET!;

  /**
   * Gets or creates a chat for contact managers
   * @param token - Authentication token
   * @returns Promise that resolves to chat ID
   * @throws Error if chat operation fails
   */
  async getOrSyncChat(token: string): Promise<string> {
    try {
      const topic = 'InContactApp – Contact Managers';

      // Load all relevant users from DB
      const users = await prisma.user.findMany({
        where: { role: { in: ['Employee', 'Admin', 'ContactManager', 'SuperAdmin'] } }
      });
      console.log(`Found ${users.length} users for contact managers chat`);
      
      const desired = users.map((u: any) => ({ userId: u.id, oid: u.azureAdObjectId.toLowerCase() }));
      console.log('Desired participants:', desired);

      // Check for existing record
      const record = await prisma.chat.findFirst({
        where: { topic },
        include: { members: true }
      });

      let chatId: string;
      if (!record) {
        console.log('No existing chat found, creating new one...');
        // Create new chat in Graph
        chatId = await this.createGraphChat(token, desired, topic);
        console.log('Created chat with ID:', chatId);

        // Persist in DB with correct ID
        await prisma.chat.create({
          data: {
            id: chatId,
            topic,
            members: { create: desired.map(d => ({ userId: d.userId })) }
          }
        });
        console.log('Chat persisted to database');
      } else {
        chatId = record.id;
        console.log('Found existing chat:', chatId);
        // Sync membership
        await this.syncGraphMembers(token, record.members, desired, chatId);
        console.log('Chat membership synced');
      }

      return chatId;
    } catch (error: any) {
      console.error('ChatService.getOrSyncChat error:', error);
      throw new Error(`Failed to get or sync chat: ${error.message}`);
    }
  }

  /**
   * Sends a message to a chat
   * @param token - Authentication token
   * @param chatId - ID of the chat
   * @param message - Message content
   * @returns Promise that resolves when message is sent
   * @throws Error if message sending fails
   */
  async sendMessage(token: string, chatId: string, message: any): Promise<void> {
    try {
      const graph = this.initGraphClient(token);

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
   * Creates a new Teams group chat via Microsoft Graph
   * @param token - The OBO token
   * @param participants - Array of { userId, oid } for each member
   * @param topic - The chat topic/title
   * @returns The newly created chatId
   */
  private async createGraphChat(
    token: string,
    participants: readonly { userId: string; oid: string }[],
    topic: string
  ): Promise<string> {
    console.log('Creating Graph chat with participants:', participants);
    
    const graph = this.initGraphClient(token);

    const members = participants.map(p => ({
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      roles: ['owner'],
      'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${p.oid}')`
    }));

    console.log('Graph chat members payload:', members);

    try {
      const graphChat: any = await graph
        .api('/chats')
        .post({ chatType: 'group', topic, members });

      console.log('Graph chat created successfully:', graphChat.id);
      return graphChat.id;
    } catch (error: any) {
      console.error('Failed to create Graph chat:', error);
      throw error;
    }
  }

  /**
   * Synchronizes the Teams chat's membership
   * @param token - The OBO token
   * @param currentParticipants - The array of ChatParticipant records from DB
   * @param desired - The up-to-date list of { userId, oid }
   * @param chatId - The Teams chat identifier
   */
  private async syncGraphMembers(
    token: string,
    currentParticipants: { userId: string; chatId: string }[],
    desired: { userId: string; oid: string }[],
    chatId: string
  ): Promise<void> {
    const graph = this.initGraphClient(token);

    // Fetch live Graph members
    const resp: any = await graph.api(`/chats/${chatId}/members`).get();
    const graphMembers = (resp.value as any[]).map(m => ({
      memberId: m.id as string,
      oid: (m.userId as string).toLowerCase()
    }));

    const desiredOids = desired.map(d => d.oid);
    const toAdd = desired.filter(d => !graphMembers.some(g => g.oid === d.oid));
    const toRemove = graphMembers.filter(g => !desiredOids.includes(g.oid));

    // Add missing
    for (const d of toAdd) {
      await graph.api(`/chats/${chatId}/members`).post({
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${d.oid}')`
      });
      
      // DB
      await prisma.chatParticipant
        .create({ data: { chatId, userId: d.userId } })
        .catch((e: any) => { if (e.code !== 'P2002') throw e; });
    }

    // Remove obsolete
    for (const g of toRemove) {
      await graph.api(`/chats/${chatId}/members/${g.memberId}`).delete();
      
      // DB
      const user = await prisma.user.findUnique({ where: { azureAdObjectId: g.oid } });
      if (user) {
        await prisma.chatParticipant.delete({
          where: { chatId_userId: { chatId, userId: user.id } }
        });
      }
    }
  }

  /**
   * Initializes a Microsoft Graph client using the On-Behalf-Of flow
   * @param userAssertion - The raw OBO JWT token
   */
  private initGraphClient(userAssertion: string) {
    const credential = new OnBehalfOfCredential({
      tenantId: this.tenantId,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      userAssertionToken: userAssertion
    });
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });
    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Utility to convert camelCase keys into "Title Case" with spaces
   * @param key - The key to humanize
   * @returns Humanized key
   */
  private humanizeKey(key: string): string {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
