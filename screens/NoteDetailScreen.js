import React, { useState, useEffect } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // İkonlar için import
import { useTranslation } from "../locales/TranslationProvider";
import { Camera } from "expo-camera";
import axios from "axios";
import { saveNote } from "../storage/NotesStorage"; // Not kaydetme fonksiyonunu import et

export default function NoteDetailScreen({ route, navigation }) {
  const { note } = route.params;
  const [currentNote, setCurrentNote] = useState(note);
  const [originalNote, setOriginalNote] = useState(note);
  const [isDropboxVisible, setDropboxVisible] = useState(false); // Dropbox görünürlüğü
  const dropboxAnimation = useState(
    new Animated.Value(Dimensions.get("window").height)
  )[0]; // Animasyon
  const [cameraVisible, setCameraVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);

  const { t } = useTranslation();

  const ITEM_HEIGHT = 60; // Her bir öğenin yüksekliği
  const MAX_HEIGHT = Dimensions.get("window").height * 0.25; // Maksimum %35 yükseklik
  const DROPBOX_HEIGHT = Math.min((ITEM_HEIGHT + 20) * 5, MAX_HEIGHT); // Dinamik yükseklik

  const toggleDropbox = () => {
    if (isDropboxVisible) {
      closeDropbox();
    } else {
      openDropbox();
    }
  };

  const openDropbox = () => {
    setDropboxVisible(true);
    const footerHeight = 120; // Footer yüksekliği
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
    const onBackPress = () => {
      if (isDropboxVisible) {
        closeDropbox();
        return true; // Geri tuşunu engelle
      }
      return false; // Normal davranışı devam ettir
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [isDropboxVisible]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      closeDropbox
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (currentNote !== originalNote) {
        saveNote(currentNote); // Notu kaydet
        setOriginalNote(currentNote); // Kaydedilen notu güncelle
      }
    }, 100); // Her saniye çalışır

    return () => clearInterval(saveInterval); // Bileşen unmount olduğunda interval temizlenir
  }, [currentNote, originalNote]);

  const handleTitleChange = (text) => {
    setCurrentNote((prev) => ({ ...prev, title: text }));
  };

  const handleContentChange = (text) => {
    setCurrentNote((prev) => ({ ...prev, content: text }));
  };

  const handleScanText = async () => {
    setCameraVisible(true);
  };

  const handleCapture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setCameraVisible(false);

      // OCR İşlemi
      const ocrText = await processImage(photo.uri);
      if (ocrText) {
        const updatedContent = `${currentNote.content}\n\nOCR EXPORT\n${ocrText}`;
        setCurrentNote((prev) => ({ ...prev, content: updatedContent }));
      }
    }
  };

  const processImage = async (imageUri) => {
    try {
      const apiKey = "YOUR_VISION_API_KEY"; // Vision API anahtarınızı buraya ekleyin
      const base64Image = await convertImageToBase64(imageUri);

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }
      );

      const textAnnotations = response.data.responses[0].textAnnotations;
      return textAnnotations ? textAnnotations[0].description : "";
    } catch (error) {
      console.error("OCR Error:", error);
      return "";
    }
  };

  const convertImageToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <TouchableWithoutFeedback onPress={closeDropbox}>
      <View style={styles.container}>
        {cameraVisible ? (
          <Camera style={styles.camera} ref={(ref) => setCameraRef(ref)}>
            <View style={styles.cameraButtonContainer}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleCapture}
              >
                <Text style={styles.cameraButtonText}>Capture</Text>
              </TouchableOpacity>
            </View>
          </Camera>
        ) : (
          <>
            <TextInput
              style={styles.titleInput}
              value={currentNote.title}
              onChangeText={handleTitleChange}
              placeholder="Başlık"
              onFocus={closeDropbox} // Yazı alanına tıklanınca dropbox'u kapat
            />
            <TextInput
              style={styles.contentInput}
              value={currentNote.content}
              onChangeText={handleContentChange}
              placeholder="İçerik"
              multiline
              onFocus={closeDropbox} // Yazı alanına tıklanınca dropbox'u kapat
            />

            {/* AI Butonu */}
            <TouchableOpacity style={styles.aiButton} onPress={toggleDropbox}>
              <Icon name="logo-android" size={24} color="white" />
              <Text style={styles.aiButtonText}>AI</Text>
            </TouchableOpacity>

            {/* Dropbox */}
            {isDropboxVisible && (
              <Animated.View
                style={[styles.dropbox, { top: dropboxAnimation }]}
              >
                <ScrollView
                  style={{ maxHeight: DROPBOX_HEIGHT }} // ScrollView yüksekliği
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableOpacity
                    style={[styles.dropboxButton, { height: ITEM_HEIGHT }]}
                    onPress={handleScanText}
                  >
                    <Text style={styles.dropboxButtonText}>
                      {t("scan_text")}
                    </Text>
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
          </>
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
  camera: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cameraButtonContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    padding: 20,
  },
  cameraButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
  },
  cameraButtonText: {
    color: "#000",
    fontSize: 16,
  },
});
