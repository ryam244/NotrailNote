/**
 * Subscription Service using RevenueCat
 *
 * Setup required:
 * 1. Create RevenueCat account at https://www.revenuecat.com/
 * 2. Create app in RevenueCat dashboard
 * 3. Configure products in App Store Connect / Google Play Console
 * 4. Link products in RevenueCat
 * 5. Replace API keys below
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_API_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_API_KEY';

// Product identifiers - must match RevenueCat dashboard
export const ENTITLEMENT_ID = 'pro';
export const PRODUCT_IDS = {
  BASIC_MONTHLY: 'notrailnote_basic_monthly',
  BASIC_YEARLY: 'notrailnote_basic_yearly',
  PRO_MONTHLY: 'notrailnote_pro_monthly',
  PRO_YEARLY: 'notrailnote_pro_yearly',
};

export type SubscriptionPlan = 'free' | 'basic' | 'pro';

export interface SubscriptionState {
  isInitialized: boolean;
  isPro: boolean;
  isBasic: boolean;
  currentPlan: SubscriptionPlan;
  expirationDate: string | null;
  customerInfo: CustomerInfo | null;
}

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Call this on app startup
 */
export async function initializeSubscriptions(userId?: string): Promise<void> {
  if (isInitialized) {
    console.log('[Subscription] Already initialized');
    return;
  }

  try {
    // Set log level for debugging (remove in production)
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    await Purchases.configure({ apiKey });

    // Optionally identify user (for cross-platform syncing)
    if (userId) {
      await Purchases.logIn(userId);
    }

    isInitialized = true;
    console.log('[Subscription] Initialized successfully');
  } catch (error) {
    console.error('[Subscription] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get current subscription state
 */
export async function getSubscriptionState(): Promise<SubscriptionState> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.error('[Subscription] Failed to get state:', error);
    return {
      isInitialized,
      isPro: false,
      isBasic: false,
      currentPlan: 'free',
      expirationDate: null,
      customerInfo: null,
    };
  }
}

/**
 * Parse CustomerInfo to determine subscription state
 */
function parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionState {
  const entitlements = customerInfo.entitlements.active;

  const isPro = !!entitlements['pro'];
  const isBasic = !!entitlements['basic'];

  let currentPlan: SubscriptionPlan = 'free';
  let expirationDate: string | null = null;

  if (isPro) {
    currentPlan = 'pro';
    expirationDate = entitlements['pro']?.expirationDate ?? null;
  } else if (isBasic) {
    currentPlan = 'basic';
    expirationDate = entitlements['basic']?.expirationDate ?? null;
  }

  return {
    isInitialized: true,
    isPro,
    isBasic,
    currentPlan,
    expirationDate,
    customerInfo,
  };
}

/**
 * Get available subscription offerings
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current) {
      console.log('[Subscription] Current offering:', offerings.current.identifier);
      return offerings.current;
    }

    console.log('[Subscription] No current offering available');
    return null;
  } catch (error) {
    console.error('[Subscription] Failed to get offerings:', error);
    return null;
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    console.log('[Subscription] Purchasing:', pkg.identifier);

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    const state = parseCustomerInfo(customerInfo);

    if (state.currentPlan !== 'free') {
      console.log('[Subscription] Purchase successful:', state.currentPlan);
      return { success: true, customerInfo };
    }

    return { success: false, error: '購入処理が完了しませんでした' };
  } catch (error: any) {
    console.error('[Subscription] Purchase failed:', error);

    // Handle specific error cases
    if (error.userCancelled) {
      return { success: false, error: 'キャンセルされました' };
    }

    if (error.code === 'STORE_PROBLEM') {
      return { success: false, error: 'ストアに接続できません。後でお試しください。' };
    }

    return {
      success: false,
      error: error.message || '購入に失敗しました。後でお試しください。'
    };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    console.log('[Subscription] Restoring purchases...');

    const customerInfo = await Purchases.restorePurchases();
    const state = parseCustomerInfo(customerInfo);

    if (state.currentPlan !== 'free') {
      console.log('[Subscription] Restored:', state.currentPlan);
      return { success: true, customerInfo };
    }

    return { success: false, error: '復元可能な購入が見つかりませんでした' };
  } catch (error: any) {
    console.error('[Subscription] Restore failed:', error);
    return {
      success: false,
      error: error.message || '復元に失敗しました'
    };
  }
}

/**
 * Add listener for subscription changes
 */
export function addSubscriptionListener(
  callback: (customerInfo: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(callback);
  // Return a no-op function since the listener doesn't need manual removal
  // The SDK handles cleanup automatically
  return () => {};
}

/**
 * Identify user (for cross-platform sync)
 */
export async function identifyUser(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
    console.log('[Subscription] User identified:', userId);
  } catch (error) {
    console.error('[Subscription] Failed to identify user:', error);
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    await Purchases.logOut();
    console.log('[Subscription] User logged out');
  } catch (error) {
    console.error('[Subscription] Failed to logout:', error);
  }
}

/**
 * Get plan details for display
 */
export function getPlanDetails(plan: SubscriptionPlan) {
  const plans = {
    free: {
      name: 'Free',
      nameJa: '無料プラン',
      price: '¥0',
      features: [
        'ドキュメント10件まで',
        '履歴保存7日間',
        '自動保存60秒ごと',
      ],
    },
    basic: {
      name: 'Basic',
      nameJa: 'ベーシック',
      price: '¥480/月',
      features: [
        'ドキュメント100件まで',
        '履歴保存30日間',
        '自動保存30秒ごと',
        '手動スナップショット',
      ],
    },
    pro: {
      name: 'Pro',
      nameJa: 'プロ',
      price: '¥980/月',
      features: [
        'ドキュメント無制限',
        '履歴保存無制限',
        '自動保存10秒ごと',
        '手動スナップショット',
        '優先サポート',
      ],
    },
  };

  return plans[plan];
}
