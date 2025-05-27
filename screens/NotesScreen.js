import React, { useContext, useEffect, useState } from "react";
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
import themes from "../themes";
import { ThemeContext } from "../contexts/ThemeContext";

export default function NotesScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const colors = themes[theme];
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
            <Icon name="ellipsis-vertical" size={24} color={colors.moreIcon} />
          </TouchableOpacity>
        ),
    });
  }, [editMode, selectedNotes, notes, colors.moreIcon]);

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
    const now = new Date().toISOString();
    const newNote = {
      id: Date.now().toString(),
      title: "Yeni Not",
      content: "",
      isPinned: false,
      latestChangeDate: now, // yeni alan
    };
    await saveNote(newNote);
    setNotes((prevNotes) => [...prevNotes, newNote]);
    navigation.navigate("NoteDetail", { note: newNote }); // Yeni notu direkt aç
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
      style={[
        styles.noteItem,
        {
          backgroundColor: colors.noteBg, // Çerçeve ile aynı renk
          borderColor: colors.noteBorder,
        },
        editMode && selectedNotes.includes(item.id) && {
          backgroundColor: colors.notePressed,
        },
      ]}
      onLongPress={() => handleLongPress(item.id)}
      onPress={() => {
        if (editMode) {
          handleCheckboxPress(item.id);
        } else {
          navigation.navigate("NoteDetail", { note: item });
        }
      }}
      activeOpacity={0.8}
    >
      {editMode && (
        <Icon
          name={selectedNotes.includes(item.id) ? "checkbox" : "square-outline"}
          size={24}
          color={colors.text}
          style={styles.checkbox}
        />
      )}
      {!editMode && item.isPinned && (
        <Icon name="pin" size={24} color={colors.text} style={styles.pinIcon} />
      )}
      <Text style={[styles.noteTitle, { color: colors.text }]}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        numColumns={2} // <-- 2 sütunlu grid
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.addButton }]}
        onPress={handleAddNote}
      >
        <Icon name="add" size={30} color={colors.addButtonIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  noteItem: {
    width: "48%",
    aspectRatio: 1,
    flexDirection: "row",
    alignItems: "top",
    padding: 16,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  noteTitle: { fontSize: 18, marginLeft: 8, flexShrink: 1, marginTop: 15, fontWeight: "bold"},
  checkbox: { marginRight: 8 },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  pinIcon: { marginRight: 8 },
});
