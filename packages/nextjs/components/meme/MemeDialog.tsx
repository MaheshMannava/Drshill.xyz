import React, { useState } from "react";
import { ThumbsDown, ThumbsUp, Ticket } from "lucide-react";

interface MemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  description: string;
  imageUrl: string;
  ticketCount: number;
}

export const MemeDialog: React.FC<MemeDialogProps> = ({
  open,
  onOpenChange,
  symbol,
  description,
  imageUrl,
  ticketCount,
}) => {
  const [comment, setComment] = useState("");

  // Sample comments - in a real app, these would come from an API or state
  const comments = [
    {
      address: "0x3849504xcw3932...",
      comment: "Whoa, this meme is tight!",
    },
    {
      address: "0x943r3299dfv9d51...",
      comment: "Interesting choice to change the letter M to N.",
    },
    {
      address: "0x8430448jn52851...",
      comment: "This looks like a promising investment",
    },
    {
      address: "0x6389D472jn292m1...",
      comment: "PINP is the strategic reserve chosen by Mr. Trump!",
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 flex items-center border-b border-gray-200">
          <button onClick={() => onOpenChange(false)} className="mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">${symbol}</h2>
        </div>

        {/* Image and Description */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            {/* Meme Image */}
            <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
              <img src={imageUrl} alt={symbol} className="w-full h-full object-contain" />
            </div>

            {/* Description and Action Buttons */}
            <div className="flex-1">
              <p className="text-sm text-gray-800">{description}</p>
              <p className="text-xs text-gray-500 mt-1">FULL DESCRIPTION - MAX 3 LINES</p>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 w-12 flex items-center justify-center">
                  <ThumbsDown className="h-5 w-5" />
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 p-2 w-12 flex items-center justify-center">
                  <Ticket className="h-5 w-5" />
                </button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white p-2 w-12 flex items-center justify-center">
                  <ThumbsUp className="h-5 w-5" />
                </button>
                <div className="ml-auto flex items-center text-yellow-500">
                  <Ticket className="h-4 w-4 mr-1" />
                  <span className="font-bold">{ticketCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div>
          <div className="text-sm font-medium px-4 py-2 border-b border-gray-200">PINP CREATOR NAME</div>

          {/* Comments List */}
          <div className="flex flex-col divide-y divide-gray-200">
            {comments.map((item, index) => (
              <div key={index} className="px-4 py-2">
                <div className="text-xs text-blue-600">{item.address}</div>
                <div className="text-sm">{item.comment}</div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="p-3 flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="0x6389D472jn292m1..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 focus:outline-none"
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 text-sm font-medium"
              onClick={() => {
                if (comment) {
                  console.log("Sending comment:", comment);
                  setComment("");
                }
              }}
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
