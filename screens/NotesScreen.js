import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { loadNotes, saveNote } from '../storage/NotesStorage';

export default function NotesScreen({ navigation }) {
  const [notes, setNotes] = useState([]);

  // Sayfa her odaklandığında notları yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      const fetchNotes = async () => {
        const loadedNotes = await loadNotes();
        setNotes(loadedNotes);
      };

      fetchNotes();
    }, [])
  );

  // NoteDetailScreen'den geri dönüldüğünde notları güncelle
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const loadedNotes = await loadNotes();
      setNotes(loadedNotes);
    });

    return unsubscribe; // Dinleyiciyi kaldır
  }, [navigation]);

  const handleAddNote = async () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'Yeni Not',
      content: '',
    };
    await saveNote(newNote);
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => navigation.navigate('NoteDetail', { note: item })}
    >
      <Text style={styles.noteTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  noteItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  noteTitle: { fontSize: 18 },
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
