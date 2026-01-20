# TODO - NotrailNote Development

## 🚀 今すぐやること (Phase 1: Setup & Foundation)

### プロジェクト初期化
- [ ] Expoプロジェクト新規作成
  ```bash
  npx create-expo-app@latest notrailnote --template blank-typescript
  ```
- [ ] 必須パッケージインストール
  ```bash
  npm install zustand@4.5.0 expo-router@3.5.0 @react-native-async-storage/async-storage
  npm install @expo/vector-icons@14.0.0
  npm install --save-dev eslint@8.57.0 prettier@3.2.5 @typescript-eslint/eslint-plugin@7.0.0
  ```
- [ ] TypeScript strict mode設定
- [ ] ESLint/Prettier設定
- [ ] app.json基本設定

### テーマ・基盤
- [ ] `src/theme/index.ts` 作成（docs/theme-spec.tsからコピー）
- [ ] 基本コンポーネント作成
  - [ ] `Text` - テーマ対応テキスト
  - [ ] `Button` - プライマリ/セカンダリ
  - [ ] `Card` - カードコンテナ
  - [ ] `Input` - テキスト入力
  - [ ] `IconButton` - アイコンボタン

### ナビゲーション
- [ ] Expo Router設定
- [ ] Tab Navigator設定（4タブ）
- [ ] Stack Navigator設定（モーダル用）

---

## 📅 今後やること (Phase 2-6)

### Phase 2: Core Screens UI
- [ ] スプラッシュスクリーン
- [ ] ダッシュボード（ファイル一覧）
  - [ ] FileListItem コンポーネント
  - [ ] FilterTabs（すべて/同期済み/ローカル）
  - [ ] FloatingActionButton（新規作成）
  - [ ] PromoBanner（Pro誘導）
- [ ] エディタ画面
  - [ ] MarkdownEditor
  - [ ] EditorToolbar
  - [ ] FocusModeToggle
  - [ ] SyncProgressBar
  - [ ] AIAssistantButton
- [ ] 変更履歴・差分表示
  - [ ] DiffViewer
  - [ ] VersionTimeline
  - [ ] RestoreButton
- [ ] 設定画面
  - [ ] ListItem コンポーネント
  - [ ] セクション分割
  - [ ] トグルスイッチ
- [ ] プロンプト・AIツール画面

### Phase 3: Local Data & State
- [ ] Zustand stores設定
  - [ ] documentStore
  - [ ] authStore
  - [ ] settingsStore
- [ ] AsyncStorage連携
- [ ] ドキュメントCRUD
- [ ] 検索機能

### Phase 4: GitHub Integration
- [ ] GitHub OAuth認証
- [ ] GitHub API連携
- [ ] ファイル同期（push/pull）
- [ ] コミット履歴取得
- [ ] 差分計算

### Phase 5: AI Features
- [ ] 音声ファイルアップロード
- [ ] Whisper API連携
- [ ] プロンプトテンプレート管理

### Phase 6: Polish & Release
- [ ] エラーハンドリング
- [ ] ローディング/空状態UI
- [ ] パフォーマンス最適化
- [ ] App Store申請準備

---

## ✅ 完了

- [x] Claude.md確認
- [x] 開発指示書確認
- [x] 企画書確認
- [x] HTMLモックアップ分析
- [x] PROJECT_PLAN.md作成
- [x] テーマ仕様書作成（docs/theme-spec.ts）
- [x] TODO.md作成

---

## 📝 メモ・注意事項

### デザイン原則
- **プライマリカラー**: #137fec を全画面で統一
- **アイコン**: 細線ミニマルデザイン（strokeWidth: 1.5）
- **フォント**: Inter + Noto Sans JP
- **ハードコード禁止**: 色・サイズは全てテーマから参照

### Git運用
- 開発ブランチ: `claude/setup-development-prep-8AqkI`
- コミットメッセージ: `feat:`, `fix:`, `docs:` プレフィックス使用

### 参照ファイル
- 企画書: `/notrailnote_企画書.md`
- 開発指示書: `/開発指示書.md`
- AI Vibe Protocol: `/Claude.md`
- 設計ドキュメント: `/PROJECT_PLAN.md`
- テーマ仕様: `/docs/theme-spec.ts`
