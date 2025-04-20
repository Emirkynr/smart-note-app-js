import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tr from '../locales/tr.json';
import en from '../locales/en.json';

const TranslationContext = createContext();

const translations = { tr, en };
const STORAGE_KEY = 'appLanguage';

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLang) {
        setLanguage(storedLang);
      } else {
        const deviceLang = Localization.locale.split('-')[0];
        setLanguage(['tr', 'en'].includes(deviceLang) ? deviceLang : 'en');
      }
    };
    loadLanguage();
  }, []);

  const t = (key) => translations[language][key] || key;

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  return (
    <TranslationContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
