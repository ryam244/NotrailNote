import { Alert } from 'react-native';

export type ErrorSeverity = 'info' | 'warning' | 'error';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  originalError?: Error;
}

// Error codes
export const ErrorCodes = {
  // Database errors
  DB_INIT_FAILED: 'DB_INIT_FAILED',
  DB_READ_FAILED: 'DB_READ_FAILED',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',

  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // GitHub errors
  GITHUB_AUTH_FAILED: 'GITHUB_AUTH_FAILED',
  GITHUB_SYNC_FAILED: 'GITHUB_SYNC_FAILED',
  GITHUB_RATE_LIMIT: 'GITHUB_RATE_LIMIT',

  // Document errors
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  DOCUMENT_LIMIT_REACHED: 'DOCUMENT_LIMIT_REACHED',

  // General errors
  UNKNOWN: 'UNKNOWN',
} as const;

// Error messages (Japanese)
const errorMessages: Record<string, { title: string; message: string }> = {
  [ErrorCodes.DB_INIT_FAILED]: {
    title: 'データベースエラー',
    message: 'データベースの初期化に失敗しました。アプリを再起動してください。',
  },
  [ErrorCodes.DB_READ_FAILED]: {
    title: '読み込みエラー',
    message: 'データの読み込みに失敗しました。',
  },
  [ErrorCodes.DB_WRITE_FAILED]: {
    title: '保存エラー',
    message: 'データの保存に失敗しました。',
  },
  [ErrorCodes.NETWORK_OFFLINE]: {
    title: 'オフライン',
    message: 'インターネット接続がありません。',
  },
  [ErrorCodes.NETWORK_TIMEOUT]: {
    title: 'タイムアウト',
    message: 'サーバーからの応答がありません。後でもう一度お試しください。',
  },
  [ErrorCodes.NETWORK_ERROR]: {
    title: 'ネットワークエラー',
    message: '通信エラーが発生しました。',
  },
  [ErrorCodes.GITHUB_AUTH_FAILED]: {
    title: '認証エラー',
    message: 'GitHubの認証に失敗しました。再度ログインしてください。',
  },
  [ErrorCodes.GITHUB_SYNC_FAILED]: {
    title: '同期エラー',
    message: 'GitHubとの同期に失敗しました。',
  },
  [ErrorCodes.GITHUB_RATE_LIMIT]: {
    title: 'API制限',
    message: 'GitHubのAPI制限に達しました。しばらく待ってから再試行してください。',
  },
  [ErrorCodes.DOCUMENT_NOT_FOUND]: {
    title: 'ドキュメントが見つかりません',
    message: '指定されたドキュメントは存在しないか、削除されています。',
  },
  [ErrorCodes.DOCUMENT_LIMIT_REACHED]: {
    title: '上限に達しました',
    message: 'ドキュメント数の上限に達しています。プランをアップグレードしてください。',
  },
  [ErrorCodes.UNKNOWN]: {
    title: 'エラー',
    message: '予期しないエラーが発生しました。',
  },
};

// Create app error from error code
export function createError(
  code: keyof typeof ErrorCodes,
  originalError?: Error,
  severity: ErrorSeverity = 'error'
): AppError {
  return {
    code,
    message: errorMessages[code]?.message || errorMessages[ErrorCodes.UNKNOWN].message,
    severity,
    originalError,
  };
}

// Show error alert
export function showError(error: AppError | string, options?: { showRetry?: boolean; onRetry?: () => void }): void {
  const { showRetry = false, onRetry } = options || {};

  let title: string;
  let message: string;

  if (typeof error === 'string') {
    title = 'エラー';
    message = error;
  } else {
    const errorInfo = errorMessages[error.code] || errorMessages[ErrorCodes.UNKNOWN];
    title = errorInfo.title;
    message = error.message || errorInfo.message;
  }

  const buttons: Array<{ text: string; style?: 'cancel' | 'default' | 'destructive'; onPress?: () => void }> = [
    { text: 'OK', style: 'default' },
  ];

  if (showRetry && onRetry) {
    buttons.unshift({ text: '再試行', onPress: onRetry });
  }

  Alert.alert(title, message, buttons);
}

// Show success message
export function showSuccess(title: string, message?: string): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

// Show confirmation dialog
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
): void {
  const { confirmText = '確認', cancelText = 'キャンセル', destructive = false } = options || {};

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

// Log error for debugging
export function logError(error: AppError | Error, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} Error:`, error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } else {
    console.error(`${timestamp} ${contextStr} AppError:`, error.code, error.message);
    if (error.originalError) {
      console.error('Original:', error.originalError);
    }
  }
}

// Handle async errors with retry capability
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; delay?: number; onError?: (error: Error, attempt: number) => void }
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onError } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onError?.(lastError, attempt);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}
