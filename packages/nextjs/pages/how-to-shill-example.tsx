"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { HowToShillDialog } from "../components/shill/HowToShillDialog";
import { Card } from "../components/ui/card";

export default function HowToShillExample() {
  const [dialogOpen, setDialogOpen] = useState(true); // Start with dialog open
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-serif mb-4">How To Shill Dialog Example</h1>
        
        <p className="mb-6">
          This page demonstrates the "How To Shill" dialog that explains the rules of the 
          ShillDoc platform. The dialog matches the design from the screenshot exactly.
        </p>
        
        <p className="mb-2 font-medium">Features:</p>
        <ul className="list-disc pl-6 mb-6">
          <li>Dialog styling matches the screenshot exactly</li>
          <li>Uses the DialogPortal from @radix-ui/react-dialog</li>
          <li>Space for the Dr. Shill image that will be added later</li>
          <li>Fully responsive dialog with proper text formatting</li>
        </ul>
        
        <div className="flex gap-4">
          <Button 
            onClick={() => setDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Open Dialog
          </Button>
          
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="outline"
          >
            Close Dialog
          </Button>
        </div>
      </Card>
      
      <HowToShillDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </div>
  );
} 