import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { useTranslation } from '../locales/TranslationProvider';

export default function SettingsScreen({ navigation }) {
  const { t, changeLanguage, language } = useTranslation();

  useEffect(() => {
    navigation.setOptions({
      title: t('settingsPageName'), 
    });
  }, [navigation, t]);

  return (
    <View style={{ padding: 20 }}>
      <Text>{t('settings')}</Text>
      <Text>{t('change_language')}</Text>

      <Button
        title="Türkçe"
        onPress={() => changeLanguage('tr')}
        disabled={language === 'tr'}
      />
      <Button
        title="English"
        onPress={() => changeLanguage('en')}
        disabled={language === 'en'}
      />
    </View>
  );
}

