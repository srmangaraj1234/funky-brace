// Zustand Global State Store for FixMyCity with Real-time Firestore Sync
// Combined Root Store using the Zustand Slice Pattern
import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice.js';
import { createIssuesSlice } from './slices/issuesSlice.js';
import { createUiSlice } from './slices/uiSlice.js';

export const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createIssuesSlice(set, get),
  ...createUiSlice(set, get),
}));
