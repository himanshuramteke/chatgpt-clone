"use client";

import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { GlobeIcon } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { cn } from "@/lib/utils";

function getMessageText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function getWebSearchParts(message: UIMessage) {
  return message.parts
    .filter(isToolUIPart)
    .filter((part) => part.type === "tool-webSearch");
}

type ChatMessagesProps = {
  messages: UIMessage[];
  status: ChatStatus;
};

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const isWaiting = status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
          const searchParts = getWebSearchParts(message);

          return (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {searchParts.map((part, i) => {
                  const isDone = part.state === "output-available";
                  return (
                    <div
                      key={`${message.id}-search-${i}`}
                      className={cn(
                        "mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        !isDone && "animate-pulse",
                      )}
                    >
                      <GlobeIcon className="size-3" />
                      {isDone ? "Searched the web" : "Searching the web…"}
                    </div>
                  );
                })}
                <MessageResponse>{getMessageText(message)}</MessageResponse>
              </MessageContent>
            </Message>
          );
        })}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
