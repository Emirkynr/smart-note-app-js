import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Button, Image, View, Text, Alert } from "react-native";
import { OCR_API_KEY } from "@env"; // .env'den anahtarı çek

export default function CameraScreen({ route, navigation }) {
  const { noteId } = route.params; // Note ID'yi al
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Kamera izni gerekli!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
    });

    console.log("Camera result:", result); // Sonucu kontrol edin

    if (!result.canceled && result.assets && result.assets[0]?.base64) {
      setImage(result.assets[0].uri);
      sendToOCR(result.assets[0].base64);
    } else {
      Alert.alert(
        "Error",
        "Fotoğraf çekme işlemi iptal edildi veya başarısız oldu."
      );
    }
  };

  const sendToOCR = async (base64) => {
    if (!base64) {
      console.error("Base64 value is undefined");
      Alert.alert("Error", "Fotoğraf verisi işlenemedi.");
      return;
    }

    const body = {
      requests: [
        {
          image: { content: base64 },
          features: [{ type: "TEXT_DETECTION" }],
        },
      ],
    };

    try {
      const res = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${OCR_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const json = await res.json();
      console.log("OCR Response:", json); // OCR yanıtını kontrol edin

      const detectedText =
        json.responses[0]?.fullTextAnnotation?.text || "Yazı bulunamadı";

      setText(detectedText);

      // OCR sonucunu NoteDetailScreen'e gönder
      navigation.navigate("NoteDetail", {
        noteId,
        ocrText: detectedText,
      });
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert("OCR Error", "An error occurred while processing the image.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Fotoğraf Çek" onPress={pickImage} />
      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 200, height: 200, marginTop: 20 }}
        />
      )}
      <Text style={{ marginTop: 20 }}>{text}</Text>
    </View>
  );
}
