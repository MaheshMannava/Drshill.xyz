"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "~~/components/meme/Header";
import { CreateMemeButton } from "~~/components/meme/CreateMemeButton";
import { MemeCard } from "~~/components/meme/MemeCard";
import { HowToShillDialog } from "~~/components/meme/HowToShillDialog";

// Mock memes data
const memes = [
  {
    symbol: "PINP",
    description:
      "The coin that makes you a true individual. This should be a max of 3 lines of text...",
    imageUrl: "/images/Image and frame.png",
    ticketCount: 8045,
    isTopPerformer: true,
  },
  {
    symbol: "CRAP",
    description: "This one's for the dookies out there.",
    imageUrl: "/images/crap.png",
    ticketCount: 324,
  },
  {
    symbol: "KERN",
    description:
      "The Opportunity you've all been waiting for. Invest at least 12 thumbs for good luck!",
    imageUrl: "/images/cornim11 1.png",
    ticketCount: 5,
  },
];

export default function EventPage() {
  const [showHowTo, setShowHowTo] = useState(true);
  const searchParams = useSearchParams();
  const eventId = searchParams?.get('id') || null;
  
  // Store event ID in local storage when page loads
  useEffect(() => {
    if (eventId) {
      localStorage.setItem('currentEventId', eventId);
      console.log('Event ID stored:', eventId);
    }
  }, [eventId]);

  // If no event ID is present, show an error message
  if (!eventId) {
    return (
      <div className="min-h-screen py-0 px-0 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C71592960-1739296617275-phil_bg_6png')]">
        <Header />
        <div className="px-4 py-8">
          <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Event</h1>
            <p className="text-gray-600">
              No event ID was provided. Please scan a valid QR code to join an event.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-0 px-0 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C71592960-1739296617275-phil_bg_6png')]">
      <Header />
      <div className="px-4 py-8">
        <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-white shadow">
          <h1 className="text-xl font-serif">Event: {eventId}</h1>
          <p className="text-sm text-gray-600">
            Connect your wallet and claim your tokens to start participating!
          </p>
        </div>
        
        <CreateMemeButton ticketCost={60} />
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {memes.map((meme) => (
            <div 
              key={meme.symbol} 
              className="bg-white shadow"
            >
              <MemeCard {...meme} />
            </div>
          ))}
        </div>
      </div>
      <HowToShillDialog open={showHowTo} onOpenChange={setShowHowTo} />
    </div>
  );
} 