import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Home() {
  return (
    <div className="flex flex items-center justify-center h-screen">
      <Button>ChatGPT Clone</Button>
      <ModeToggle />
    </div>
  );
}
