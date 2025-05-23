"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { CreateMemeDialog } from "./CreateMemeDialog";
import { Plus, Ticket } from "lucide-react";

interface CreateMemeButtonProps {
  ticketCost?: number;
}

export function CreateMemeButton({ ticketCost = 60 }: CreateMemeButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <Card className="p-4 rounded-none bg-[#fff6c3]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-gray-600" />
            <span className="text-xl font-mono font-bold text-gray-800">{ticketCost}</span>
          </div>
          <Button
            className="flex-1 bg-white hover:bg-gray-50 text-black border border-gray-200 h-12 rounded-none font-serif"
            onClick={() => setDialogOpen(true)}
          >
            MAKE A MEME
            <Plus className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Card>
      <CreateMemeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
