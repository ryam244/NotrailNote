import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
import { Text, IconButton } from '@/components/common';
import { colors, spacing, borderRadius, shadows } from '@/theme';
import { useSubscriptionStore } from '@/stores';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getPlanDetails,
  type SubscriptionPlan,
} from '@/services/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  pkg?: PurchasesPackage;
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

function PlanCard({
  plan,
  pkg,
  isCurrentPlan,
  isPopular,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const details = getPlanDetails(plan);

  const getPrice = () => {
    if (pkg) {
      return pkg.product.priceString;
    }
    return details.price;
  };

  const getPeriod = () => {
    if (pkg?.packageType === 'ANNUAL') {
      return '/年';
    }
    if (pkg?.packageType === 'MONTHLY') {
      return '/月';
    }
    return plan === 'free' ? '' : '/月';
  };

  return (
    <Pressable
      style={[
        styles.planCard,
        isCurrentPlan && styles.planCardCurrent,
        isPopular && styles.planCardPopular,
      ]}
      onPress={onSelect}
      disabled={isCurrentPlan || isLoading}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text variant="micro" style={styles.popularText}>人気</Text>
        </View>
      )}

      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text variant="micro" color="secondary">現在のプラン</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text variant="h3">{details.nameJa}</Text>
        <View style={styles.priceRow}>
          <Text variant="h2" style={styles.price}>{getPrice()}</Text>
          <Text variant="caption" color="secondary">{getPeriod()}</Text>
        </View>
      </View>

      <View style={styles.featureList}>
        {details.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Feather
              name="check"
              size={16}
              color={plan === 'free' ? colors.gray[400] : colors.success}
            />
            <Text variant="body" color="secondary" style={styles.featureText}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {!isCurrentPlan && (
        <View style={[styles.selectButton, plan === 'pro' && styles.selectButtonPro]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={plan === 'pro' ? 'white' : colors.primary} />
          ) : (
            <Text
              variant="bodyBold"
              style={{ color: plan === 'pro' ? 'white' : colors.primary }}
            >
              {plan === 'free' ? 'ダウングレード' : 'アップグレード'}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function SubscriptionScreen() {
  const { currentPlan, isLoading: storeLoading } = useSubscriptionStore();
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    try {
      const currentOffering = await getOfferings();
      setOfferings(currentOffering);
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = useCallback(async (plan: SubscriptionPlan, pkg?: PurchasesPackage) => {
    if (plan === currentPlan) return;

    if (plan === 'free') {
      Alert.alert(
        'ダウングレード',
        '無料プランへのダウングレードは、現在のサブスクリプション期間終了後に自動的に適用されます。App Store / Google Playの設定からサブスクリプションをキャンセルしてください。',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!pkg) {
      Alert.alert('エラー', 'パッケージが見つかりません');
      return;
    }

    setPurchasingPlan(plan);

    const result = await purchasePackage(pkg);

    setPurchasingPlan(null);

    if (result.success) {
      Alert.alert(
        'アップグレード完了',
        `${getPlanDetails(plan).nameJa}にアップグレードしました！`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else if (result.error) {
      Alert.alert('エラー', result.error);
    }
  }, [currentPlan]);

  const handleRestore = useCallback(async () => {
    setIsLoading(true);

    const result = await restorePurchases();

    setIsLoading(false);

    if (result.success) {
      Alert.alert('復元完了', '購入が復元されました');
    } else if (result.error) {
      Alert.alert('復元失敗', result.error);
    }
  }, []);

  // Get packages from offerings
  const basicMonthlyPkg = offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_monthly' || p.product.identifier.includes('basic')
  );
  const proMonthlyPkg = offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_annual' || p.product.identifier.includes('pro')
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton name="arrow-left" variant="ghost" onPress={() => router.back()} />
        <Text variant="h4">プランを選択</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={{ marginTop: spacing[4] }}>
            プランを読み込み中...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Free Plan */}
          <PlanCard
            plan="free"
            isCurrentPlan={currentPlan === 'free'}
            onSelect={() => handleSelectPlan('free')}
            isLoading={purchasingPlan === 'free'}
          />

          {/* Basic Plan */}
          <PlanCard
            plan="basic"
            pkg={basicMonthlyPkg}
            isCurrentPlan={currentPlan === 'basic'}
            onSelect={() => handleSelectPlan('basic', basicMonthlyPkg)}
            isLoading={purchasingPlan === 'basic'}
          />

          {/* Pro Plan */}
          <PlanCard
            plan="pro"
            pkg={proMonthlyPkg}
            isCurrentPlan={currentPlan === 'pro'}
            isPopular
            onSelect={() => handleSelectPlan('pro', proMonthlyPkg)}
            isLoading={purchasingPlan === 'pro'}
          />

          {/* Restore purchases */}
          <Pressable style={styles.restoreButton} onPress={handleRestore}>
            <Text variant="body" color="brand">購入を復元</Text>
          </Pressable>

          {/* Terms */}
          <Text variant="micro" color="muted" style={styles.terms}>
            サブスクリプションはApple ID / Googleアカウントに請求されます。
            サブスクリプションは、現在の期間終了の24時間前までにキャンセルしない限り、自動的に更新されます。
            購入確認時にApple ID / Googleアカウントに請求されます。
          </Text>
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    gap: spacing[4],
  },
  planCard: {
    backgroundColor: colors.surface.light,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  planCardCurrent: {
    borderColor: colors.success,
  },
  planCardPopular: {
    borderColor: colors.primary,
    ...shadows.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: spacing[4],
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  popularText: {
    color: 'white',
    fontWeight: '700',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  planHeader: {
    marginBottom: spacing[4],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing[1],
  },
  price: {
    color: colors.text.primary,
  },
  featureList: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  featureText: {
    flex: 1,
  },
  selectButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  selectButtonPro: {
    backgroundColor: colors.primary,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  terms: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },
});
