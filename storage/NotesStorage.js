import * as FileSystem from 'expo-file-system';
import { parseStringPromise, Builder } from 'xml2js';

const path = FileSystem.documentDirectory + 'notes.xml';

export async function loadNotes() {
  try {
    const exists = await FileSystem.getInfoAsync(path);
    if (!exists.exists) {
      const initialXml = new Builder().buildObject({ notes: { note: [] } });
      await FileSystem.writeAsStringAsync(path, initialXml, { encoding: FileSystem.EncodingType.UTF8 });
      return [];
    }
    const xml = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
    const result = await parseStringPromise(xml);
    const notes = result.notes.note || [];
    return notes.map((n, i) => ({
      id: n.id?.[0] || i.toString(),
      title: n.title?.[0] || '',
      content: n.content?.[0] || '',
    }));
  } catch (e) {
    console.error('loadNotes error:', e);
    return [];
  }
}

export async function saveNote(newNote) {
  const xml = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
  const result = await parseStringPromise(xml);
  const notes = result.notes.note || [];

  const updatedNotes = [...notes, {
    id: [newNote.id],
    title: [newNote.title],
    content: [newNote.content],
  }];

  const builder = new Builder();
  const newXml = builder.buildObject({ notes: { note: updatedNotes } });
  await FileSystem.writeAsStringAsync(path, newXml, { encoding: FileSystem.EncodingType.UTF8 });
}
