"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../utils/query-keys";

export type Branch = {
  id: string;
  conversationId: string;
  name: string;
  leafMessageId: string | null;
  branchPointMessageId: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function useBranches(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.branches.byConversation(conversationId),
    queryFn: async (): Promise<Branch[]> => {
      const res = await fetch(`/api/conversations/${conversationId}/branches`);
      if (!res.ok) throw new Error("Failed to load branches");
      return res.json();
    },
  });
}

export function useCreateBranch(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromMessageId,
      name,
    }: {
      fromMessageId: string;
      name?: string;
    }): Promise<Branch> => {
      const res = await fetch(`/api/conversations/${conversationId}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromMessageId, name }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "Failed to create branch");
        throw new Error(message || "Failed to create branch");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
    },
  });
}

export function useRenameBranch(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      branchId,
      name,
    }: {
      branchId: string;
      name: string;
    }): Promise<Branch> => {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "Failed to rename branch");
        throw new Error(message || "Failed to rename branch");
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
    },
  });
}

export function useDeleteBranch(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branchId: string) => {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "Failed to delete branch");
        throw new Error(message || "Failed to delete branch");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.byConversation(conversationId),
      });
    },
  });
}
