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

  const ocrTextHandled = useRef(false); 
  const scrollRef = useRef(null);

  const [contentChanged, setContentChanged] = useState(false);

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
    }, 50);

    return () => clearInterval(saveInterval);
  }, [currentNote, originalNote]);

  useEffect(() => {
    if (route.params?.ocrText && currentNote && !ocrTextHandled.current) {
      const updatedContent = `${currentNote.content || ""}\n\nOCR EXPORT\n${
        route.params.ocrText
      }`;
      setCurrentNote((prev) => ({ ...prev, content: updatedContent }));
      ocrTextHandled.current = true;
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

  useEffect(() => {
    navigation.setOptions({
      title: currentNote?.title || "",
      headerLeft: navigation.canGoBack()
        ? undefined
        : () => (
            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
              <Icon name="arrow-back" size={24} color={colors.text} style={{ marginLeft: 16 }} />
            </TouchableOpacity>
          ),
    });
  }, [currentNote?.title, navigation, colors.text]);

  if (!currentNote) {
    return (
      <View style={styles.container}>
        <Text>Loading note...</Text>
      </View>
    );
  }

  const handleContentChange = (text) => {
    setNoteContent(text);
    setCurrentNote((prev) => ({
      ...prev,
      content: text,
      latestChangeDate: new Date().toISOString(),
    }));
    setContentChanged(true);
  };

  const handleTitleChange = (text) => {
    setCurrentNote((prev) => ({
      ...prev,
      title: text,
      latestChangeDate: new Date().toISOString(), // güncelle
    }));
  };

  const [noteContent, setNoteContent] = useState("");
  const [inputHeight, setInputHeight] = useState(120);

  // Not açıldığında, ana içeriği ayrı state'e ata
  useEffect(() => {
    if (currentNote) {
      let content = currentNote.content || "";
      content = content.replace(/<AISUMMARY>[\s\S]*?<\/AISUMMARY>/, "");
      content = content.replace(/<AIQUIZ>[\s\S]*?<\/AIQUIZ>/, "");
      setNoteContent(content);
    }
  }, [currentNote]);

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


  const [aiSummary, setAiSummary] = useState("");
  const [aiQuiz, setAiQuiz] = useState([]);

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
  }, [currentNote?.id]);

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
      // Notun içeriği güncelle
      let newContent = mainContent;
      if (aiQuiz.length > 0) newContent += `\n\n<AIQUIZ>\n${JSON.stringify(aiQuiz)}\n</AIQUIZ>`;
      newContent += `\n\n<AISUMMARY>\n${summary}\n</AISUMMARY>`;
      setCurrentNote((prev) => ({ ...prev, content: newContent }));
      setContentChanged(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (e) {
      Alert.alert("AI Hatası", "Özet alınamadı.");
    }
  };

  const handleAiQuiz = async () => {
    const mainContent = getMainContent();
    if (!mainContent) return;
    try {
      const quizArr = await getAiQuiz(mainContent);
      setAiQuiz(quizArr);
      let newContent = mainContent;
      if (aiSummary) newContent += `\n\n<AISUMMARY>\n${aiSummary}\n</AISUMMARY>`;
      newContent += `\n\n<AIQUIZ>\n${JSON.stringify(quizArr)}\n</AIQUIZ>`;
      setCurrentNote((prev) => ({ ...prev, content: newContent }));
      setContentChanged(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
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
        <ScrollView style={{ flex: 1 }} ref={scrollRef}>
          <TextInput
            style={[
              styles.contentInput,
              { color: colors.text, height: inputHeight }
            ]}
            value={noteContent}
            onChangeText={handleContentChange}
            placeholder="İçerik"
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            onFocus={closeDropbox}
            onContentSizeChange={e =>
              setInputHeight(Math.max(120, e.nativeEvent.contentSize.height))
            }
          />

          {aiSummary ? (
            <View style={[
              styles.aiBox,
              {
                backgroundColor: colors.aiBoxBg,
                borderColor: colors.aiBoxBorder,
              }
            ]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[styles.aiBoxTitle, { color: colors.aiBoxTitle }]}>AI Özet</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={contentChanged ? handleAiSummary : undefined}
                    disabled={!contentChanged}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name="refresh"
                      size={18}
                      color={contentChanged ? "#e57373" : "#bbb"}
                      style={{ marginRight: 8, opacity: contentChanged ? 1 : 0.5 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAiSummary("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={18} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView
                style={{ maxHeight: 180 }}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                pointerEvents="auto"
              >
                <View>
                  <Text style={[styles.aiBoxContent, { color: colors.aiBoxContent }]}>
                    {aiSummary}
                  </Text>
                </View>
              </ScrollView>
            </View>
          ) : null}

          {aiQuiz && aiQuiz.length > 0 && (
            <View style={[
              styles.aiBox,
              {
                backgroundColor: colors.aiBoxBg,
                borderColor: colors.aiBoxBorder,
              }
            ]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[styles.aiBoxTitle, { color: colors.aiBoxTitle }]}>AI Quiz</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={contentChanged ? handleAiQuiz : undefined}
                    disabled={!contentChanged}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name="refresh"
                      size={18}
                      color={contentChanged ? "#e57373" : "#bbb"}
                      style={{ marginRight: 8, opacity: contentChanged ? 1 : 0.5 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAiQuiz([])}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={18} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>
              <AiQuizBox quizData={aiQuiz} />
            </View>
          )}
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
