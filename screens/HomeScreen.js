import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image } from 'react-native';
import { useTranslation } from '../locales/TranslationProvider';
import themes from "../themes";
import { ThemeContext } from "../contexts/ThemeContext";

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
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.text }]}>
          {t('hello')}
        </Text>
      </View>
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
});