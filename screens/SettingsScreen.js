import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Menu, Button, Provider as PaperProvider } from 'react-native-paper';
import { useTranslation } from '../locales/TranslationProvider';
import themes from '../themes';
import { ThemeContext } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;
const horizontalPadding = 20;
const dropdownWidth = screenWidth - horizontalPadding * 2;

export default function SettingsScreen({ navigation }) {
  const { t, changeLanguage, language } = useTranslation();
  const { theme, setTheme } = useContext(ThemeContext);
  const colors = themes[theme];

  // Seçenekler
  const languageOptions = [
    { label: 'Türkçe', value: 'tr' },
    { label: 'English', value: 'en' },
  ];
  const themeOptions = [
    { label: t('light_theme'), value: 'light' },
    { label: t('dark_theme'), value: 'dark' },
    { label: t('amoled_black_theme'), value: 'amoled_black' },
  ];

  // Seçili indexleri bul
  const selectedLang = languageOptions.find(opt => opt.value === language) || languageOptions[0];
  const selectedTheme = themeOptions.find(opt => opt.value === theme) || themeOptions[0];

  // Menü state
  const [langMenuVisible, setLangMenuVisible] = useState(false);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);

  // Tema renkleri
  const isDark = theme !== 'light';
  const backgroundColor = theme === 'light' ? '#fff' : theme === 'dark' ? '#333' : '#000';
  const textColor = isDark ? '#fff' : '#000';
  const pickerBg = theme === 'amoled_black' ? '#000' : theme === 'dark' ? '#222' : '#fff';

  useEffect(() => {
    navigation.setOptions({ title: t('settingsPageName') });
  }, [navigation, t]);

  // Ekran genişliğini al
  const screenPadding = 20; // styles.container'daki padding
  // const dropdownWidth = `100%`; // Tam genişlik, padding ile sınırlandırılacak

  return (
    <PaperProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.label, { color: textColor }]}>{t('change_language')}</Text>
        <Menu
          visible={langMenuVisible}
          onDismiss={() => setLangMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setLangMenuVisible(true)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: pickerBg,
                  borderColor: isDark ? '#444' : '#ccc',
                  width: dropdownWidth,
                },
              ]}
              labelStyle={{ color: textColor, fontSize: 16 }}
              contentStyle={{ height: 48, justifyContent: 'center' }}
            >
              {selectedLang.label}
            </Button>
          }
          contentStyle={{
            backgroundColor: pickerBg,
            width: dropdownWidth,
            minWidth: 220,
            borderWidth: theme === 'amoled_black' ? 1 : 0,
            borderColor: theme === 'amoled_black' ? '#fff' : undefined,
            borderRadius: 8,
            alignSelf: 'center',
          }}
        >
          {languageOptions.map(opt => (
            <Menu.Item
              key={opt.value}
              onPress={() => {
                changeLanguage(opt.value);
                setLangMenuVisible(false);
              }}
              title={opt.label}
              titleStyle={{ color: textColor, fontSize: 16 }}
              style={{ height: 48, justifyContent: 'center' }}
            />
          ))}
        </Menu>

        <Text style={[styles.label, { color: textColor }]}>{t('theme_selection')}</Text>
        <Menu
          visible={themeMenuVisible}
          onDismiss={() => setThemeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setThemeMenuVisible(true)}
              style={[
                styles.dropdown,
                {
                  backgroundColor: pickerBg,
                  borderColor: isDark ? '#444' : '#ccc',
                  width: dropdownWidth,
                },
              ]}
              labelStyle={{ color: textColor, fontSize: 16 }}
              contentStyle={{ height: 48, justifyContent: 'center' }}
            >
              {selectedTheme.label}
            </Button>
          }
          contentStyle={{
            backgroundColor: pickerBg,
            width: dropdownWidth,
            minWidth: 220,
            borderWidth: theme === 'amoled_black' ? 1 : 0,
            borderColor: theme === 'amoled_black' ? '#fff' : undefined,
            borderRadius: 8,
            alignSelf: 'center',
          }}
        >
          {themeOptions.map(opt => (
            <Menu.Item
              key={opt.value}
              onPress={() => {
                setTheme(opt.value);
                setThemeMenuVisible(false);
              }}
              title={opt.label}
              titleStyle={{ color: textColor, fontSize: 16 }}
              style={{ height: 48, justifyContent: 'center' }}
            />
          ))}
        </Menu>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 8 },
  dropdown: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 4,
    alignSelf: 'stretch', // Tam genişlik
  },
});
