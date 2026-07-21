"use client";

import * as React from "react";
import {
  GitBranchIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  useBranches,
  useRenameBranch,
  useDeleteBranch,
  type Branch,
} from "../hooks/use-branches";

type BranchSelectorProps = {
  conversationId: string;
  activeBranchId: string;
  onSwitchBranch: (branchId: string) => void;
};

export function BranchSelector({
  conversationId,
  activeBranchId,
  onSwitchBranch,
}: BranchSelectorProps) {
  const { data: branches = [] } = useBranches(conversationId);
  const renameBranch = useRenameBranch(conversationId);
  const deleteBranch = useDeleteBranch(conversationId);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<Branch | null>(null);

  const activeBranch = branches.find((b) => b.id === activeBranchId);

  function startRename(branch: Branch) {
    setEditingId(branch.id);
    setEditValue(branch.name);
  }

  function commitRename() {
    if (editingId && editValue.trim()) {
      renameBranch.mutate({ branchId: editingId, name: editValue.trim() });
    }
    setEditingId(null);
  }

  // Nothing to switch between until a second branch exists.
  if (branches.length <= 1) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
          >
            <GitBranchIcon className="size-3.5" />
            {activeBranch?.name ?? "Main"}
            <ChevronDownIcon className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => {
                if (editingId === branch.id) return;
                onSwitchBranch(branch.id);
              }}
              className={cn(
                "group/item flex items-center justify-between gap-1 text-xs",
                branch.id === activeBranchId &&
                  "font-semibold text-blue-600 dark:text-blue-400",
              )}
            >
              {editingId === branch.id ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 flex-1 text-xs"
                />
              ) : (
                <span className="flex-1 truncate">
                  {branch.name}
                  {branch.isDefault && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      main
                    </span>
                  )}
                </span>
              )}

              {!branch.isDefault && editingId !== branch.id && (
                <div className="flex opacity-0 transition-opacity group-hover/item:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(branch);
                    }}
                    aria-label="Rename branch"
                  >
                    <PencilIcon className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(branch);
                    }}
                    aria-label="Delete branch"
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open: boolean) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{pendingDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the branch and any messages unique to it. Messages
              shared with other branches are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  deleteBranch.mutate(pendingDelete.id);
                  if (activeBranchId === pendingDelete.id) {
                    const fallback = branches.find((b) => b.isDefault);
                    if (fallback) onSwitchBranch(fallback.id);
                  }
                }
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
