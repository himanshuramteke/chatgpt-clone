import { MessageRole } from "@/lib/generated/prisma/client";

export type ConversationListItem = {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageItem = {
  id: string;
  conversationId: string;
  role: MessageRole;
  status: "PENDING" | "COMPLETE" | "ERROR";
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
