import React, { useState, useEffect, useRef, useContext } from "react";
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
import AiQuizBox from "../components/AiQuizBox";
import getAiQuiz from "../utils/getAiQuiz";
import themes from "../themes";
import { ThemeContext } from "../contexts/ThemeContext";

export default function NoteDetailScreen({ route, navigation }) {
  const { note, noteId } = route.params || {};
  const [currentNote, setCurrentNote] = useState(note || null);
  const [originalNote, setOriginalNote] = useState(note || null);
  const [isDropboxVisible, setDropboxVisible] = useState(false);
  const dropboxAnimation = useState(
    new Animated.Value(Dimensions.get("window").height)
  )[0];

  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const colors = themes[theme];

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

  // Not başlığını navigation başlığına ayarla
  useEffect(() => {
    if (currentNote?.title) {
      navigation.setOptions({ title: currentNote.title });
    }
  }, [currentNote?.title, navigation]);

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

  const [noteContent, setNoteContent] = useState("");

  // Not açıldığında, ana içeriği ayrı state'e ata
  useEffect(() => {
    if (currentNote) {
      let content = currentNote.content || "";
      content = content.replace(/<AISUMMARY>[\s\S]*?<\/AISUMMARY>/, "");
      content = content.replace(/<AIQUIZ>[\s\S]*?<\/AIQUIZ>/, "");
      setNoteContent(content);
      // ...aiSummary ve aiQuiz ayıklama kodun burada kalabilir...
    }
  }, [currentNote]);

  // TextInput değişikliğinde sadece ana içeriği güncelle
  const handleContentChange = (text) => {
    setNoteContent(text);
    // AI özet ve quiz'i tekrar ekle
    let newContent = text;
    if (aiSummary) newContent += `\n\n<AISUMMARY>\n${aiSummary}\n</AISUMMARY>`;
    if (aiQuiz && aiQuiz.length > 0) newContent += `\n\n<AIQUIZ>\n${JSON.stringify(aiQuiz)}\n</AIQUIZ>`;
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
        max_tokens: 1000, // <-- artırıldı
        temperature: 0.7,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  // AI quiz için ayrı bir fonksiyon dosyası kullanılıyor
  // const getAiQuiz = async (text) => { ... }

  // AI özet ve quiz ayrı tutulacak
  const [aiSummary, setAiSummary] = useState("");
  const [aiQuiz, setAiQuiz] = useState([]);

  // Not açıldığında, varsa eski özet/quiz'i ayıkla
  useEffect(() => {
    if (currentNote) {
      const summaryMatch = currentNote.content.match(/<AISUMMARY>([\s\S]*?)<\/AISUMMARY>/);
      const quizMatch = currentNote.content.match(/<AIQUIZ>([\s\S]*?)<\/AIQUIZ>/);
      setAiSummary(summaryMatch ? summaryMatch[1].trim() : "");
      let quizArr = [];
      if (quizMatch) {
        try {
          quizArr = JSON.parse(quizMatch[1].trim());
        } catch (e) {
          quizArr = [];
        }
      }
      setAiQuiz(quizArr);
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
      if (aiQuiz.length > 0) newContent += `\n\n<AIQUIZ>\n${JSON.stringify(aiQuiz)}\n</AIQUIZ>`;
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
      const quizArr = await getAiQuiz(mainContent);
      setAiQuiz(quizArr);
      // Notun içeriğini güncellemek istiyorsan:
      let newContent = mainContent;
      if (aiSummary) newContent += `\n\n<AISUMMARY>\n${aiSummary}\n</AISUMMARY>`;
      newContent += `\n\n<AIQUIZ>\n${JSON.stringify(quizArr)}\n</AIQUIZ>`;
      setCurrentNote((prev) => ({ ...prev, content: newContent }));
    } catch (e) {
      Alert.alert("AI Hatası", "Quiz alınamadı.");
    }
  };

  // Klavye açıldığında menüyü kapat
  useEffect(() => {
    const keyboardListener = Keyboard.addListener("keyboardDidShow", closeDropbox);
    return () => keyboardListener.remove();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={closeDropbox}>
      <View style={styles.container}>
        <TextInput
          style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
          value={currentNote.title}
          onChangeText={handleTitleChange}
          placeholder="Başlık"
          onFocus={closeDropbox}
        />
        <ScrollView style={{ flex: 1 }}>
          <TextInput
            style={[styles.contentInput, { color: colors.text }]}
            value={noteContent}
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
              <Text style={[styles.aiBoxTitle, { color: colors.primary }]}>AI Özet</Text>
              <Text style={[styles.aiBoxContent, { color: colors.text }]}>{aiSummary}</Text>
            </View>
          ) : null}

          {/* AI Quiz kutusu */}
          {aiQuiz && aiQuiz.length > 0 && <AiQuizBox quizData={aiQuiz} />}
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
                onPress={() => {
                  handleScanText();
                  closeDropbox();
                }}
              >
                <Text style={styles.dropboxButtonText}>{t("scan_text")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
                onPress={() => {
                  // Sesli okuma fonksiyonu burada olacaksa ekle
                  closeDropbox();
                }}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("read_note_aloud")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
                onPress={() => {
                  handleAiSummary();
                  closeDropbox();
                }}
              >
                <Text style={styles.dropboxButtonText}>
                  {t("ai_note_summary")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
                onPress={() => {
                  handleAiQuiz();
                  closeDropbox();
                }}
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
