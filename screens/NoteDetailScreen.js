import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { saveNote } from '../storage/NotesStorage';

export default function NoteDetailScreen({ route, navigation }) {
  const { note } = route.params;
  const [currentNote, setCurrentNote] = useState(note);
  const [originalNote, setOriginalNote] = useState(note);

  // Her 5 saniyede bir değişiklikleri kaydet
  useEffect(() => {
    const interval = setInterval(async () => {
      if (
        currentNote.title !== originalNote.title ||
        currentNote.content !== originalNote.content
      ) {
        await saveNote(currentNote);
        setOriginalNote(currentNote);
      }
    }, 10);

    return () => clearInterval(interval); // Bileşen unmount olduğunda interval'i temizle
  }, [currentNote, originalNote]);

  // Geri gidildiğinde değişiklikleri kaydet
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async () => {
      if (
        currentNote.title !== originalNote.title ||
        currentNote.content !== originalNote.content
      ) {
        await saveNote(currentNote);
      }
    });

    return unsubscribe; // Bileşen unmount olduğunda dinleyiciyi kaldır
  }, [navigation, currentNote, originalNote]);

  const handleTitleChange = (text) => {
    setCurrentNote((prev) => ({ ...prev, title: text }));
  };

  const handleContentChange = (text) => {
    setCurrentNote((prev) => ({ ...prev, content: text }));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.titleInput}
        value={currentNote.title}
        onChangeText={handleTitleChange}
        placeholder="Başlık"
      />
      <TextInput
        style={styles.contentInput}
        value={currentNote.content}
        onChangeText={handleContentChange}
        placeholder="İçerik"
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    textAlignVertical: 'top',
  },
});
