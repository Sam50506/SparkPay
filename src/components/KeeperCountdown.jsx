import React, { useState, useEffect } from 'react';
import { SB_URL, SB_KEY } from '../config';

export function KeeperCountdown({ suffix = ' to cancel' }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    async function fetchLastRun() {
      try {
        const res = await fetch(`${SB_URL}/rest/v1/keeper_status?id=eq.1&select=last_run`, {
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`
          }
        });
        const data = await res.json();
        if (data[0]?.last_run) {
          const lastRun = new Date(data[0].last_run).getTime();
          const now = Date.now();
          const interval = 15 * 60 * 1000;
          const elapsed = (now - lastRun) % interval;
          const secondsUntilNext = Math.floor((interval - elapsed) / 1000);
          setSecondsLeft(secondsUntilNext);
        }
      } catch (e) {}
    }
    fetchLastRun();
  }, []);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  if (secondsLeft === 0) return <span>Processing soon...</span>;
  return <span>{mins}m {secs}s{suffix}</span>;
}
