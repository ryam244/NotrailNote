import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/common';
import { colors, spacing, borderRadius, icons } from '@/theme';

export default function PromptsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={icons.size.md} color={colors.text.primary} />
        </Pressable>
        <Text variant="h4">プロンプト</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Feather name="zap" size={64} color={colors.gray[300]} />
        <Text variant="body" color="secondary" style={styles.text}>
          AIプロンプト機能は準備中です
        </Text>
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
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  text: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
});
