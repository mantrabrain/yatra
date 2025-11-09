/**
 * Custom hook for auto-save functionality
 */

import { useState, useCallback, useRef } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave?: () => void;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
  const { delay = 1000, onSave } = options;
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsAutoSaving(true);

    timeoutRef.current = setTimeout(() => {
      if (onSave) {
        onSave();
      }
      setLastSaved(new Date());
      setIsAutoSaving(false);
    }, delay);
  }, [delay, onSave]);

  return {
    isAutoSaving,
    lastSaved,
    autoSave,
  };
};

