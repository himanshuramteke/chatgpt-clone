import prisma from "@/lib/db";

async function main() {
  const conversations = await prisma.conversation.findMany({
    include: { message: { orderBy: { createdAt: "asc" } } },
  });

  for (const conversation of conversations) {
    // chain parentId in creation order
    let parentId: string | null = null;
    for (const msg of conversation.message) {
      if (msg.parentId !== parentId) {
        await prisma.message.update({
          where: { id: msg.id },
          data: { parentId },
        });
      }
      parentId = msg.id;
    }

    const lastMessage = conversation.message.at(-1);

    await prisma.branch.create({
      data: {
        conversationId: conversation.id,
        name: "Main",
        leafMessageId: lastMessage?.id ?? null,
        branchPointMessageId: null,
        isDefault: true,
      },
    });
  }

  console.log(`Backfilled ${conversations.length} conversations.`);
}

main().then(() => process.exit(0));
