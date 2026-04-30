import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import './ConnectionBanner.css';


export const ConnectionBanner: React.FC = () => {
  const isConnected = useSelector((s: RootState) => s.messaging.isConnected);
  const userId = useSelector((s: RootState) => s.user.id);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!userId) {
      setVisible(false);
      return;
    }

    if (!isConnected) {
      timerRef.current = setTimeout(() => setVisible(true), 10_000);
    } else {
      setVisible(false);
    }

    return () => clearTimeout(timerRef.current);
  }, [isConnected, userId]);

  if (!visible) return null;

  return (
    <div className="connection-banner" role="alert" aria-live="polite">
      <span className="connection-banner__dot" />
      <span className="connection-banner__text">Reconnecting…</span>
    </div>
  );
};
