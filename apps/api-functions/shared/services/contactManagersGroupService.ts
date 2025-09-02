import { OnBehalfOfCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import prisma from "./prismaClienService";

/**
 * Payload for sending a message to the Contact Managers chat.
 */
export interface ContactManagerMessagePayload {
  /** The message header, e.g. "🚨 Disconnections Report" */
  subject: string;
  /** Full name of the user who submitted the form */
  senderName: string;
  /** The form type indicator */
  formType: string;
  /** Form fields serialized as an object */
  data: Record<string, any>;
  /** Optional image URL (SAS or public) */
  imageUrl?: string;
}

/**
 * Service responsible for:
 * - ensuring a single Teams group chat for Contact Managers,
 * - syncing its membership with users in roles Employee, Admin, ContactManager,
 * - posting rich HTML messages (with optional images).
 */
export class ContactManagersGroupService {
  private tenantId = process.env.AZURE_TENANT_ID!;
  private clientId = process.env.AZURE_CLIENT_ID!;
  private clientSecret = process.env.AZURE_CLIENT_SECRET!;

  /**
   * Ensures there is exactly one "InContactApp – Contact Managers" chat,
   * creating it if missing or reconciling its membership if it exists.
   *
   * @param userAssertion - The OBO token from the caller’s request.
   * @returns The Teams chatId.
   */
  public async getOrSyncChat(userAssertion: string): Promise<string> {
    const topic = "InContactApp – Contact Managers";

    // 1) Load all relevant users from DB
    const cms = await prisma.user.findMany({
      where: { role: { in: ["Employee", "Admin", "ContactManager","SuperAdmin"] } }
    });
    const desired = cms.map(u => ({ userId: u.id, oid: u.azureAdObjectId.toLowerCase() }));

    // 2) Check for existing record
    const record = await prisma.chat.findFirst({
      where: { topic },
      include: { members: true }
    });

    let chatId: string;
    if (!record) {
      // 3a) Create new chat in Graph
      chatId = await this.createGraphChat(userAssertion, desired, topic);

      // 3b) Persist in DB with correct ID
      await prisma.chat.create({
        data: {
          id:    chatId,
          topic,
          members: { create: desired.map(d => ({ userId: d.userId })) }
        }
      });
    } else {
      chatId = record.id;
      // 4) Sync membership
      await this.syncGraphMembers(userAssertion, record.members, desired, chatId);
    }

    return chatId;
  }
/**
 * Sends a rich Adaptive Card message into the Contact Managers Teams chat.
 *
 * @param userAssertion - The on-behalf-of (OBO) JWT token representing the caller.
 * @param chatId        - The Teams chat identifier where the message will be posted.
 * @param payload       - The payload containing subject, sender name, form type,
 *                        data fields, and an optional image URL.
 * @returns A promise that resolves once the message has been successfully sent.
 */
public async sendMessage(
  userAssertion: string,
  chatId: string,
  payload: ContactManagerMessagePayload
): Promise<void> {
  const graph = this.initGraphClient(userAssertion);

  // 1) Utility to convert camelCase keys into "Title Case" with spaces:
  const humanizeKey = (key: string): string =>
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  // 2) Build the Adaptive Card JSON object
  const cardPayload = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.3',
    body: [
      {
        type: 'TextBlock',
        text: payload.subject,
        weight: 'Bolder',
        size: 'Medium',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: `Sender: ${payload.senderName}`,
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: `Form Type: ${payload.formType}`,
        wrap: true,
      },
      // Map each data field into its own TextBlock with a humanized label
      ...Object.entries(payload.data).map(([key, value]) => ({
        type: 'TextBlock',
        text: `**${humanizeKey(key)}:** ${value}`,
        wrap: true,
      })),
      // Optionally include an image
      ...(payload.imageUrl
        ? [
            {
              type: 'Image',
              url: payload.imageUrl,
              size: 'Medium',
              style: 'Default',
            },
          ]
        : []),
    ],
  };

  // 3) Generate a unique ID for the attachment (you can also use a UUID library)
  const attachmentId = `card-${Date.now()}`;

  // 4) Construct the chatMessage with attachments
  const messagePayload = {
    body: {
      contentType: 'html',
      // This placeholder tells Teams which attachment to render
      content: `<attachment id="${attachmentId}"></attachment>`,
    },
    attachments: [
      {
        id: attachmentId,
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        // The Graph API expects the 'content' here to be a JSON _string_
        content: JSON.stringify(cardPayload),
      },
    ],
  };

  // 5) Post the message to the chat
  await graph
    .api(`/chats/${chatId}/messages`)
    .post(messagePayload);
}


  /**
   * Creates a new Teams group chat via Microsoft Graph.
   *
   * @param token         - The OBO token.
   * @param participants  - Array of { userId, oid } for each member.
   * @param topic         - The chat topic/title.
   * @returns The newly created chatId.
   */
  private async createGraphChat(
    token: string,
    participants: readonly { userId: string; oid: string }[],
    topic: string
  ): Promise<string> {
    const graph = this.initGraphClient(token);

    const members = participants.map(p => ({
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      roles: ["owner"],
      "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p.oid}')`
    }));

    const graphChat: any = await graph
      .api("/chats")
      .post({ chatType: "group", topic, members });

    // Return the real chat ID
    return graphChat.id;
  }

  /**
   * Synchronizes the Teams chat’s membership to exactly match the current
   * list of desired users: adds new and removes departed.
   *
   * @param token               - The OBO token.
   * @param currentParticipants - The array of ChatParticipant records from DB.
   * @param desired             - The up-to-date list of { userId, oid }.
   * @param chatId              - The Teams chat identifier.
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
      oid:      (m.userId as string).toLowerCase()
    }));

    const desiredOids = desired.map(d => d.oid);
    const toAdd    = desired.filter(d => !graphMembers.some(g => g.oid === d.oid));
    const toRemove = graphMembers.filter(g => !desiredOids.includes(g.oid));

    // Add missing
    for (const d of toAdd) {
      await graph.api(`/chats/${chatId}/members`).post({
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        roles: ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${d.oid}')`
      });
      // DB
      await prisma.chatParticipant
        .create({ data: { chatId, userId: d.userId } })
        .catch(e => { if (e.code !== "P2002") throw e; });
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
   * Initializes a Microsoft Graph client using the On-Behalf-Of flow.
   *
   * @param userAssertion - The raw OBO JWT token.
   */
  private initGraphClient(userAssertion: string) {
    const credential = new OnBehalfOfCredential({
      tenantId:           this.tenantId,
      clientId:           this.clientId,
      clientSecret:       this.clientSecret,
      userAssertionToken: userAssertion
    });
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ["https://graph.microsoft.com/.default"]
    });
    return Client.initWithMiddleware({ authProvider });
  }
}

/** Singleton instance */
export const contactManagersGroupService = new ContactManagersGroupService();
