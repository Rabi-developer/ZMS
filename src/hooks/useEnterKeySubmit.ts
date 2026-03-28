'use client';

import { useEffect } from 'react';

/**
 * Hook to handle Enter key submission for forms
 * This provides fine-grained control for specific forms if needed
 * 
 * @param onSubmitCallback - Callback function to execute when Enter is pressed
 * @param options - Configuration options
 */
export const useEnterKeySubmit = (
  onSubmitCallback: () => void,
  options?: {
    enabled?: boolean;
    excludeTextareas?: boolean;
    excludeContentEditable?: boolean;
    excludeModals?: boolean;
  }
) => {
  const {
    enabled = true,
    excludeTextareas = true,
    excludeContentEditable = true,
    excludeModals = true,
  } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Enter key is pressed (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target as HTMLElement;

        // Check exclusions
        const isTextarea = excludeTextareas && target.tagName === 'TEXTAREA';
        const isContentEditable = excludeContentEditable && target.isContentEditable;
        const isModalOpen = excludeModals && (
          document.querySelector('[role="dialog"]') ||
          document.querySelector('.fixed.inset-0.z-50') ||
          document.querySelector('.backdrop-blur-sm')
        );

        // Don't trigger if any exclusion applies
        if (isTextarea || isContentEditable || isModalOpen) {
          return;
        }

        // Check if we're inside a form
        const activeElement = document.activeElement;
        if (activeElement) {
          const closestForm = activeElement.closest('form');
          if (closestForm) {
            e.preventDefault();
            onSubmitCallback();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, excludeTextareas, excludeContentEditable, excludeModals, onSubmitCallback]);
};
