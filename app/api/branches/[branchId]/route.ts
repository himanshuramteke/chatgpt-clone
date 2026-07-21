import { NextRequest } from "next/server";
import {
  renameBranch,
  deleteBranch,
} from "@/features/ai/actions/branch-actions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await params;
  const { name } = await req.json();

  if (!name || typeof name !== "string") {
    return new Response("name is required", { status: 400 });
  }

  const branch = await renameBranch(branchId, name);
  return Response.json(branch);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await params;
  await deleteBranch(branchId);
  return new Response(null, { status: 204 });
}
