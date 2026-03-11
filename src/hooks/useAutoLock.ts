import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

const TIMEOUT_DURATION = 15 * 60 * 1000;
const WARNING_DURATION = 14 * 60 * 1000;

interface AutoLockOptions {
  enabled?: boolean;
  timeoutMs?: number;
  warningMs?: number;
}

export const useAutoLock = (options: AutoLockOptions = {}) => {
  const {
    enabled = true,
    timeoutMs = TIMEOUT_DURATION,
    warningMs = WARNING_DURATION,
  } = options;

  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    setShowWarning(false);
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    await logout();
  }, [logout, clearTimers]);

  const resetTimer = useCallback(() => {
    if (!enabled || !user) return;

    clearTimers();

    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningMs);

    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [enabled, user, timeoutMs, warningMs, handleLogout, clearTimers]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled || !user) {
      clearTimers();
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledResetTimer = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000);
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledResetTimer);
    });

    resetTimer();

    return () => {
      clearTimers();
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach((event) => {
        document.removeEventListener(event, throttledResetTimer);
      });
    };
  }, [enabled, user, resetTimer, clearTimers]);

  return {
    showWarning,
    dismissWarning,
    remainingTime: timeoutMs - warningMs,
  };
};
