"use server";

import { requireUser } from "@/features/auth/actions/requireUser";
import prisma from "@/lib/db";
import { toUIRole } from "../utils/role-map";
import { UIMessage } from "ai";

export async function createBranch({
  conversationId,
  fromMessageId,
  name,
}: {
  conversationId: string;
  fromMessageId: string;
  name?: string;
}) {
  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });

  if (!conversation) {
    throw new Error("Conversation not found!");
  }

  const fromMessage = await prisma.message.findFirst({
    where: { id: fromMessageId, conversationId },
  });

  if (!fromMessage) {
    throw new Error("Message not found!");
  }

  const existingCount = await prisma.branch.count({
    where: { conversationId },
  });

  return prisma.branch.create({
    data: {
      conversationId,
      name: name?.trim() || `Branch ${existingCount + 1}`,
      leafMessageId: fromMessageId,
      branchPointMessageId: fromMessageId,
      isDefault: false,
    },
  });
}

export async function getDefaultBranch(conversationId: string) {
  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });
  if (!conversation) throw new Error("Conversation not found");

  let branch = await prisma.branch.findFirst({
    where: { conversationId, isDefault: true },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: { conversationId, name: "Main", isDefault: true },
    });
  }

  return branch;
}

export async function listBranches(conversationId: string) {
  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
  });
  if (!conversation) throw new Error("Conversation not found");

  return prisma.branch.findMany({
    where: { conversationId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function renameBranch(branchId: string, name: string) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name cannot be empty");

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, conversation: { userId: user.id } },
  });
  if (!branch) throw new Error("Branch not found");

  return prisma.branch.update({
    where: { id: branchId },
    data: { name: trimmed },
  });
}

export async function deleteBranch(branchId: string) {
  const user = await requireUser();

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, conversation: { userId: user.id } },
  });
  if (!branch) throw new Error("Branch not found");
  if (branch.isDefault) throw new Error("Cannot delete the main branch");

  const candidateIds: string[] = [];
  let cursor = branch.leafMessageId;
  while (cursor && cursor !== branch.branchPointMessageId) {
    const msg: { id: string; parentId: string | null } | null =
      await prisma.message.findUnique({
        where: { id: cursor },
        select: { id: true, parentId: true },
      });
    if (!msg) break;
    candidateIds.push(msg.id);
    cursor = msg.parentId;
  }

  const otherLeaves = await prisma.branch.findMany({
    where: { conversationId: branch.conversationId, id: { not: branchId } },
    select: { leafMessageId: true },
  });
  const protectedIds = new Set(
    otherLeaves.map((b) => b.leafMessageId).filter((id): id is string => !!id),
  );
  const safeToDelete = candidateIds.filter((id) => !protectedIds.has(id));

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { id: { in: safeToDelete } } }),
    prisma.branch.delete({ where: { id: branchId } }),
  ]);
}

export async function getBranchMessages(
  branchId: string,
): Promise<UIMessage[]> {
  const user = await requireUser();

  const branch = await prisma.branch.findFirst({
    where: { id: branchId, conversation: { userId: user.id } },
  });
  if (!branch) throw new Error("Branch not found");
  if (!branch.leafMessageId) return [];

  type ChainRow = {
    id: string;
    role: string;
    parts: unknown;
    content: string;
    parentId: string | null;
  };

  const chain: ChainRow[] = [];

  let cursor: string | null = branch.leafMessageId;
  while (cursor) {
    const msg: ChainRow | null = await prisma.message.findUnique({
      where: { id: cursor },
      select: {
        id: true,
        role: true,
        content: true,
        parts: true,
        parentId: true,
      },
    });
    if (!msg) break;
    chain.push(msg);
    cursor = msg.parentId;
  }

  return chain.reverse().map((row) => ({
    id: row.id,
    role: toUIRole(row.role as never),
    parts: (row.parts as UIMessage["parts"] | null) ?? [
      { type: "text", text: row.content },
    ],
  }));
}
