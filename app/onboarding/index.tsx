import { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/common';
import { colors, spacing, borderRadius } from '@/theme';
import { useSettingsStore } from '@/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

// N Logo SVG Component
function NLogo({ size = 48, color = 'white' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M70 25V75"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Path
        d="M70 25L30 75V25"
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Slide 1: AI Assistance
function Slide1Illustration() {
  return (
    <View style={illustrationStyles.container}>
      <View style={illustrationStyles.gradientBg}>
        <View style={illustrationStyles.sparkleIcon}>
          <Feather name="zap" size={80} color={`${colors.primary}40`} />
        </View>
        <View style={illustrationStyles.card}>
          <View style={illustrationStyles.cardLines}>
            <View style={[illustrationStyles.line, { width: 100 }]} />
            <View style={[illustrationStyles.line, { width: 80 }]} />
            <View style={[illustrationStyles.line, { width: 120, backgroundColor: `${colors.primary}60` }]} />
          </View>
        </View>
        <View style={illustrationStyles.floatingIconTopRight}>
          <Feather name="edit-3" size={24} color={colors.primary} />
        </View>
        <View style={illustrationStyles.floatingIconBottomLeft}>
          <Feather name="sun" size={24} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}

// Slide 2: GitHub Sync
function Slide2Illustration() {
  return (
    <View style={illustrationStyles.container}>
      <View style={[illustrationStyles.gradientBg, illustrationStyles.circleBg]}>
        <View style={illustrationStyles.syncContainer}>
          <View style={illustrationStyles.cloudDecor1} />
          <View style={illustrationStyles.cloudDecor2} />
          <View style={illustrationStyles.cloudIcon}>
            <Feather name="upload-cloud" size={48} color={colors.primary} />
          </View>
          <View style={illustrationStyles.syncRow}>
            <View style={illustrationStyles.docIcon}>
              <Feather name="file-text" size={28} color={colors.gray[500]} />
            </View>
            <Feather name="arrow-right" size={20} color={`${colors.primary}60`} />
            <View style={illustrationStyles.githubIcon}>
              <Feather name="github" size={28} color="white" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// Slide 3: Get Started
function Slide3Illustration() {
  return (
    <View style={illustrationStyles.container}>
      <View style={[illustrationStyles.gradientBg, illustrationStyles.imageBg]}>
        <View style={illustrationStyles.logoContainer}>
          <NLogo size={64} color="white" />
        </View>
        <View style={illustrationStyles.featuresRow}>
          <View style={illustrationStyles.featureBadge}>
            <Feather name="zap" size={16} color={colors.primary} />
            <Text variant="micro" color="muted">AI搭載</Text>
          </View>
          <View style={illustrationStyles.featureBadge}>
            <Feather name="github" size={16} color={colors.text.primary} />
            <Text variant="micro" color="muted">GitHub連携</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: <Slide1Illustration />,
    title: 'AIでアイデアを加速',
    description: '生成AIの出力を整理し、あなたのアイデアを次のレベルへ進化させます。',
  },
  {
    id: '2',
    icon: <Slide2Illustration />,
    title: 'GitHubで安全に管理',
    description: '自前サーバーを持たず、あなたのGitHubに直接保存。バージョン管理も万全です。',
  },
  {
    id: '3',
    icon: <Slide3Illustration />,
    title: 'さあ、始めましょう',
    description: 'GitHubアカウントでログインして、新しいノートを作成しましょう。',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { settings } = useSettingsStore();

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(tabs)');
  }, []);

  const handleNext = useCallback(async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Last slide - go to GitHub login or home
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      if (settings.github?.accessToken) {
        router.replace('/(tabs)');
      } else {
        router.push('/auth/github');
      }
    }
  }, [currentIndex, settings.github?.accessToken]);

  const handleGitHubLogin = useCallback(async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/auth/github');
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const renderSlide = useCallback(({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationContainer}>
        {item.icon}
      </View>
      <View style={styles.textContainer}>
        <Text variant="h2" style={styles.title}>{item.title}</Text>
        <Text variant="body" color="secondary" style={styles.description}>
          {item.description}
        </Text>
      </View>
    </View>
  ), []);

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        {!isLastSlide && (
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text variant="bodyBold" color="secondary">スキップ</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Page Indicators */}
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        {isLastSlide ? (
          <Pressable style={styles.githubButton} onPress={handleGitHubLogin}>
            <Feather name="github" size={24} color="white" />
            <Text variant="bodyBold" style={styles.githubButtonText}>
              GitHubでログイン
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text variant="bodyBold" style={styles.nextButtonText}>次へ</Text>
          </Pressable>
        )}

        {/* Page counter */}
        <Text variant="micro" color="muted" style={styles.pageCounter}>
          {currentIndex + 1} / {slides.length}
        </Text>

        {isLastSlide && (
          <Text variant="micro" color="muted" style={styles.terms}>
            続行することで、NotrailNoteの利用規約とプライバシーポリシーに同意したものとみなされます。
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  headerSpacer: {
    width: 60,
  },
  skipButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  illustrationContainer: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    marginBottom: spacing[8],
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    alignItems: 'center',
    gap: spacing[6],
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray[200],
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
  },
  githubButton: {
    width: '100%',
    backgroundColor: '#24292e',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  githubButtonText: {
    color: 'white',
    fontSize: 18,
  },
  pageCounter: {
    marginTop: -spacing[2],
  },
  terms: {
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    lineHeight: 18,
  },
});

const illustrationStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  gradientBg: {
    width: '100%',
    height: '100%',
    backgroundColor: `${colors.primary}08`,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleBg: {
    borderRadius: 9999,
  },
  imageBg: {
    backgroundColor: colors.primary,
  },
  sparkleIcon: {
    position: 'absolute',
  },
  card: {
    backgroundColor: 'white',
    padding: spacing[6],
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}10`,
  },
  cardLines: {
    gap: spacing[2],
  },
  line: {
    height: 8,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 4,
  },
  floatingIconTopRight: {
    position: 'absolute',
    top: 40,
    right: 40,
  },
  floatingIconBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: 40,
  },
  syncContainer: {
    alignItems: 'center',
    gap: spacing[4],
  },
  cloudDecor1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 80,
    height: 80,
    backgroundColor: `${colors.primary}20`,
    borderRadius: 40,
  },
  cloudDecor2: {
    position: 'absolute',
    bottom: -40,
    left: -30,
    width: 100,
    height: 100,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 50,
  },
  cloudIcon: {
    backgroundColor: 'white',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  docIcon: {
    backgroundColor: 'white',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  githubIcon: {
    backgroundColor: '#24292f',
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    backgroundColor: `rgba(255,255,255,0.2)`,
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing[3],
    position: 'absolute',
    bottom: 40,
  },
  featureBadge: {
    backgroundColor: 'white',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
});
