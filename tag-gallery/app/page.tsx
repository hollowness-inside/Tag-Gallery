import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen w-screen">
      <div className="bg-secondary w-[400px] flex p-2">
        <Button className="mx-auto">Clear Filters</Button>
      </div>
      <div className="bg-primary flex-1 p-2">
        Viewport
      </div>
    </div>
  );
}
