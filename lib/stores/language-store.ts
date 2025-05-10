import { create } from 'zustand';

export type Language = 'ru' | 'ka';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'ru',
  setLanguage: (lang) => set({ language: lang }),
}));