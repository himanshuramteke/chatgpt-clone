import { getBranchMessages } from "@/features/ai/actions/branch-actions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ branchId: string }> },
) {
  const { branchId } = await params;
  const messages = await getBranchMessages(branchId);
  return Response.json(messages);
}
