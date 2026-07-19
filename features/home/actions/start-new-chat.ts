"use server";

import { requireUser } from "@/features/auth/actions/requireUser";
import prisma from "@/lib/db";

export async function startNewChat() {
  const user = await requireUser();

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "New Chat",
    },
  });

  return conversation.id;
}
