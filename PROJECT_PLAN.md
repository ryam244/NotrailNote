# PROJECT_PLAN.md - NotrailNote

## 1. Project Concept

**NotrailNote** は、AI生成コンテンツやアイデアを管理するためのiOSアプリです。
GitHubをバージョン管理バックエンドとして活用し、Markdownベースの編集体験を提供します。

### Core Value Propositions
- **Gitネイティブなバージョン管理**: 専門知識不要で差分履歴を追跡
- **ローカルファースト**: オフラインでも編集可能、オンライン時にGitHub同期
- **AI活用促進**: 音声テキスト化、プロンプト管理機能

---

## 2. Current Status

**Phase**: Pre-Development (設計フェーズ)
**Last Updated**: 2026-01-20

---

## 3. Tech Specification

### 3.1. 技術スタック

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React Native (Expo) | SDK 52 |
| Language | TypeScript | strict mode |
| Routing | Expo Router | ^3.5.0 |
| State Management | Zustand | ^4.5.0 |
| Server State | React Query | ^5.x |
| Local Storage | AsyncStorage / expo-sqlite | - |
| Authentication | Firebase Auth | - |
| API Proxy | AWS Lambda / Cloud Functions | - |
| Icons | @expo/vector-icons (Feather) | ^14.0.0 |

### 3.2. カラーパレット

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#137fec` | メインアクション、リンク、アクティブ状態 |
| Background Light | `#f6f7f8` | 画面背景（ライト） |
| Background Dark | `#101922` | 画面背景（ダーク） |
| Surface | `#FFFFFF` | カード、入力欄背景 |
| Text Primary | `#111418` | 見出し、本文 |
| Text Secondary | `#617589` | サブテキスト、ラベル |
| Text Muted | `#4e5e6e` | プレースホルダー |
| Border | `#E5E5EA` | 区切り線、枠線 |
| Diff Added BG | `#ecfdf5` | 差分追加行背景 |
| Diff Added Border | `#10b981` | 差分追加行ボーダー |
| Diff Removed BG | `#fef2f2` | 差分削除行背景 |
| Diff Removed Border | `#ef4444` | 差分削除行ボーダー |
| Success | `#10b981` | 成功、同期完了 |
| Warning | `#f59e0b` | 警告、同期中 |
| Error | `#ef4444` | エラー |

### 3.3. タイポグラフィ

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 32px | 700 | 1.2 | 画面タイトル（大） |
| H2 | 22px | 700 | 1.3 | セクションタイトル |
| H3 | 18px | 600 | 1.4 | カードタイトル |
| Body | 16px | 400 | 1.5 | 本文 |
| Body Bold | 16px | 700 | 1.5 | 強調本文 |
| Caption | 13px | 500 | 1.4 | 補足テキスト |
| Small | 11px | 600 | 1.3 | メタ情報、タグ |
| Micro | 10px | 700 | 1.2 | バッジ、ラベル |

**Font Family**: `Inter`, `Noto Sans JP`, `system-ui`, `sans-serif`

### 3.4. スペーシング

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | アイコン間隔 |
| sm | 8px | 要素内余白 |
| md | 16px | 標準余白 |
| lg | 24px | セクション間 |
| xl | 32px | 画面余白 |
| 2xl | 48px | 大きなセクション間 |

### 3.5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | 小さいボタン |
| default | 8px | ボタン、入力欄 |
| lg | 12px | カード |
| xl | 16px | モーダル |
| 2xl | 22.5% | アプリアイコン（iOS squircle） |
| full | 9999px | 丸ボタン、アバター |

---

## 4. Screen Flow & Navigation

### 4.1. 画面一覧

| Screen | Route | Description |
|--------|-------|-------------|
| Splash | (entry) | 起動画面・ローディング |
| Dashboard | `/(tabs)/` | ファイル一覧（ホーム） |
| History Tab | `/(tabs)/history` | 全体の編集履歴 |
| Search Tab | `/(tabs)/search` | ファイル・コンテンツ検索 |
| Settings Tab | `/(tabs)/settings` | アカウント・アプリ設定 |
| Editor | `/editor/[id]` | Markdownエディタ（モーダル） |
| Diff View | `/diff/[id]` | 変更履歴・差分表示 |
| Prompts | `/prompts` | プロンプト・AIツール |
| GitHub Auth | `/auth/github` | GitHub OAuth認証 |

### 4.2. Navigation Structure

```
app/
├── _layout.tsx              # Root Layout (Stack)
├── (tabs)/                  # Tab Navigator
│   ├── _layout.tsx          # Tab Layout
│   ├── index.tsx            # Dashboard (Files)
│   ├── history.tsx          # History
│   ├── search.tsx           # Search
│   └── settings.tsx         # Settings
├── editor/
│   └── [id].tsx             # Editor (Modal)
├── diff/
│   └── [id].tsx             # Diff View
├── prompts/
│   └── index.tsx            # Prompts & AI Tools
└── auth/
    └── github.tsx           # GitHub OAuth
```

### 4.3. User Flow

```
[起動]
   ↓
[Splash Screen]
   ↓
[認証チェック]
   ├── 未認証 → [GitHub Auth] → [Dashboard]
   └── 認証済み → [Dashboard]
        ↓
   [Tab Navigation]
   ├── ファイル一覧 ─→ [Editor] ─→ [Diff View]
   │                     └──→ [AI Assistant Modal]
   ├── 履歴
   ├── 検索
   └── 設定
```

---

## 5. Data Models (TypeScript Interfaces)

```typescript
// ファイル/ドキュメント
interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'local' | 'error';
  repoPath?: string;        // GitHub上のパス
  branch?: string;
  lastCommitSha?: string;
}

// バージョン履歴
interface Version {
  id: string;
  documentId: string;
  content: string;
  commitSha?: string;
  commitMessage?: string;
  createdAt: Date;
  author?: string;
}

// 差分情報
interface Diff {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

// プロンプトテンプレート
interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  model: string;
  lastUsedAt?: Date;
  syncStatus: 'synced' | 'local';
}

// ユーザー設定
interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  focusMode: boolean;
  defaultRepo?: string;
  defaultBranch?: string;
}

// GitHub認証情報
interface GitHubAuth {
  accessToken: string;
  refreshToken?: string;
  username: string;
  avatarUrl?: string;
  expiresAt?: Date;
}
```

---

## 6. Directory Structure

```
notrailnote/
├── app/                     # Expo Router pages
│   ├── _layout.tsx
│   ├── (tabs)/
│   ├── editor/
│   ├── diff/
│   ├── prompts/
│   └── auth/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Button, Card, Input, etc.
│   │   ├── editor/          # Editor-specific components
│   │   ├── diff/            # Diff view components
│   │   └── navigation/      # Tab bar, headers
│   ├── screens/             # Screen compositions (if needed)
│   ├── hooks/               # Custom React hooks
│   │   ├── useDocument.ts
│   │   ├── useGitHub.ts
│   │   └── useSync.ts
│   ├── stores/              # Zustand stores
│   │   ├── documentStore.ts
│   │   ├── authStore.ts
│   │   └── settingsStore.ts
│   ├── services/            # API & external services
│   │   ├── github.ts        # GitHub API client
│   │   ├── storage.ts       # Local storage
│   │   └── ai.ts            # AI services (Whisper, etc.)
│   ├── utils/               # Helper functions
│   │   ├── markdown.ts
│   │   ├── diff.ts
│   │   └── date.ts
│   └── theme/               # Global theme (REQUIRED FIRST)
│       ├── index.ts         # Main export
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── shadows.ts
├── assets/                  # Images, fonts
│   ├── icon.png             # 1024x1024
│   ├── splash.png           # 2048x2048
│   └── fonts/
├── docs/                    # Documentation
│   ├── 企画書_最新.md
│   └── TODO.md
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── app.json
└── package.json
```

---

## 7. Implementation Roadmap (Checklist)

### Phase 1: Project Setup & Foundation
- [ ] Expoプロジェクト新規作成 (SDK 52)
- [ ] TypeScript strict mode設定
- [ ] ESLint/Prettier設定
- [ ] テーマファイル作成 (`src/theme/`)
- [ ] 基本コンポーネント作成 (Button, Card, Input, Text)
- [ ] Expo Router設定 (Tab Navigation)
- [ ] app.json設定 (icon, splash, bundleIdentifier)

### Phase 2: Core Screens UI
- [ ] スプラッシュスクリーン実装
- [ ] ダッシュボード（ファイル一覧）実装
- [ ] エディタ画面UI実装
- [ ] 変更履歴・差分表示画面UI実装
- [ ] 設定画面UI実装
- [ ] プロンプト・AIツール画面UI実装

### Phase 3: Local Data & State
- [ ] Zustand store設定 (documents, auth, settings)
- [ ] AsyncStorage連携（ローカル保存）
- [ ] ドキュメントCRUD機能
- [ ] 検索機能

### Phase 4: GitHub Integration
- [ ] GitHub OAuth認証実装
- [ ] GitHub API連携（リポジトリ取得）
- [ ] ファイル同期機能（push/pull）
- [ ] コミット履歴取得
- [ ] 差分計算・表示

### Phase 5: AI Features
- [ ] 音声ファイルアップロード
- [ ] Whisper API連携（テキスト化）
- [ ] プロンプトテンプレート管理
- [ ] AI出力とプロンプトの紐付け

### Phase 6: Polish & Release
- [ ] エラーハンドリング強化
- [ ] ローディング状態・空状態UI
- [ ] パフォーマンス最適化
- [ ] テスト作成
- [ ] App Store申請準備

---

## 8. Component Specifications

### 8.1. Dashboard Components

| Component | Description | Props |
|-----------|-------------|-------|
| `FileListItem` | ファイル一覧の1行 | document, onPress |
| `SyncStatusIcon` | 同期状態アイコン | status: 'synced' \| 'pending' \| 'local' |
| `FilterTabs` | すべて/同期済み/ローカル切替 | activeTab, onTabChange |
| `FloatingActionButton` | 新規作成ボタン | onPress |
| `PromoBanner` | Proプラン誘導バナー | onPress |

### 8.2. Editor Components

| Component | Description | Props |
|-----------|-------------|-------|
| `MarkdownEditor` | メインエディタ | value, onChange |
| `EditorToolbar` | Markdown書式ツールバー | onAction |
| `FocusModeToggle` | 集中モード切替 | enabled, onToggle |
| `SyncProgressBar` | 同期進捗表示 | progress, status |
| `AIAssistantButton` | AIアシスタント起動 | onPress |

### 8.3. Diff Components

| Component | Description | Props |
|-----------|-------------|-------|
| `DiffViewer` | 差分表示（追加/削除） | diffs: Diff[] |
| `VersionTimeline` | バージョンタイムライン | versions: Version[] |
| `RestoreButton` | バージョン復元ボタン | version, onRestore |

---

## 9. Update Log

| Date | Status | Changes |
|------|--------|---------|
| 2026-01-20 | Created | 初版作成。Tech Spec, Screen Flow, Data Models, Roadmap定義 |

---

**Next Steps**: テーマファイル (`src/theme/index.ts`) の作成
