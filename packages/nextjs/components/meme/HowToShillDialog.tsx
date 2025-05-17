"use client";

import { Dialog, DialogContent } from "../ui/dialog";
import { DialogPortal } from "@radix-ui/react-dialog";
import Image from 'next/image';

interface HowToShillDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HowToShillDialog({
  open = true,
  onOpenChange,
}: HowToShillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-[440px] gap-0 bg-[#bcbcbc] border-0 rounded-none px-0 py-0">
          {/* Yellow strip at top */}

          {/* Main content area */}
          <div className="m-3 shadow-[2px_2px_4px_rgba(0,0,0,0.05)] bg-[#bcbcbc]">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-[#E6E6E6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-[#bcbcbc]">
                  <span className="font-serif text-base leading-none text-[#797979]">
                    Dr
                    <br />
                    Shill
                  </span>
                </div>
                <h2 className="text-xl font-serif">HOW TO SHILL</h2>
              </div>
              <button
                onClick={() => onOpenChange?.(false)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-black/5"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 relative bg-[#bcbcbc]">
              {/* Speech bubble */}
              <div className="p-3 rounded-lg mb-6 relative font-serif bg-[#efefef]">
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-[8px] border-l-[#FFFBE6] border-y-[6px] border-y-transparent" />
                <p className="font-comic text-sm font-serif">
                  "YUH GOT TO TAKE RESPONSIBILITY FOR YOUR TICKETS, MUCHACHO."
                </p>
              </div>

              {/* Dr. Shill image */}
              <div className="absolute right-4 top-16 w-32 h-32">
                <Image
                  src="/assets/DRSHILL3.png"
                  alt="Dr. Shilly"
                  width={128}
                  height={128}
                  className="object-contain"
                />
              </div>

              {/* Rules */}
              <div className="space-y-4 pr-36">
                <p className="text-sm">
                  YOU START WITH <span className="font-bold">100</span> TICKETS.
                </p>

                <p className="text-sm">
                  SUBMIT A MEME FOR <span className="font-bold">60</span>{" "}
                  TICKETS.
                </p>

                <p className="text-sm">
                  VOTE ON MEMES (THUMBS UP OR DOWN). IT COSTS{" "}
                  <span className="font-bold">1</span> TICKET PER VOTE.
                </p>

                <p className="text-sm">
                  AT THE END OF THE DAY, THE MEME WITH THE MOST VOTES WILL BE
                  MINTED AS A MEMECOIN ON THE{" "}
                  <span className="font-bold text-blue-600">CORN NETWORK</span>.
                </p>

                <p className="text-sm">
                  IF YOU VOTED THUMBS UP ON THE WINNER, YOU'LL RECEIVE A
                  PROPORTIONAL SHARE OF THE NEW MEMECOIN.
                </p>

                <p className="text-sm">
                  THE MEME CREATOR GETS <span className="font-bold">30%</span>{" "}
                  OF THE TOTAL SUPPLY.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E6E6E6]">
              <button
                onClick={() => onOpenChange?.(false)}
                className="w-full h-12 bg-[#2563EB] hover:bg-blue-700 text-white font-serif"
              >
                OK
              </button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
} 