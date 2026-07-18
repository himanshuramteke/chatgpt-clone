import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button>ChatGPT Clone</Button>
      <ModeToggle />
      <UserButton />
    </div>
  );
}
