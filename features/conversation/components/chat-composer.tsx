"use client";

import * as React from "react";
import { ArrowUpIcon, GlobeIcon } from "lucide-react";

import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  onSend: (content: string, webSearchEnabled: boolean) => Promise<void> | void;
  isSending?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export function ChatComposer({
  onSend,
  isSending = false,
  placeholder = "Message ChaiGPT...",
  className,
  autoFocus = false,
}: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const [webSearchEnabled, setWebSearchEnabled] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const content = value.trim();
    if (!content || isSending) return;

    setValue("");
    await onSend(content, webSearchEnabled);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !isSending;

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={cn("mx-auto w-full max-w-3xl px-4 pb-4 md:px-6", className)}
    >
      <div className="flex flex-col rounded-3xl border border-border/80 bg-background shadow-sm dark:bg-input/40">
        <InputGroup className="h-auto min-h-14 rounded-3xl border-0 shadow-none">
          <InputGroupTextarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSending}
            rows={1}
            className="max-h-48 min-h-12 py-3.5 pl-4 text-[15px] leading-relaxed"
          />
        </InputGroup>

        {/* Toolbar row: web search toggle + send button */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setWebSearchEnabled((prev) => !prev)}
            aria-pressed={webSearchEnabled}
            aria-label="Toggle web search"
            title={
              webSearchEnabled
                ? "Web search is on for this message"
                : "Search the web for this message"
            }
            className={cn(
              "h-8 gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
              webSearchEnabled
                ? "border-transparent bg-blue-600 text-white hover:bg-blue-600/90 dark:bg-blue-500 dark:hover:bg-blue-500/90"
                : "border-border/80 bg-transparent text-muted-foreground hover:bg-muted",
            )}
          >
            <GlobeIcon className="size-3.5" />
            Search
          </Button>

          <Button
            type="submit"
            size="icon"
            variant="default"
            disabled={!canSend}
            className="size-9 rounded-full"
            aria-label="Send message"
          >
            {isSending ? <Spinner /> : <ArrowUpIcon className="size-4" />}
          </Button>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        ChaiGPT can make mistakes. Check important info.
      </p>
    </form>
  );
}
