"use client";

import React, { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { CreateMemeButton } from "~~/components/meme/CreateMemeButton";
import { HowToShillDialog } from "~~/components/meme/HowToShillDialog";

// Dynamically import Header with ssr: false
const Header = dynamic(() => import("~~/components/meme/Header").then(mod => mod.Header), {
  ssr: false,
  loading: () => <div className="h-[68px] mb-4 px-4">Loading Header...</div>, // Basic placeholder for header height
});

// New component to handle search params and main content
function EventPageContents() {
  const [showHowTo, setShowHowTo] = useState(true);
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("id") || null;

  // Store event ID in local storage when page loads
  useEffect(() => {
    if (eventId) {
      localStorage.setItem("currentEventId", eventId);
      console.log("Event ID stored:", eventId);
    }
  }, [eventId]);

  // If no event ID is present, show an error message
  if (!eventId) {
    return (
      <div className="px-4 py-8">
        <div className="w-full max-w-4xl mx-auto p-6 bg-white shadow text-center">
          <h1 className="text-2xl font-bold mb-4 text-black">Invalid Event</h1>
          <p className="text-gray-800">No event ID was provided. Please scan a valid QR code to join an event.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-0 px-0 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C71592960-1739296617275-phil_bg_6png')]">
      <div className="px-4 py-8">
        <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-white shadow">
          <h1 className="text-xl font-serif text-black">Event: {eventId}</h1>
          <p className="text-sm text-gray-800">Connect your wallet and claim your tokens to start participating!</p>
        </div>

        <CreateMemeButton ticketCost={60} />
        <div className="w-full max-w-4xl mx-auto space-y-4">
          <div className="bg-white shadow p-6 text-center">
            <p className="text-gray-800">No memes submitted yet. Be the first to create a meme!</p>
          </div>
        </div>
      </div>
      <HowToShillDialog open={showHowTo} onOpenChange={setShowHowTo} />
    </div>
  );
}

export default function EventPage() {
  return (
    <div className="min-h-screen py-0 px-0 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C71592960-1739296617275-phil_bg_6png')]">
      <Suspense fallback={<div className="h-[68px] mb-4 px-4">Loading Header...</div>}>
        <Header />
      </Suspense>
      <Suspense fallback={<div>Loading event details...</div>}>
        <EventPageContents />
      </Suspense>
    </div>
  );
}
