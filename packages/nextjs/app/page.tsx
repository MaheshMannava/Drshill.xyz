"use client";

import dynamic from "next/dynamic";

const Home = dynamic(() => import("~~/components/meme/home"), { ssr: false });

export default function Page() {
  return <Home />;
}
