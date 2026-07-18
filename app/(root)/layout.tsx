import { onBoard } from "@/features/auth/actions/onBoard";
import { auth } from "@clerk/nextjs/server";
import React from "react";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  await auth.protect();
  await onBoard();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {children}
    </div>
  );
};

export default RootLayout;
