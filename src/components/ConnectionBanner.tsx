import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import './ConnectionBanner.css';

/**
 * Fixed banner that slides down when the WebSocket connection drops.
 * Shows a brief delay before appearing to avoid flashing during normal
 * reconnect cycles (< 2s).
 */
export const ConnectionBanner: React.FC = () => {
  const isConnected = useSelector((s: RootState) => s.messaging.isConnected);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!isConnected) {
      // Don't flash banner for brief reconnects — wait 2s
      timer = setTimeout(() => setVisible(true), 2000);
    } else {
      setVisible(false);
    }

    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!visible) return null;

  return (
    <div className="connection-banner" role="alert" aria-live="polite">
      <span className="connection-banner__dot" />
      <span className="connection-banner__text">Reconnecting…</span>
    </div>
  );
};
