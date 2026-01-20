// ドキュメント
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number; // Unix timestamp
  updatedAt: number;
  githubSync?: {
    enabled: boolean;
    repoPath: string;
    branch: string;
    lastCommitSha?: string;
    syncStatus: 'synced' | 'pending' | 'error';
  };
}

// バージョン履歴
export interface Version {
  id: string;
  documentId: string;
  content: string;
  createdAt: number;
  source: 'local' | 'github';
  label?: string;
  autoSaved: boolean;
  commitSha?: string;
  commitMessage?: string;
  author?: string;
}

// 差分情報
export interface Diff {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

// プロンプトテンプレート
export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  model: string;
  lastUsedAt?: number;
  createdAt: number;
}

// ユーザープラン
export type UserPlan = 'free' | 'basic' | 'pro';

// ユーザー設定
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  focusMode: boolean;
  github?: {
    enabled: boolean;
    defaultRepo?: string;
    defaultBranch?: string;
  };
}

// ユーザー情報
export interface User {
  id: string;
  email?: string;
  plan: UserPlan;
  github?: {
    accessToken: string;
    refreshToken?: string;
    username: string;
    avatarUrl?: string;
    expiresAt?: number;
  };
}

// プラン別の制限
export const PLAN_LIMITS = {
  free: {
    price: 0,
    historyRetentionDays: 30,
    maxDocuments: 10,
    maxPromptsTemplates: 5,
    manualSnapshot: false,
    autoSaveIntervalSec: 30,
  },
  basic: {
    price: 500,
    historyRetentionDays: 365,
    maxDocuments: -1,
    maxPromptsTemplates: -1,
    manualSnapshot: true,
    autoSaveIntervalSec: 10,
  },
  pro: {
    price: -1,
    historyRetentionDays: -1,
    maxDocuments: -1,
    maxPromptsTemplates: -1,
    manualSnapshot: true,
    autoSaveIntervalSec: 3,
  },
} as const;
