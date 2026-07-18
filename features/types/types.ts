export type ConversationListItem = {
  id: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
