import React from 'react';
// @ts-expect-error react-dom types are not installed in devDependencies
import { createPortal } from 'react-dom';

export function FeedbackToastPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') {
    return null;
  }
  return createPortal(children, document.body);
}
