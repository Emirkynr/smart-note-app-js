import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons'; // İkonlar için import

// Sayfa bileşenlerini import et
import HomeScreen from './screens/HomeScreen';
import NotesScreen from './screens/NotesScreen';
import SettingsScreen from './screens/SettingsScreen';
import NoteDetailScreen from './screens/NoteDetailScreen';

// TranslationProvider'ı import et
import { TranslationProvider } from './locales/TranslationProvider';

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
    <TranslationProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = 'home'; // Ev ikonu
              } else if (route.name === 'Notes') {
                iconName = 'book'; // Defter/Sayfa ikonu
              } else if (route.name === 'Settings') {
                iconName = 'settings'; // Ayarlar dişlisi
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarShowLabel: false, // İsimleri kaldır
            tabBarActiveTintColor: 'blue', // Aktif ikon rengi
            tabBarInactiveTintColor: 'gray', // Pasif ikon rengi
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Notes" component={NotesStack} options={{ headerShown: false }} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </TranslationProvider>
  );
}
