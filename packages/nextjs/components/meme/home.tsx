"use client";

import { useState } from "react";
import { CreateMemeButton } from "~~/components/meme/CreateMemeButton";
import { Header } from "~~/components/meme/Header";
import { HowToShillDialog } from "~~/components/meme/HowToShillDialog";
import { MemeCard } from "~~/components/meme/MemeCard";

const memes = [
  {
    symbol: "PINP",
    description: "The coin that makes you a true individual. This should be a max of 3 lines of text...",
    imageUrl: "/assets/pinp.png",
    ticketCount: 8045,
    isTopPerformer: true,
  },
  {
    symbol: "CRAP",
    description: "This one's for the dookies out there.",
    imageUrl: "/assets/crap.png",
    ticketCount: 324,
  },
  {
    symbol: "KERN",
    description: "The Opportunity you've all been waiting for. Invest at least 12 thumbs for good luck!",
    imageUrl: "/assets/corn.png",
    ticketCount: 5,
  },
];

function Home() {
  const [showHowTo, setShowHowTo] = useState(true);

  return (
    <div className="min-h-screen py-0 px-0 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C71592960-1739296617275-phil_bg_6png')]">
      <Header />
      <div className="px-4 py-8">
        <CreateMemeButton ticketCost={60} />
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {memes.map(meme => (
            <div key={meme.symbol} className="bg-white shadow">
              <MemeCard {...meme} />
            </div>
          ))}
        </div>
      </div>
      <HowToShillDialog open={showHowTo} onOpenChange={setShowHowTo} />
    </div>
  );
}

export default Home;
