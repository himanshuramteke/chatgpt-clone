"use server";

import { type UIMessage } from "ai";
import prisma from "@/lib/db";
import { requireUser } from "@/features/auth/actions/requireUser";
import { extractPlainText, toPrismaRole, toUIRole } from "../utils/role-map";

export async function createConversationWithDefaultBranch(data: {
  title?: string;
  model?: string;
}) {
  const user = await requireUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        userId: user.id,
        title: data.title ?? "New Chat",
        model: data.model,
      },
    });

    const branch = await tx.branch.create({
      data: {
        conversationId: conversation.id,
        name: "Main",
        isDefault: true,
      },
    });

    return { conversation, branch };
  });
}

export async function loadMessages(
  conversationId: string,
): Promise<UIMessage[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    role: toUIRole(row.role),
    parts: (row.parts as UIMessage["parts"] | null) ?? [
      { type: "text", text: row.content },
    ],
  }));
}

export async function saveChatMessages(
  conversationId: string,
  branchId: string,
  messages: UIMessage[],
  _opts?: { updateTitle?: boolean },
) {
  if (messages.length === 0) return;

  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
  });
  let parentId = branch.leafMessageId;

  for (const message of messages) {
    const content = extractPlainText(message.parts);

    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        role: toPrismaRole(message.role),
        content,
        parts: message.parts as object,
        status: "COMPLETE",
      },
      create: {
        id: message.id,
        conversationId,
        parentId,
        role: toPrismaRole(message.role),
        content,
        parts: message.parts as object,
        status: "COMPLETE",
      },
    });

    parentId = message.id;
  }

  await prisma.$transaction([
    prisma.branch.update({
      where: { id: branchId },
      data: { leafMessageId: parentId },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
}
