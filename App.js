import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Sayfa bileşenlerini import et
import HomeScreen from './screens/HomeScreen';
import NotesScreen from './screens/NotesScreen';
import SettingsScreen from './screens/SettingsScreen';
import NoteDetailScreen from './screens/NoteDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); // Stack navigasyonu oluşturuyoruz

// Notes ekranı için Stack yapısını kuruyoruz
function NotesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Notes" component={NotesScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Notes" component={NotesStack} options={{ headerShown: false }}  />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
