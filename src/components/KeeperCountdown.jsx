import React, { useState, useEffect } from 'react';
import { SB_URL } from '../config';

export function KeeperCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    async function fetchLastRun() {
      try {
        const res = await fetch(`${SB_URL}/rest/v1/keeper_status?id=eq.1&select=last_run`, {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          }
        });
        const data = await res.json();
        if (data[0]?.last_run) {
          const lastRun = new Date(data[0].last_run).getTime();
          const nextRun = lastRun + 15 * 60 * 1000;
          const now = Date.now();
          setSecondsLeft(Math.max(0, Math.floor((nextRun - now) / 1000)));
        }
      } catch (e) {}
    }
    fetchLastRun();
  }, []);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <span style={{color: secondsLeft < 60 ? 'var(--re)' : 'var(--ac)', fontWeight: 700}}>
      {secondsLeft === 0 ? 'Processing soon...' : `${mins}m ${secs}s to cancel`}
    </span>
  );
}
