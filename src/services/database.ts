import * as SQLite from 'expo-sqlite';
import type { Document, Version, PromptTemplate, UserSettings } from '@/types';

const DB_NAME = 'notrailnote.db';

let db: SQLite.SQLiteDatabase | null = null;

// データベース初期化
export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- ドキュメントテーブル
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      tags TEXT,
      github_sync TEXT
    );

    -- バージョン履歴テーブル
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('local', 'github')),
      label TEXT,
      auto_saved INTEGER NOT NULL DEFAULT 1,
      commit_sha TEXT,
      commit_message TEXT,
      author TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    -- プロンプトテンプレートテーブル
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL
    );

    -- ユーザー設定テーブル
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT DEFAULT 'system',
      font_size TEXT DEFAULT 'medium',
      focus_mode INTEGER DEFAULT 0,
      github_config TEXT
    );

    -- インデックス
    CREATE INDEX IF NOT EXISTS idx_versions_document_id ON versions(document_id);
    CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at);
    CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);
  `);

  // デフォルト設定を挿入（存在しない場合）
  await db.runAsync(`
    INSERT OR IGNORE INTO user_settings (id, theme, font_size, focus_mode)
    VALUES (1, 'system', 'medium', 0)
  `);
}

// データベースインスタンス取得
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// =============================================================================
// Documents
// =============================================================================

export async function getAllDocuments(): Promise<Document[]> {
  const result = await getDb().getAllAsync<{
    id: string;
    title: string;
    content: string;
    created_at: number;
    updated_at: number;
    tags: string | null;
    github_sync: string | null;
  }>('SELECT * FROM documents ORDER BY updated_at DESC');

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    githubSync: row.github_sync ? JSON.parse(row.github_sync) : undefined,
  }));
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const result = await getDb().getFirstAsync<{
    id: string;
    title: string;
    content: string;
    created_at: number;
    updated_at: number;
    tags: string | null;
    github_sync: string | null;
  }>('SELECT * FROM documents WHERE id = ?', id);

  if (!result) return null;

  return {
    id: result.id,
    title: result.title,
    content: result.content,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    tags: result.tags ? JSON.parse(result.tags) : undefined,
    githubSync: result.github_sync ? JSON.parse(result.github_sync) : undefined,
  };
}

export async function createDocument(document: Document): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO documents (id, title, content, created_at, updated_at, tags, github_sync)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    document.id,
    document.title,
    document.content,
    document.createdAt,
    document.updatedAt,
    document.tags ? JSON.stringify(document.tags) : null,
    document.githubSync ? JSON.stringify(document.githubSync) : null
  );
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<void> {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    setClauses.push('content = ?');
    values.push(updates.content);
  }
  if (updates.tags !== undefined) {
    setClauses.push('tags = ?');
    values.push(updates.tags ? JSON.stringify(updates.tags) : null);
  }
  if (updates.githubSync !== undefined) {
    setClauses.push('github_sync = ?');
    values.push(updates.githubSync ? JSON.stringify(updates.githubSync) : null);
  }

  setClauses.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  await getDb().runAsync(
    `UPDATE documents SET ${setClauses.join(', ')} WHERE id = ?`,
    ...values
  );
}

export async function deleteDocument(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM documents WHERE id = ?', id);
}

// =============================================================================
// Versions
// =============================================================================

export async function getVersionsByDocumentId(
  documentId: string
): Promise<Version[]> {
  const result = await getDb().getAllAsync<{
    id: string;
    document_id: string;
    content: string;
    created_at: number;
    source: 'local' | 'github';
    label: string | null;
    auto_saved: number;
    commit_sha: string | null;
    commit_message: string | null;
    author: string | null;
  }>(
    'SELECT * FROM versions WHERE document_id = ? ORDER BY created_at DESC',
    documentId
  );

  return result.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    createdAt: row.created_at,
    source: row.source,
    label: row.label ?? undefined,
    autoSaved: row.auto_saved === 1,
    commitSha: row.commit_sha ?? undefined,
    commitMessage: row.commit_message ?? undefined,
    author: row.author ?? undefined,
  }));
}

export async function createVersion(version: Version): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO versions (id, document_id, content, created_at, source, label, auto_saved, commit_sha, commit_message, author)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    version.id,
    version.documentId,
    version.content,
    version.createdAt,
    version.source,
    version.label ?? null,
    version.autoSaved ? 1 : 0,
    version.commitSha ?? null,
    version.commitMessage ?? null,
    version.author ?? null
  );
}

export async function deleteOldVersions(
  retentionDays: number
): Promise<number> {
  if (retentionDays === -1) return 0; // 無制限

  const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  const result = await getDb().runAsync(
    `DELETE FROM versions WHERE created_at < ? AND auto_saved = 1`,
    cutoffDate
  );

  return result.changes;
}

export type VersionWithDocument = Version & {
  documentTitle: string;
};

export async function getVersionById(id: string): Promise<Version | null> {
  const result = await getDb().getFirstAsync<{
    id: string;
    document_id: string;
    content: string;
    created_at: number;
    source: 'local' | 'github';
    label: string | null;
    auto_saved: number;
    commit_sha: string | null;
    commit_message: string | null;
    author: string | null;
  }>('SELECT * FROM versions WHERE id = ?', id);

  if (!result) return null;

  return {
    id: result.id,
    documentId: result.document_id,
    content: result.content,
    createdAt: result.created_at,
    source: result.source,
    label: result.label ?? undefined,
    autoSaved: result.auto_saved === 1,
    commitSha: result.commit_sha ?? undefined,
    commitMessage: result.commit_message ?? undefined,
    author: result.author ?? undefined,
  };
}

export async function getPreviousVersion(documentId: string, createdAt: number): Promise<Version | null> {
  const result = await getDb().getFirstAsync<{
    id: string;
    document_id: string;
    content: string;
    created_at: number;
    source: 'local' | 'github';
    label: string | null;
    auto_saved: number;
    commit_sha: string | null;
    commit_message: string | null;
    author: string | null;
  }>(
    `SELECT * FROM versions
     WHERE document_id = ? AND created_at < ?
     ORDER BY created_at DESC
     LIMIT 1`,
    documentId,
    createdAt
  );

  if (!result) return null;

  return {
    id: result.id,
    documentId: result.document_id,
    content: result.content,
    createdAt: result.created_at,
    source: result.source,
    label: result.label ?? undefined,
    autoSaved: result.auto_saved === 1,
    commitSha: result.commit_sha ?? undefined,
    commitMessage: result.commit_message ?? undefined,
    author: result.author ?? undefined,
  };
}

export async function getAllVersionsWithDocuments(): Promise<VersionWithDocument[]> {
  const result = await getDb().getAllAsync<{
    id: string;
    document_id: string;
    content: string;
    created_at: number;
    source: 'local' | 'github';
    label: string | null;
    auto_saved: number;
    commit_sha: string | null;
    commit_message: string | null;
    author: string | null;
    document_title: string;
  }>(
    `SELECT v.*, d.title as document_title
     FROM versions v
     JOIN documents d ON v.document_id = d.id
     ORDER BY v.created_at DESC
     LIMIT 100`
  );

  return result.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    createdAt: row.created_at,
    source: row.source,
    label: row.label ?? undefined,
    autoSaved: row.auto_saved === 1,
    commitSha: row.commit_sha ?? undefined,
    commitMessage: row.commit_message ?? undefined,
    author: row.author ?? undefined,
    documentTitle: row.document_title,
  }));
}

// =============================================================================
// Settings
// =============================================================================

export async function getSettings(): Promise<UserSettings> {
  const result = await getDb().getFirstAsync<{
    theme: string;
    font_size: string;
    focus_mode: number;
    github_config: string | null;
  }>('SELECT * FROM user_settings WHERE id = 1');

  if (!result) {
    return {
      theme: 'system',
      fontSize: 'medium',
      focusMode: false,
    };
  }

  return {
    theme: result.theme as UserSettings['theme'],
    fontSize: result.font_size as UserSettings['fontSize'],
    focusMode: result.focus_mode === 1,
    github: result.github_config ? JSON.parse(result.github_config) : undefined,
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await getDb().runAsync(
    `UPDATE user_settings SET theme = ?, font_size = ?, focus_mode = ?, github_config = ? WHERE id = 1`,
    settings.theme,
    settings.fontSize,
    settings.focusMode ? 1 : 0,
    settings.github ? JSON.stringify(settings.github) : null
  );
}

// =============================================================================
// Prompt Templates
// =============================================================================

export async function getAllPromptTemplates(): Promise<PromptTemplate[]> {
  const result = await getDb().getAllAsync<{
    id: string;
    title: string;
    description: string | null;
    prompt: string;
    model: string;
    last_used_at: number | null;
    created_at: number;
  }>('SELECT * FROM prompt_templates ORDER BY last_used_at DESC NULLS LAST');

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    prompt: row.prompt,
    model: row.model,
    lastUsedAt: row.last_used_at ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function createPromptTemplate(
  template: PromptTemplate
): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO prompt_templates (id, title, description, prompt, model, last_used_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    template.id,
    template.title,
    template.description,
    template.prompt,
    template.model,
    template.lastUsedAt ?? null,
    template.createdAt
  );
}

export async function deletePromptTemplate(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM prompt_templates WHERE id = ?', id);
}

// =============================================================================
// Search
// =============================================================================

export async function searchDocuments(query: string): Promise<Document[]> {
  if (!query.trim()) return [];

  const searchTerm = `%${query.trim()}%`;
  const result = await getDb().getAllAsync<{
    id: string;
    title: string;
    content: string;
    created_at: number;
    updated_at: number;
    tags: string | null;
    github_sync: string | null;
  }>(
    `SELECT * FROM documents
     WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
     ORDER BY updated_at DESC
     LIMIT 50`,
    searchTerm,
    searchTerm,
    searchTerm
  );

  return result.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    githubSync: row.github_sync ? JSON.parse(row.github_sync) : undefined,
  }));
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const result = await getDb().getAllAsync<{ tags: string | null }>(
    'SELECT DISTINCT tags FROM documents WHERE tags IS NOT NULL'
  );

  const tagSet = new Set<string>();
  for (const row of result) {
    if (row.tags) {
      const tags: string[] = JSON.parse(row.tags);
      tags.forEach((tag) => tagSet.add(tag));
    }
  }

  return Array.from(tagSet).sort();
}
