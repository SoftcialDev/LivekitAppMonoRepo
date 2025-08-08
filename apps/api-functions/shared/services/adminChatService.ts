import { OnBehalfOfCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import {
  TokenCredentialAuthenticationProvider
} from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import prisma from "./prismaClienService";
import { ChatParticipant } from "@prisma/client";

/**
 * Payload for sending a chat message to the Administrators chat.
 */
export interface ChatMessagePayload {
  /** The message header, e.g. "📸 New Snapshot Report". */
  subject: string;
  /** Full name of the supervisor who took the snapshot. */
  supervisorName: string;
  /** The PSO’s internal user ID (for reference in the message). */
  psoId: string;
  /** The textual reason provided by the supervisor. */
  reason: string;
  /** A publicly‐accessible URL (or SAS URL) pointing at the JPEG image. */
  imageBase64: string;

  psoEmail: string;

}

/**
 * Service responsible for:
 * - ensuring a single Teams group chat for all Admin users
 * - keeping its membership in sync with your database
 * - posting messages (with image attachments) into that chat
 */
export class AdminChatService {
  private tenantId     = process.env.AZURE_TENANT_ID!;
  private clientId     = process.env.AZURE_CLIENT_ID!;
  private clientSecret = process.env.AZURE_CLIENT_SECRET!;

  /**
   * Ensures there is exactly one "InContactApp – Administrators" chat,
   * creating it if missing or reconciling its membership if it exists.
   *
   * @param userAssertion - The OBO token from the caller’s request.
   * @returns The Teams chatId.
   */
  async getOrSyncChat(userAssertion: string): Promise<string> {
    const topic = "InContactApp – Administrators";

    // 1) Load Admin users from your database
    const admins = await prisma.user.findMany({ where: { role: "Admin" } });
    const desired = admins.map(a => ({
      userId: a.id,
      oid:    a.azureAdObjectId.toLowerCase()
    }));
    console.debug("[AdminChatService] Desired Admins:", desired);

    // 2) See if we have a local record of the chat
    const record = await prisma.chat.findFirst({
      where: { topic },
      include: { members: true }
    });

    let chatId: string;
    if (!record) {
      console.info("[AdminChatService] No existing chat – creating new one");
      chatId = await this.createGraphChat(userAssertion, desired, topic);
      await prisma.chat.create({
        data: {
          id:    chatId,
          topic,
          members: {
            create: desired.map(d => ({ userId: d.userId }))
          }
        }
      });
    } else {
      chatId = record.id;
      console.info(`[AdminChatService] Found existing chat ${chatId}, syncing members`);
      await this.syncGraphMembers(userAssertion, record.members, desired, chatId);
    }

    return chatId;
  }

/**
 * Sends a snapshot report into the Administrators chat with an inline image.
 *
 * @param userAssertion
 *   The On-Behalf-Of JWT token from the caller’s request (for Graph auth).
 * @param chatId
 *   The Teams chat ID, e.g. "19:abcd1234...@thread.v2".
 * @param payload
 *   - `subject`:       The message header (e.g. "📸 New Snapshot Report").  
 *   - `supervisorName`: Full name of the supervisor.  
 *   - `psoId`:         The PSO’s internal user ID (for reference).  
 *   - `reason`:        The reason for the snapshot.  
 *   - `imageBase64`:   Base64‑encoded JPEG bytes to embed.
 *
 * @returns Resolves once Graph has accepted the message.
 * @throws On any Graph API failure (network, permissions, 4xx/5xx, etc.).
 */
async sendMessage(
  userAssertion: string,
  chatId: string,
  payload: {
    subject:        string;
    supervisorName: string;
    psoEmail:          string;
    reason:         string;
    imageBase64:    string;
  }
): Promise<void> {
  const graph = this.initGraphClient(userAssertion);

  // Use a simple numeric tempId – must match between content reference and hostedContents entry
  const tempId = Date.now().toString();

  // Build the HTML body, referencing our hosted content by its temporaryId
  const html = `
    <p><strong>${payload.subject}</strong></p>
    <p>Supervisor: ${payload.supervisorName}</p>
    <p>PSO Email: ${payload.psoEmail}</p>
    <p>Reason: ${payload.reason}</p>
    <img src="../hostedContents/${tempId}/$value" alt="snapshot" />
  `;

  // Single POST: message + hostedContents
  await graph
    .api(`/chats/${chatId}/messages`)
    .post({
      body: {
        contentType: "html" as const,
        content:     html,
      },
      hostedContents: [
        {
          "@microsoft.graph.temporaryId": tempId,          // must match the ../hostedContents/{tempId}/$value reference
          contentBytes:                   payload.imageBase64,
          contentType:                   "image/jpeg",
        }
      ],
      attachments: [],  // no file attachments
      mentions:    [],
      reactions:   [],
    });
}



  /**
   * Creates a new Teams group chat via Microsoft Graph.
   *
   * @param token        - The OBO token.
   * @param participants - Array of { userId, oid } for each Admin.
   * @param topic        - The chat topic/title.
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
      roles:         ["owner"],
      "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p.oid}')`
    }));
    const chat: any = await graph.api("/chats").post({ chatType: "group", topic, members });
    console.debug("[AdminChatService] Created Graph chat", chat.id);
    return chat.id;
  }

/**
 * Synchronizes the Teams chat’s membership to exactly match the current
 * list of Admin users.  Adds new Admins and removes users who are no
 * longer Admins, and keeps your DB in sync.
 *
 * @param token
 *   The On-Behalf-Of token for Graph.
 * @param currentParticipants
 *   The array of ChatParticipant records currently stored in your DB.
 * @param desired
 *   The up‑to‑date list of Admins: `{ userId: string; oid: string }[]`, where
 *   `oid` is the Azure AD Object ID (lower‑cased).
 * @param chatId
 *   The Teams chat identifier.
 */
private async syncGraphMembers(
  token: string,
  currentParticipants: ChatParticipant[],
  desired: { userId: string; oid: string }[],
  chatId: string
): Promise<void> {
  const graph = this.initGraphClient(token);

  // 1) Fetch the live membership from Graph
  const resp: any = await graph
    .api(`/chats/${chatId}/members`)
    .get();

  // 2) Normalize Graph members: Graph returns `userId`, not `user.id`
  const graphMembers = (resp.value as any[]).map(m => ({
    memberId: m.id as string,
    oid:      (m.userId as string)?.toLowerCase()   // ← correct property
  }));
  console.debug("[AdminChatService] Graph members:", graphMembers);

  // 3) Compute who to add / remove
  const desiredOids = desired.map(d => d.oid);
  const toAdd    = desired.filter(d => !graphMembers.some(g => g.oid === d.oid));
  const toRemove = graphMembers.filter(g => !desiredOids.includes(g.oid!));
  console.info("[AdminChatService] Will add:", toAdd);
  console.info("[AdminChatService] Will remove:", toRemove);

  // 4) Add missing Admins
  for (const d of toAdd) {
    console.debug(`[AdminChatService] Adding ${d.oid} to chat ${chatId}`);
    // 4a) Graph
    await graph.api(`/chats/${chatId}/members`).post({
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      roles: ["owner"],
      "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${d.oid}')`
    });
    // 4b) DB (guard against duplicates)
    try {
      await prisma.chatParticipant.create({
        data: { chatId, userId: d.userId }
      });
    } catch (e: any) {
      if (e.code === "P2002") {
        console.warn("[AdminChatService] chatParticipant already exists, skipping", d);
      } else {
        throw e;
      }
    }
  }

  // 5) Remove former Admins
  for (const g of toRemove) {
    console.debug(`[AdminChatService] Removing member ${g.memberId} (oid=${g.oid})`);
    // 5a) Graph
    await graph.api(`/chats/${chatId}/members/${g.memberId}`).delete();
    // 5b) DB
    if (g.oid) {
      const user = await prisma.user.findUnique({
        where: { azureAdObjectId: g.oid }
      });
      if (user) {
        await prisma.chatParticipant.delete({
          where: { chatId_userId: { chatId, userId: user.id } }
        });
      }
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
export const adminChatService = new AdminChatService();
