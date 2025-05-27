import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from '../locales/TranslationProvider';
import { ThemeContext } from '../contexts/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { t, changeLanguage, language } = useTranslation();
  // Tema context'ten alınıyor artık
  const { theme, setTheme } = useContext(ThemeContext);

  useEffect(() => {
    navigation.setOptions({
      title: t('settingsPageName'),
    });
  }, [navigation, t]);

  // Dark modları tek bir değişkende toplayalım
  const isDarkMode = theme === 'dark' || theme === 'amoled_black';
  const backgroundColor =
    theme === 'light' ? '#ffffff' : theme === 'dark' ? '#333333' : '#000000';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#555555' : '#cccccc';
  const dropdownIconColor = textColor;

  return (
    <View style={[styles.container, { backgroundColor }]}>  
      <Text style={[styles.label, { color: textColor }]}>{t('change_language')}</Text>

      <View style={[styles.pickerWrapper, { borderColor }]}>  
        <Picker
          selectedValue={language}
          onValueChange={(value) => changeLanguage(value)}
          mode="dropdown"
          dropdownIconColor={dropdownIconColor}
        >
          <Picker.Item label="Türkçe" value="tr" />
          <Picker.Item label="English" value="en" />
        </Picker>
      </View>

      <Text style={[styles.label, { color: textColor }]}>Tema Seçimi</Text>
      <View style={[styles.pickerWrapper, { borderColor }]}>  
        <Picker
          selectedValue={theme}
          onValueChange={(value) => setTheme(value)}
          mode="dropdown"
          dropdownIconColor={dropdownIconColor}
        >
          <Picker.Item label="Light Theme" value="light" />
          <Picker.Item label="Dark Theme" value="dark" />
          <Picker.Item label="Amoled Black Theme" value="amoled_black" />
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
});