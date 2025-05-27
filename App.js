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

// Temaya göre NavigationContainer temasını seçen içerik bileşeni
function AppNavigator() {
  const { theme } = useContext(ThemeContext);

  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#ffffff',
      text: '#000000',
      card: '#ffffff',
      border: '#cccccc',
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme === 'amoled_black' ? '#000000' : '#333333',
      text: '#ffffff',
      card: '#000000',
      border: '#444444',
    },
  };

  return (
    <NavigationContainer theme={theme === 'light' ? lightTheme : darkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor:
              theme === 'light'
                ? '#ffffff'
                : theme === 'amoled_black'
                ? '#000000'
                : '#333333',
          },
          headerTintColor: theme === 'light' ? '#000000' : '#ffffff',
          tabBarStyle: {
            backgroundColor:
              theme === 'light'
                ? '#ffffff'
                : theme === 'amoled_black'
                ? '#000000'
                : '#333333',
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
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Notes"
          component={NotesStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen name="Settings" component={SettingsScreen} />
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

