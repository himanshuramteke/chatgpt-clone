import { NextRequest } from "next/server";
import {
  createBranch,
  listBranches,
} from "@/features/ai/actions/branch-actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const branches = await listBranches(id);
  return Response.json(branches);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { fromMessageId, name } = await req.json();

  if (!fromMessageId) {
    return new Response("fromMessageId is required", { status: 400 });
  }

  const branch = await createBranch({
    conversationId: id,
    fromMessageId,
    name,
  });
  return Response.json(branch);
}
