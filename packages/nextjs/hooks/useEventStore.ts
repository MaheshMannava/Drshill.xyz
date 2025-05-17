import { useState, useEffect } from 'react';

// Simple event store to track the current event ID
export const useEventStore = () => {
  const [currentEventId, setCurrentEventId] = useState<`0x${string}` | null>(null);

  // Load event ID from localStorage on initial load
  useEffect(() => {
    const storedEventId = localStorage.getItem('currentEventId');
    if (storedEventId) {
      try {
        setCurrentEventId(storedEventId as `0x${string}`);
      } catch (error) {
        console.error('Invalid event ID in storage', error);
        localStorage.removeItem('currentEventId');
      }
    }
  }, []);

  // Update the current event ID and persist it
  const updateCurrentEventId = (eventId: `0x${string}` | null) => {
    setCurrentEventId(eventId);
    if (eventId) {
      localStorage.setItem('currentEventId', eventId);
    } else {
      localStorage.removeItem('currentEventId');
    }
  };

  return {
    currentEventId,
    updateCurrentEventId,
  };
}; 