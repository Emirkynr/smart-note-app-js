import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadNotes() {
  try {
    const notesJson = await AsyncStorage.getItem('notes');
    if (notesJson) {
      return JSON.parse(notesJson);
    }
    return [];
  } catch (e) {
    console.error('loadNotes error:', e);
    return [];
  }
}

export async function saveNote(updatedNote) {
  try {
    const notes = await loadNotes();
    const noteIndex = notes.findIndex((note) => note.id === updatedNote.id);
    if (noteIndex !== -1) {
      notes[noteIndex] = updatedNote;
    } else {
      notes.push(updatedNote);
    }
    await AsyncStorage.setItem('notes', JSON.stringify(notes));
  } catch (e) {
    console.error('saveNote error:', e);
  }
}
