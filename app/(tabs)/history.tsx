import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text, Card } from '@/components/common';
import { colors, spacing, borderRadius } from '@/theme';

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="h3">編集履歴</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="micro" color="muted" style={styles.sectionLabel}>
          今日
        </Text>

        <Card style={styles.historyCard}>
          <View style={styles.timeline}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.line} />
          </View>
          <View style={styles.historyContent}>
            <Text variant="bodyBold">プロジェクト目標の更新</Text>
            <Text variant="caption" color="secondary">プロジェクトα ロードマップ</Text>
            <Text variant="micro" color="muted" style={styles.time}>2時間前</Text>
          </View>
        </Card>

        <Card style={styles.historyCard}>
          <View style={styles.timeline}>
            <View style={styles.dot} />
            <View style={styles.line} />
          </View>
          <View style={styles.historyContent}>
            <Text variant="bodyBold">ターゲット層の絞り込み</Text>
            <Text variant="caption" color="secondary">マーケティング戦略</Text>
            <Text variant="micro" color="muted" style={styles.time}>5時間前</Text>
          </View>
        </Card>

        <Text variant="micro" color="muted" style={[styles.sectionLabel, styles.sectionTop]}>
          昨日
        </Text>

        <Card style={styles.historyCard}>
          <View style={styles.timeline}>
            <View style={styles.dot} />
          </View>
          <View style={styles.historyContent}>
            <Text variant="bodyBold">初期ドラフト作成</Text>
            <Text variant="caption" color="secondary">週刊ニュースレター</Text>
            <Text variant="micro" color="muted" style={styles.time}>昨日 14:30</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  sectionLabel: {
    marginBottom: spacing[3],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTop: {
    marginTop: spacing[4],
  },
  historyCard: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  timeline: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
    marginTop: spacing[1],
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[200],
    marginTop: spacing[1],
  },
  historyContent: {
    flex: 1,
    paddingRight: spacing[2],
  },
  time: {
    marginTop: spacing[1],
  },
});
