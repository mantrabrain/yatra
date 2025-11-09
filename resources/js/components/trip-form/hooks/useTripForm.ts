/**
 * Custom hook for trip form logic
 * Centralizes form state management and handlers
 */

import { useState, useCallback } from 'react';
import { TripFormData } from '../types';

export const useTripForm = (initialData: TripFormData) => {
  const [formData, setFormData] = useState<TripFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = useCallback((field: keyof TripFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const updateFormData = useCallback((data: Partial<TripFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  return {
    formData,
    errors,
    handleFieldChange,
    setError,
    clearErrors,
    updateFormData,
    setFormData,
  };
};

