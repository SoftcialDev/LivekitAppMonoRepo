import { OnBehalfOfCredential } from "@azure/identity";
import { Client }              from "@microsoft/microsoft-graph-client";
import {
  TokenCredentialAuthenticationProvider
} from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

import prisma from "./prismaClienService";

/**
 * Ensures there is a Teams group chat between exactly two users,
 * with the given topic.  Will first look in your own database;
 * if none found, will next search Graph; if still none, will
 * create in Graph and persist in your DB.
 *
 * @param userAssertion
 *   The raw Bearer token from the caller’s request (for OBO).
 * @param participants
 *   A readonly array of exactly two participant objects:
 *     [
 *       { userId: string; azureAdObjectId: string },  // Supervisor
 *       { userId: string; azureAdObjectId: string }   // PSO
 *     ]
 * @param topic
 *   The chat’s title, e.g. "InContactApp – Alice Smith & Bob Jones"
 * @returns The Teams/Graph chatId.
 */
export async function getOrCreateChat(
  userAssertion: string,
  participants: readonly { userId: string; azureAdObjectId: string }[],
  topic: string
): Promise<string> {
  if (participants.length !== 2) {
    throw new Error("getOrCreateChat requires exactly 2 participants");
  }
  const [p1, p2] = participants;

  // ── 0) DATABASE CHECK ──────────────────────────────────────────────
  const candidates = await prisma.chat.findMany({
    where: { topic },
    include: { members: { select: { userId: true } } },
  });

  for (const c of candidates) {
    const ids = c.members.map(m => m.userId).sort();
    if (ids[0] === p1.userId && ids[1] === p2.userId) {
      return c.id;
    }
  }

  // ── 1) SETUP GRAPH CLIENT VIA OBO ─────────────────────────────────
  const obo = new OnBehalfOfCredential({
    tenantId:           process.env.AZURE_TENANT_ID!,
    clientId:           process.env.AZURE_CLIENT_ID!,
    clientSecret:       process.env.AZURE_CLIENT_SECRET!,
    userAssertionToken: userAssertion,
  });
  const authProvider = new TokenCredentialAuthenticationProvider(obo, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  const graph = Client.initWithMiddleware({ authProvider });

  // ── 2) GRAPH SEARCH ────────────────────────────────────────────────
  const resp: any = await graph
    .api("/me/chats")
    .filter("chatType eq 'group'")
    .expand("members")
    .get();

  let graphChat = (resp.value as any[]).find(chat => {
    const memberIds = chat.members
      .map((m: any) => m.user?.id?.toLowerCase())
      .filter(Boolean)
      .sort();
    return (
      memberIds.length === 2 &&
      memberIds[0] === p1.azureAdObjectId.toLowerCase() &&
      memberIds[1] === p2.azureAdObjectId.toLowerCase()
    );
  });

  // ── 3) GRAPH CREATE (if still not found) ───────────────────────────
  if (!graphChat) {
    const payload = {
      chatType: "group",
      topic,
      members: [
        {
          "@odata.type":     "#microsoft.graph.aadUserConversationMember",
          roles:             ["owner"],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p1.azureAdObjectId}')`,
        },
        {
          "@odata.type":     "#microsoft.graph.aadUserConversationMember",
          roles:             ["owner"],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${p2.azureAdObjectId}')`,
        },
      ],
    };
    graphChat = await graph.api("/chats").post(payload);
  }

  const chatId: string = graphChat.id;

  // ── 4) PERSIST IN YOUR DB ──────────────────────────────────────────
  await prisma.chat.create({
    data: {
      id:    chatId,
      topic,
      members: {
        create: participants.map(p => ({ userId: p.userId })),
      },
    },
  });

  return chatId;
}
