import { OnBehalfOfCredential, ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import {
  TokenCredentialAuthenticationProvider
} from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import prisma from "./prismaClienService";
import { ChatParticipant, UserRole } from "@prisma/client";

/**
 * Payload for sending a chat message to the Administrators chat.
 */
export interface ChatMessagePayload {
  /** The message header, e.g. "📸 New Snapshot Report". */
  subject: string;
  /** Full name of the supervisor who took the snapshot (rendered in body). */
  supervisorName: string;
  /** The PSO’s email address displayed in the message body. */
  psoEmail: string;
  /** The textual reason provided by the supervisor. */
  reason: string;
  /** Base64-encoded JPEG bytes to embed as hosted content. */
  imageBase64: string;
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
   * @param userAssertion - The caller’s OBO token.
   * @returns The Teams chatId.
   */
  async getOrSyncChat(userAssertion: string): Promise<string> {
    const topic = "InContactApp – Administrators";

    const admins = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.Admin, UserRole.SuperAdmin] },
    },
  });
    const desired = admins.map(a => ({
      userId: a.id,
      oid:    a.azureAdObjectId.toLowerCase()
    }));

    const record = await prisma.chat.findFirst({
      where: { topic },
      include: { members: true }
    });

    let chatId: string;
    if (!record) {
      chatId = await this.createGraphChat(userAssertion, desired, topic);
      await prisma.chat.create({
        data: {
          id:    chatId,
          topic,
          members: { create: desired.map(d => ({ userId: d.userId })) }
        }
      });
    } else {
      chatId = record.id;
      await this.syncGraphMembers(userAssertion, record.members, desired, chatId);
    }

    return chatId;
  }

  /**
   * Sends a snapshot report into the Administrators chat with an inline image.
   *
   * @remarks
   * Attempts to send using the caller’s delegated token (OBO). If Graph denies due to lack of
   * membership/permissions (e.g., supervisor is not in the admin chat), automatically falls back
   * to application permissions so the app posts on behalf of the workflow while still rendering
   * the supervisor’s name inside the message body.
   *
   * Required app permissions: Microsoft Graph **Application** permission `Chat.ReadWrite.All`
   * with admin consent.
   *
   * @param userAssertion - The caller’s OBO token.
   * @param chatId - The Teams chat ID, e.g. `"19:...@thread.v2"`.
   * @param payload - Subject, supervisor name, PSO email, reason, and base64 image bytes.
   * @returns Resolves once Graph accepts the message.
   */
  async sendMessage(
    userAssertion: string,
    chatId: string,
    payload: ChatMessagePayload
  ): Promise<void> {
    const tempId = Date.now().toString();
    const html = `
      <p><strong>${payload.subject}</strong></p>
      <p>Supervisor: ${payload.supervisorName}</p>
      <p>PSO Email: ${payload.psoEmail}</p>
      <p>Reason: ${payload.reason}</p>
      <img src="../hostedContents/${tempId}/$value" alt="snapshot" />
    `;

    // First try with OBO (delegated). If unauthorized/forbidden, fall back to app-only.
    try {
      const graphObo = this.initGraphOboClient(userAssertion);
      await graphObo
        .api(`/chats/${chatId}/messages`)
        .post({
          body: { contentType: "html" as const, content: html },
          hostedContents: [
            {
              "@microsoft.graph.temporaryId": tempId,
              contentBytes: payload.imageBase64,
              contentType: "image/jpeg",
            }
          ],
          attachments: [],
          mentions: [],
          reactions: [],
        });
      return;
    } catch (err: any) {
      if (!this.isAuthzError(err)) {
        throw err;
      }
      // fall through to app-only
    }

    const graphApp = this.initGraphAppClient();
    await graphApp
      .api(`/chats/${chatId}/messages`)
      .post({
        body: { contentType: "html" as const, content: html },
        hostedContents: [
          {
            "@microsoft.graph.temporaryId": tempId,
            contentBytes: payload.imageBase64,
            contentType: "image/jpeg",
          }
        ],
        attachments: [],
        mentions: [],
        reactions: [],
      });
  }

  /**
   * Creates a new Teams group chat via Microsoft Graph (delegated/OBO).
   *
   * @param token - The caller’s OBO token.
   * @param participants - Array of `{ userId, oid }` for each Admin.
   * @param topic - The chat topic/title.
   * @returns The newly created chatId.
   */
  private async createGraphChat(
    token: string,
    participants: readonly { userId: string; oid: string }[],
    topic: string
  ): Promise<string> {
    const graph = this.initGraphOboClient(token);
    const members = participants.map(p => ({
      "@odata.type": "#microsoft.graph.aadUserConversationMember",
      roles:         ["owner"],
      "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p.oid}')`
    }));
    const chat: any = await graph.api("/chats").post({ chatType: "group", topic, members });
    return chat.id;
  }

  /**
   * Synchronizes the Teams chat’s membership to exactly match the current Admin users.
   *
   * @param token - The caller’s OBO token.
   * @param currentParticipants - `ChatParticipant` rows currently stored in the DB.
   * @param desired - The up-to-date list of Admins `{ userId, oid }` (oid = AAD Object ID, lowercased).
   * @param chatId - The Teams chat identifier.
   */
  private async syncGraphMembers(
    token: string,
    currentParticipants: ChatParticipant[],
    desired: { userId: string; oid: string }[],
    chatId: string
  ): Promise<void> {
    const graph = this.initGraphOboClient(token);

    const resp: any = await graph.api(`/chats/${chatId}/members`).get();
    const graphMembers = (resp.value as any[]).map(m => ({
      memberId: m.id as string,
      oid:      (m.userId as string)?.toLowerCase()
    }));

    const desiredOids = desired.map(d => d.oid);
    const toAdd    = desired.filter(d => !graphMembers.some(g => g.oid === d.oid));
    const toRemove = graphMembers.filter(g => !desiredOids.includes(g.oid!));

    for (const d of toAdd) {
      await graph.api(`/chats/${chatId}/members`).post({
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        roles: ["owner"],
        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${d.oid}')`
      });
      try {
        await prisma.chatParticipant.create({ data: { chatId, userId: d.userId } });
      } catch (e: any) {
        // ignore unique constraint
      }
    }

    for (const g of toRemove) {
      await graph.api(`/chats/${chatId}/members/${g.memberId}`).delete();
      if (g.oid) {
        const user = await prisma.user.findUnique({ where: { azureAdObjectId: g.oid } });
        if (user) {
          await prisma.chatParticipant.delete({
            where: { chatId_userId: { chatId, userId: user.id } }
          });
        }
      }
    }
  }

  /**
   * Initializes a Microsoft Graph client using the On-Behalf-Of flow (delegated).
   *
   * @param userAssertion - The raw OBO JWT token from the caller.
   * @returns An authenticated Microsoft Graph client.
   */
  private initGraphOboClient(userAssertion: string) {
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

  /**
   * Initializes a Microsoft Graph client using Client Credentials (application permissions).
   *
   * @returns An authenticated Microsoft Graph client for app-only calls.
   */
  private initGraphAppClient() {
    const credential = new ClientSecretCredential(
      this.tenantId,
      this.clientId,
      this.clientSecret
    );
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ["https://graph.microsoft.com/.default"]
    });
    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Detects whether an error was caused by authorization/permission issues.
   *
   * @param err - The thrown error.
   * @returns True if the error status is 401/403/404.
   */
  private isAuthzError(err: any): boolean {
    const code = err?.statusCode ?? err?.code ?? err?.status;
    return code === 401 || code === 403 || code === 404;
  }
}

/** Singleton instance */
export const adminChatService = new AdminChatService();
