import { useState, useEffect, useCallback } from 'react';

const FOCUS_MODE_KEY = 'tradlyte_focus_mode';

// Create a custom event for focus mode changes to sync across components
const FOCUS_MODE_EVENT = 'focusModeChanged';

export const useFocusMode = () => {
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(FOCUS_MODE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Listen for focus mode changes from other components
  useEffect(() => {
    const handleFocusModeChange = (e: CustomEvent) => {
      setFocusMode(e.detail.focusMode);
    };

    window.addEventListener(FOCUS_MODE_EVENT as any, handleFocusModeChange as EventListener);
    return () => {
      window.removeEventListener(FOCUS_MODE_EVENT as any, handleFocusModeChange as EventListener);
    };
  }, []);

  const toggleFocusMode = useCallback(() => {
    const newValue = !focusMode;
    setFocusMode(newValue);
    try {
      localStorage.setItem(FOCUS_MODE_KEY, newValue.toString());
      // Dispatch event to sync across all components
      window.dispatchEvent(new CustomEvent(FOCUS_MODE_EVENT, { detail: { focusMode: newValue } }));
    } catch (error) {
      console.error('Failed to save focus mode:', error);
    }
  }, [focusMode]);

  return {
    focusMode,
    toggleFocusMode,
  };
};
