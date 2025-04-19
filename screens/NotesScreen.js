import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function NotesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Notes List</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // Yeni not oluşturma fonksiyonuna yönlendirme yapılacak
          navigation.navigate('NoteDetail', { isNew: true });
        }}
      >
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
