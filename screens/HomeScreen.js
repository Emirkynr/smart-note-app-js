import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from '../locales/TranslationProvider';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();

  useEffect(() => {
    navigation.setOptions({
      title: t('homePageName'), // Header başlığını dinamik olarak ayarla
    });
  }, [navigation, t]);

  return (
    <View>
      <Text>{t('hello')}</Text>
    </View>
  );
}