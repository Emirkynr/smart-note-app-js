import React, { useContext } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { enableScreens } from 'react-native-screens';

import HomeScreen from "./screens/HomeScreen";
import NotesScreen from "./screens/NotesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import NoteDetailScreen from "./screens/NoteDetailScreen";
import CameraScreen from "./screens/CameraScreen";

import { TranslationProvider } from "./locales/TranslationProvider";
import { ThemeProvider, ThemeContext } from "./contexts/ThemeContext";
import { useTranslation } from "./locales/TranslationProvider";

enableScreens();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function NotesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      <Stack.Screen name="CameraScreen" component={CameraScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
      text: '#000000',
      card: '#f3f3f3',
      border: '#cccccc', 
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme === 'amoled_black' ? '#000000' : '#222326',
      text: '#ffffff',
      card: theme === 'amoled_black' ? '#000000' : '#23242a',
      border: theme === 'amoled_black' ? '#fff' : '#666',
    },
  };

  return (
    <NavigationContainer theme={theme === 'light' ? lightTheme : darkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor:
              theme === 'light'
                ? '#f3f3f3'
                : theme === 'amoled_black'
                ? '#000000'
                : '#23242a',
            borderBottomWidth: 1,
            borderBottomColor:
              theme === 'amoled_black'
                ? '#fff'
                : theme === 'light'
                ? '#cccccc'
                : '#666',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme === 'light' ? '#000000' : '#ffffff',
          tabBarStyle: {
            backgroundColor:
              theme === 'light'
                ? '#f3f3f3'
                : theme === 'amoled_black'
                ? '#000000'
                : '#23242a',
            borderTopWidth: 1,
            borderTopColor:
              theme === 'amoled_black'
                ? '#fff'
                : theme === 'light'
                ? '#cccccc'
                : '#666',
          },
          tabBarActiveTintColor: theme === 'light' ? 'blue' : 'lightblue',
          tabBarInactiveTintColor: theme === 'light' ? 'gray' : 'darkgray',
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home-outline';
            else if (route.name === 'Notes') iconName = 'book-outline';
            else if (route.name === 'Settings') iconName = 'settings-outline';
            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarLabel: t('homePageName') }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesStack}
          options={{
            headerShown: false,
            tabBarLabel: t('NotesPageName'),
          }}
          listeners={({ navigation }) => ({
            tabPress: e => {
              navigation.navigate('Notes', { screen: 'Notes' });
            },
          })}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: t('settingsPageName') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TranslationProvider>
        <AppNavigator />
      </TranslationProvider>
    </ThemeProvider>
  );
}

