"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "~~/components/meme/Header";

export default function CreateMemePage() {
  const router = useRouter();
  const [memeData, setMemeData] = useState({
    symbol: "",
    description: "",
    image: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMemeData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMemeData(prev => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual meme creation with web3 integration
      console.log("Creating meme with data:", memeData);

      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirect back to home page
      router.push("/");
    } catch (error) {
      console.error("Error creating meme:", error);
      alert("Failed to create meme. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-[url('https://storage.googleapis.com/tempo-public-images/github%7C71592960-1739296617275-phil_bg_6png')]">
      <Header />

      <div className="w-full max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
        <h1 className="text-2xl font-bold mb-6">Create Your Meme</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="symbol" className="block text-sm font-medium mb-1">
              Meme Symbol (3-5 characters)
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={memeData.symbol}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              maxLength={5}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (max 100 characters)
            </label>
            <textarea
              id="description"
              name="description"
              value={memeData.description}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              maxLength={100}
              rows={3}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="image" className="block text-sm font-medium mb-1">
              Meme Image
            </label>
            <input
              type="file"
              id="image"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              accept="image/*"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Meme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
