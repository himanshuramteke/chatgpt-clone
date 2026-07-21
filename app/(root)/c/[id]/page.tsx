import {
  getBranchMessages,
  getDefaultBranch,
} from "@/features/ai/actions/branch-actions";
import { getConversation } from "@/features/conversation/actions/conversation-action";
import { ConversationView } from "@/features/conversation/components/conversation-view";
import { notFound } from "next/navigation";

type ConversationPageProps = {
  params: Promise<{ id: string }>;
};

const page = async ({ params }: ConversationPageProps) => {
  const { id } = await params;
  try {
    await getConversation(id);
  } catch (error) {
    notFound();
  }

  const defaultBranch = await getDefaultBranch(id);
  const initialMessages = await getBranchMessages(defaultBranch.id);

  return (
    <ConversationView
      key={id}
      conversationId={id}
      initialMessages={initialMessages}
      initialBranchId={defaultBranch.id}
    />
  );
};
export default page;
