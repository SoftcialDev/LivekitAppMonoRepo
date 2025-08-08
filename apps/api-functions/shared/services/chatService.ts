import { OnBehalfOfCredential } from "@azure/identity";
import { Client }              from "@microsoft/microsoft-graph-client";
import {
  TokenCredentialAuthenticationProvider
} from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";

import prisma from "./prismaClienService";

export interface ChatParticipant {
  userId: string;
  azureAdObjectId: string;
}

/**
 * Ensures there is a Teams chat between exactly two users, creating it via Microsoft Graph if needed,
 * and persisting the chat ID in the database. Automatically handles internal and guest users by
 * assigning the appropriate roles and using a one-on-one chat for 2 participants.
 *
 * @param userAssertion - The raw bearer token from the caller’s request (for On-Behalf-Of flow).
 * @param participants - A readonly array of exactly two participant objects:
 *   [
 *     { userId: string; azureAdObjectId: string },  // Supervisor
 *     { userId: string; azureAdObjectId: string }   // PSO
 *   ]
 * @param topic - The chat’s title, e.g. "InContactApp – Alice Smith & Bob Jones".
 * @returns The Teams/Graph chatId.
 * @throws Error if participants.length !== 2.
 */
export async function getOrCreateChat(
  userAssertion: string,
  participants: readonly ChatParticipant[],
  topic: string
): Promise<string> {
  if (participants.length !== 2) {
    throw new Error("getOrCreateChat requires exactly 2 participants");
  }

  const [p1, p2] = participants;
  const participantIds = [p1.userId, p2.userId].sort();

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

  const obo = new OnBehalfOfCredential({
    tenantId: process.env.AZURE_TENANT_ID!,
    clientId: process.env.AZURE_CLIENT_ID!,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
    userAssertionToken: userAssertion,
  });
  const authProvider = new TokenCredentialAuthenticationProvider(obo, {
    scopes: ["https://graph.microsoft.com/.default"],
  });
  const graph = Client.initWithMiddleware({ authProvider });

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
        "user@odata.bind":
          `https://graph.microsoft.com/v1.0/users('${p.azureAdObjectId}')`,
      };
    })
  );

  const payload = {
    chatType: "oneOnOne",
    members: membersPayload,
  };

  const graphChat = await graph.api("/chats").post(payload);
  const chatId: string = graphChat.id;

  await prisma.chat.create({
    data: {
      id: chatId,
      topic,
      members: { create: participants.map((p) => ({ userId: p.userId })) },
    },
  });

  return chatId;
}
