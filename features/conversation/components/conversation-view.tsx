"use client";
import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useMemo } from "react";
import { useConversations } from "../hooks/use-conversation";
import { queryKeys } from "../utils/query-keys";
import { toast } from "sonner";
import { ChatEmpty } from "./chat-empty";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import { BranchSelector } from "@/features/conversation/components/branch-selector";
import { useCreateBranch } from "../hooks/use-branches";

type ConversationViewProps = {
  conversationId: string;
  initialMessages: UIMessage[];
  /** Pass this from the server if you have it — skips an extra client fetch. */
  initialBranchId?: string;
};

export const ConversationView = ({
  conversationId,
  initialMessages,
  initialBranchId,
}: ConversationViewProps) => {
  const queryClient = useQueryClient();
  const { data: conversations } = useConversations();

  const [activeBranchId, setActiveBranchId] = React.useState<string | null>(
    initialBranchId ?? null,
  );

  // Fallback: only runs if the parent didn't already give us a branch id.
  React.useEffect(() => {
    if (activeBranchId) return;

    let cancelled = false;
    fetch(`/api/conversations/${conversationId}/branches`)
      .then((res) => res.json())
      .then((branches: Array<{ id: string; isDefault: boolean }>) => {
        if (cancelled) return;
        const main = branches.find((b) => b.isDefault) ?? branches[0];
        if (main) setActiveBranchId(main.id);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load branch");
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, activeBranchId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages, body }) => ({
          body: {
            id,
            message: messages.at(-1),
            branchId: (body as { branchId?: string } | undefined)?.branchId,
            webSearchEnabled:
              (body as { webSearchEnabled?: boolean } | undefined)
                ?.webSearchEnabled ?? false,
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createBranch = useCreateBranch(conversationId);

  const title =
    conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

  async function switchBranch(branchId: string) {
    try {
      const res = await fetch(`/api/branches/${branchId}/messages`);
      if (!res.ok) throw new Error("Failed to load branch messages");
      const branchMessages: UIMessage[] = await res.json();
      setMessages(branchMessages);
      setActiveBranchId(branchId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to switch branch",
      );
    }
  }

  async function handleBranchFrom(messageId: string) {
    try {
      const branch = await createBranch.mutateAsync({
        fromMessageId: messageId,
      });
      await switchBranch(branch.id);
      toast.success(`Created "${branch.name}"`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create branch",
      );
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <h1 className="truncate text-sm font-medium">{title}</h1>
        {activeBranchId && (
          <>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <BranchSelector
              conversationId={conversationId}
              activeBranchId={activeBranchId}
              onSwitchBranch={switchBranch}
            />
          </>
        )}
      </header>

      {messages.length === 0 ? (
        <ChatEmpty />
      ) : (
        <ChatMessages
          messages={messages}
          status={status}
          onBranchFrom={handleBranchFrom}
        />
      )}

      <ChatComposer
        onSend={(text, webSearchEnabled) => {
          if (!activeBranchId) {
            toast.error("Branch not loaded yet — try again in a moment.");
            return;
          }
          void sendMessage(
            { text },
            { body: { webSearchEnabled, branchId: activeBranchId } },
          );
        }}
        isSending={status !== "ready"}
        autoFocus
      />
    </div>
  );
};
