import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  BackHandler,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "../locales/TranslationProvider";
import { saveNote, loadNotes } from "../storage/NotesStorage";

export default function NoteDetailScreen({ route, navigation }) {
  const { note, noteId } = route.params || {};
  const [currentNote, setCurrentNote] = useState(note || null);
  const [originalNote, setOriginalNote] = useState(note || null);
  const [isDropboxVisible, setDropboxVisible] = useState(false);
  const dropboxAnimation = useState(
    new Animated.Value(Dimensions.get("window").height)
  )[0];

  const { t } = useTranslation();

  const ITEM_HEIGHT = 60;
  const MAX_HEIGHT = Dimensions.get("window").height * 0.25;
  const DROPBOX_HEIGHT = Math.min((ITEM_HEIGHT + 20) * 5, MAX_HEIGHT);

  const ocrTextHandled = useRef(false); // Sonsuz döngü önleme

  const toggleDropbox = () => {
    if (isDropboxVisible) {
      closeDropbox();
    } else {
      openDropbox();
    }
  };

  const openDropbox = () => {
    setDropboxVisible(true);
    const footerHeight = 120;
    const targetPosition =
      Dimensions.get("window").height - DROPBOX_HEIGHT - footerHeight;

    Animated.timing(dropboxAnimation, {
      toValue: targetPosition,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const closeDropbox = () => {
    Animated.timing(dropboxAnimation, {
      toValue: Dimensions.get("window").height,
      duration: 500,
      useNativeDriver: false,
    }).start(() => setDropboxVisible(false));
  };

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (currentNote && currentNote !== originalNote) {
        saveNote(currentNote);
        setOriginalNote(currentNote);
      }
    }, 1000);

    return () => clearInterval(saveInterval);
  }, [currentNote, originalNote]);

  useEffect(() => {
    if (route.params?.ocrText && currentNote && !ocrTextHandled.current) {
      const updatedContent = `${currentNote.content || ""}\n\nOCR EXPORT\n${
        route.params.ocrText
      }`;
      setCurrentNote((prev) => ({ ...prev, content: updatedContent }));
      ocrTextHandled.current = true; // tekrar tetiklenmesin
    }
  }, [route.params?.ocrText, currentNote]);

  useEffect(() => {
    if (!note && noteId) {
      (async () => {
        const notes = await loadNotes();
        const foundNote = notes.find((n) => n.id === noteId);
        if (foundNote) {
          setCurrentNote(foundNote);
          setOriginalNote(foundNote);
        } else {
          Alert.alert("Error", "Note not found!", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        }
      })();
    }
  }, [note, noteId]);

  if (!currentNote) {
    return (
      <View style={styles.container}>
        <Text>Loading note...</Text>
      </View>
    );
  }

  const handleTitleChange = (text) => {
    setCurrentNote((prev) => ({ ...prev, title: text }));
  };

  const handleContentChange = (text) => {
    setCurrentNote((prev) => ({ ...prev, content: text }));
  };

  const handleScanText = () => {
    navigation.navigate("CameraScreen", {
      noteId: currentNote.id,
    });
  };

  return (
    <TouchableWithoutFeedback onPress={closeDropbox}>
      <View style={styles.container}>
        <TextInput
          style={styles.titleInput}
          value={currentNote.title}
          onChangeText={handleTitleChange}
          placeholder="Başlık"
          onFocus={closeDropbox}
        />
        <TextInput
          style={styles.contentInput}
          value={currentNote.content}
          onChangeText={handleContentChange}
          placeholder="İçerik"
          multiline
          onFocus={closeDropbox}
        />

        <TouchableOpacity style={styles.aiButton} onPress={toggleDropbox}>
          <Icon name="logo-android" size={24} color="white" />
          <Text style={styles.aiButtonText}>AI</Text>
        </TouchableOpacity>

        {isDropboxVisible && (
          <Animated.View style={[styles.dropbox, { top: dropboxAnimation }]}>
            <ScrollView
              style={{ maxHeight: DROPBOX_HEIGHT }}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
                onPress={handleScanText}
              >
                <Text style={styles.dropboxButtonText}>{t("scan_text")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("convert_audio_to_note")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("read_note_aloud")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("ai_note_summary")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("ai_note_questions")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titleInput: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    textAlignVertical: "top",
  },
  aiButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#007bff",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  aiButtonText: {
    color: "white",
    fontSize: 12,
    marginLeft: 5,
  },
  dropbox: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 5,
  },
  dropboxButton: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  dropboxButtonText: {
    fontSize: 16,
    color: "#333",
  },
});
