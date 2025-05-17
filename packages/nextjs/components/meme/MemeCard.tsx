import React, { useState } from "react";
import Image from "next/image";
import { MemeDialog } from "./MemeDialog";
import { ThumbsDown, ThumbsUp, Ticket } from "lucide-react";

interface MemeCardProps {
  symbol: string;
  description: string;
  imageUrl: string;
  ticketCount: number;
  isTopPerformer?: boolean;
  className?: string;
}

export const MemeCard: React.FC<MemeCardProps> = ({
  symbol,
  description,
  imageUrl,
  ticketCount,
  isTopPerformer = false,
  className = "",
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div
        className={`p-4 bg-white mb-1 border-b border-gray-200 cursor-pointer ${className}`}
        onClick={() => setDialogOpen(true)}
      >
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-20 h-20 bg-gray-100 flex-shrink-0 relative">
            <Image src={imageUrl} alt={`${symbol} meme`} fill className="object-cover" sizes="80px" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-black">${symbol}</h2>
            <p className="text-sm text-gray-700 mb-4">{description}</p>

            <div className="flex items-center justify-between">
              {/* Action Buttons */}
              <div className="flex gap-1">
                <button
                  className="bg-blue-600 text-white p-1.5 rounded-none flex items-center justify-center w-8 h-8"
                  onClick={e => {
                    e.stopPropagation();
                    console.log("Downvote", symbol);
                  }}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
                <button
                  className="bg-white border border-gray-300 p-1.5 rounded-none flex items-center justify-center w-8 h-8"
                  onClick={e => {
                    e.stopPropagation();
                    console.log("Ticket", symbol);
                  }}
                >
                  <Ticket className="h-4 w-4 text-gray-800" />
                </button>
                <button
                  className="bg-orange-500 text-white p-1.5 rounded-none flex items-center justify-center w-8 h-8"
                  onClick={e => {
                    e.stopPropagation();
                    console.log("Upvote", symbol);
                  }}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
              </div>

              {/* Ticket Count */}
              <div className="flex items-center">
                {isTopPerformer && <span className="text-yellow-500 mr-1">👑</span>}
                <Ticket className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-mono font-bold text-black">{ticketCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MemeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        symbol={symbol}
        description={description}
        imageUrl={imageUrl}
        ticketCount={ticketCount}
      />
    </>
  );
};
