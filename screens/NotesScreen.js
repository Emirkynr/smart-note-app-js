import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadNotes, saveNote } from "../storage/NotesStorage";
import { BackHandler } from "react-native";
import { useTranslation } from "../locales/TranslationProvider";

export default function NotesScreen({ navigation }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotes = async () => {
        const loadedNotes = await loadNotes();
        setNotes(loadedNotes);
      };

      fetchNotes();
    }, [])
  );

  useEffect(() => {
    const onBackPress = () => {
      if (editMode) {
        setEditMode(false);
        setSelectedNotes([]);
        return true;
      }
      return false;
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [editMode]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        editMode && (
          <TouchableOpacity
            onPress={() => {
              const allPinned = selectedNotes.every(
                (id) => notes.find((note) => note.id === id)?.isPinned
              );
              Alert.alert("Seçenekler", "", [
                {
                  text: allPinned ? "Unpin" : "Pin",
                  onPress: allPinned ? handleUnpin : handlePin,
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: handleDelete,
                },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
          >
            <Icon name="ellipsis-vertical" size={24} color="black" />
          </TouchableOpacity>
        ),
    });
  }, [editMode, selectedNotes, notes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (editMode) {
        e.preventDefault();
        setEditMode(false);
        setSelectedNotes([]);
      }
    });

    return unsubscribe;
  }, [navigation, editMode]);

  useEffect(() => {
    navigation.setOptions({
      title: t("NotesPageName"),
    });
  }, [navigation, t]);

  const handleAddNote = async () => {
    const newNote = {
      id: Date.now().toString(),
      title: "Yeni Not",
      content: "",
      isPinned: false,
    };
    await saveNote(newNote);
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleLongPress = (noteId) => {
    setEditMode(true);
    setSelectedNotes([noteId]);
  };

  const handleCheckboxPress = (noteId) => {
    if (selectedNotes.includes(noteId)) {
      const updatedSelectedNotes = selectedNotes.filter((id) => id !== noteId);
      setSelectedNotes(updatedSelectedNotes);
      if (updatedSelectedNotes.length === 0) {
        setEditMode(false);
      }
    } else {
      setSelectedNotes((prev) => [...prev, noteId]);
    }
  };

  const handleDelete = () => {
    Alert.alert(`${selectedNotes.length} not silinecek`, "Emin misiniz?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const remainingNotes = notes.filter(
            (note) => !selectedNotes.includes(note.id)
          );
          setNotes(remainingNotes);
          setSelectedNotes([]);
          setEditMode(false);
          await AsyncStorage.setItem("notes", JSON.stringify(remainingNotes)); // Kalıcı olarak sil
        },
      },
    ]);
  };

  const handlePin = async () => {
    const updatedNotes = notes.map((note) =>
      selectedNotes.includes(note.id) ? { ...note, isPinned: true } : note
    );

    const pinnedNotes = updatedNotes.filter((note) => note.isPinned);
    const unpinnedNotes = updatedNotes.filter((note) => !note.isPinned);

    setNotes([...pinnedNotes, ...unpinnedNotes]);
    setSelectedNotes([]);
    setEditMode(false);

    await AsyncStorage.setItem(
      "notes",
      JSON.stringify([...pinnedNotes, ...unpinnedNotes])
    );
  };

  const handleUnpin = async () => {
    const updatedNotes = notes.map((note) =>
      selectedNotes.includes(note.id) ? { ...note, isPinned: false } : note
    );

    const pinnedNotes = updatedNotes.filter((note) => note.isPinned);
    const unpinnedNotes = updatedNotes.filter((note) => !note.isPinned);

    setNotes([...pinnedNotes, ...unpinnedNotes]);
    setSelectedNotes([]);
    setEditMode(false);

    await AsyncStorage.setItem(
      "notes",
      JSON.stringify([...pinnedNotes, ...unpinnedNotes])
    );
  };

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onLongPress={() => handleLongPress(item.id)}
      onPress={() => {
        if (editMode) {
          handleCheckboxPress(item.id);
        } else {
          navigation.navigate("NoteDetail", { note: item });
        }
      }}
    >
      {editMode && (
        <Icon
          name={selectedNotes.includes(item.id) ? "checkbox" : "square-outline"}
          size={24}
          color="black"
          style={styles.checkbox}
        />
      )}
      {!editMode && item.isPinned && (
        <Icon name="pin" size={24} color="black" style={styles.pinIcon} />
      )}
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  noteTitle: { fontSize: 18, marginLeft: 8 },
  checkbox: { marginRight: 8 },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#007bff",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  pinIcon: { marginRight: 8 },
});
