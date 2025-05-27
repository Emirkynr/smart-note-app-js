import React, { useEffect, useRef, useContext, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from '../locales/TranslationProvider';
import themes from "../themes";
import { ThemeContext } from "../contexts/ThemeContext";
import { loadNotes } from "../storage/NotesStorage";
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const IMAGE_WIDTH = width * 0.85;
const BANNER_HEIGHT = height * 0.2;
const ARTWORKS = [
  require('../assets/artwork1.png'),
  require('../assets/artwork2.png'),
  require('../assets/artwork3.png'),
];
const LOOP_IMAGES = [...ARTWORKS, ...ARTWORKS];
const ORIGINAL_COUNT = ARTWORKS.length;

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const colors = themes[theme];
  const scrollRef = useRef(null);
  const currentIndex = useRef(0);
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    navigation.setOptions({ title: t('homePageName') });
  }, [navigation, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    const timer = setInterval(() => {
      let next = currentIndex.current + 1;
      scrollRef.current?.scrollTo({ x: next * IMAGE_WIDTH, animated: true });
      if (next === ORIGINAL_COUNT) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: 0, animated: false });
          currentIndex.current = 0;
        }, 350);
      } else {
        currentIndex.current = next;
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotes = async () => {
        const notes = await loadNotes();
        const sorted = [...notes]
          .map(n => ({
            ...n,
            latestChangeDate: n.latestChangeDate || n.createdAt || n.date || n.updatedAt || "1970-01-01T00:00:00Z"
          }))
          .sort((a, b) => new Date(b.latestChangeDate) - new Date(a.latestChangeDate))
          .slice(0, 6);
        setRecentNotes(sorted);
      };
      fetchNotes();
    }, [])
  );

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.noteItem,
        {
          backgroundColor: colors.noteBorder, 
          borderColor: colors.noteBorder,
        },
      ]}
      onPress={() =>
        navigation.navigate("Notes", {
          screen: "NoteDetail",
          params: { note: item },
        })
      }
      activeOpacity={0.8}
    >
      <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      <View
        style={[
          styles.bannerWrapper,
          { width: IMAGE_WIDTH, height: BANNER_HEIGHT, borderColor: colors.border },
        ]}
      >  
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
        >
          {LOOP_IMAGES.map((src, idx) => (
            <Image
              key={idx}
              source={src}
              style={[styles.image, { width: IMAGE_WIDTH, height: BANNER_HEIGHT }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>

        <View style={styles.recentNotesSection}>
          <Text style={[styles.recentNotesTitle, { color: colors.text }]}>
            {t('recent_notes')}
          </Text>
          <FlatList
            data={recentNotes}
            keyExtractor={item => item.id}
            renderItem={renderNote}
            numColumns={2}
            contentContainerStyle={{ paddingBottom: 16 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            scrollEnabled={false} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerWrapper: {
    overflow: 'hidden',
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  image: { marginRight: 0 },
  content: { flex: 1, padding: 20 },
  text: { fontSize: 20 },
  recentNotesSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  recentNotesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noteItem: {
    width: "48%",
    aspectRatio: 1.5, // 3 birim en, 2 birim yükseklik
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // Ortala
    marginTop: 16, // Bir satır kadar yukarıda başlasın
  },
});