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
import { OPENAI_API_KEY, OCR_API_KEY } from "@env";

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
    // AI özet ve quiz'i tekrar ekle
    let newContent = text.trim();
    if (aiSummary) newContent += `\n\n<AISUMMARY>\n${aiSummary}\n</AISUMMARY>`;
    if (aiQuiz) newContent += `\n\n<AIQUIZ>\n${aiQuiz}\n</AIQUIZ>`;
    setCurrentNote((prev) => ({ ...prev, content: newContent }));
  };

  const handleScanText = () => {
    navigation.navigate("CameraScreen", {
      noteId: currentNote.id,
    });
  };

  async function getAiSummary(text) {
    const prompt = `Aşağıdaki notu kısa ve öz bir şekilde özetle:\n\n${text}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  async function getAiQuiz(text) {
    const prompt = `Aşağıdaki notun içeriğine göre 3 adet kısa bilgi yarışması (quiz) sorusu ve cevapları üret:\n\n${text}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  // AI özet ve quiz ayrı tutulacak
  const [aiSummary, setAiSummary] = useState("");
  const [aiQuiz, setAiQuiz] = useState("");

  // Not açıldığında, varsa eski özet/quiz'i ayıkla
  useEffect(() => {
    if (currentNote) {
      // AI özet ve quiz'i not içeriğinden ayıkla
      const summaryMatch = currentNote.content.match(/<AISUMMARY>([\s\S]*?)<\/AISUMMARY>/);
      const quizMatch = currentNote.content.match(/<AIQUIZ>([\s\S]*?)<\/AIQUIZ>/);
      setAiSummary(summaryMatch ? summaryMatch[1].trim() : "");
      setAiQuiz(quizMatch ? quizMatch[1].trim() : "");
    }
  }, [currentNote]);

  // Notun ana içeriğini, AI özet ve quiz olmadan al
  const getMainContent = () => {
    let content = currentNote?.content || "";
    content = content.replace(/<AISUMMARY>[\s\S]*?<\/AISUMMARY>/, "");
    content = content.replace(/<AIQUIZ>[\s\S]*?<\/AIQUIZ>/, "");
    return content.trim();
  };

  // AI özet fonksiyonu
  const handleAiSummary = async () => {
    const mainContent = getMainContent();
    if (!mainContent) return;
    try {
      const summary = await getAiSummary(mainContent);
      setAiSummary(summary);
      // Notun içeriğini güncelle (özet ve quiz'i güncel şekilde ekle)
      let newContent = mainContent;
      if (aiQuiz) newContent += `\n\n<AIQUIZ>\n${aiQuiz}\n</AIQUIZ>`;
      newContent += `\n\n<AISUMMARY>\n${summary}\n</AISUMMARY>`;
      setCurrentNote((prev) => ({ ...prev, content: newContent }));
    } catch (e) {
      Alert.alert("AI Hatası", "Özet alınamadı.");
    }
  };

  // AI quiz fonksiyonu
  const handleAiQuiz = async () => {
    const mainContent = getMainContent();
    if (!mainContent) return;
    try {
      const quiz = await getAiQuiz(mainContent);
      setAiQuiz(quiz);
      // Notun içeriğini güncelle (özet ve quiz'i güncel şekilde ekle)
      let newContent = mainContent;
      if (aiSummary) newContent += `\n\n<AISUMMARY>\n${aiSummary}\n</AISUMMARY>`;
      newContent += `\n\n<AIQUIZ>\n${quiz}\n</AIQUIZ>`;
      setCurrentNote((prev) => ({ ...prev, content: newContent }));
    } catch (e) {
      Alert.alert("AI Hatası", "Quiz alınamadı.");
    }
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
        <ScrollView style={{ flex: 1 }}>
          <TextInput
            style={styles.contentInput}
            value={getMainContent()}
            onChangeText={handleContentChange}
            placeholder="İçerik"
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            onFocus={closeDropbox}
          />

          {/* AI Özet kutusu */}
          {aiSummary ? (
            <View style={styles.aiBox}>
              <Text style={styles.aiBoxTitle}>AI Özet</Text>
              <Text style={styles.aiBoxContent}>{aiSummary}</Text>
            </View>
          ) : null}

          {/* AI Quiz kutusu */}
          {aiQuiz ? (
            <View style={styles.aiBox}>
              <Text style={styles.aiBoxTitle}>AI Quiz</Text>
              <Text style={styles.aiBoxContent}>{aiQuiz}</Text>
            </View>
          ) : null}
        </ScrollView>

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
                onPress={handleAiSummary}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("ai_note_summary")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
                onPress={handleAiQuiz}
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
    fontSize: 18,
    textAlignVertical: "top",
    minHeight: 120,
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
  aiBox: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#90caf9",
  },
  aiBoxTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1976d2",
    marginBottom: 6,
  },
  aiBoxContent: {
    fontSize: 15,
    color: "#333",
  },
});
