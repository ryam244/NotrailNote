import { useCallback, useEffect } from 'react';
import { useDocumentStore } from '@/stores';
import { useAuthStore } from '@/stores';
import * as db from '@/services/database';
import type { Document, Version } from '@/types';
import { PLAN_LIMITS } from '@/types';

// UUID生成
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useDocuments() {
  const {
    documents,
    currentDocument,
    isLoading,
    error,
    setDocuments,
    addDocument,
    updateDocument: updateDocumentState,
    deleteDocument: deleteDocumentState,
    setCurrentDocument,
    setLoading,
    setError,
  } = useDocumentStore();

  const { user } = useAuthStore();
  const plan = user?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan];

  // ドキュメント一覧取得
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await db.getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [setDocuments, setLoading, setError]);

  // ドキュメント作成
  const createDocument = useCallback(
    async (title: string, content: string = ''): Promise<Document | null> => {
      // 制限チェック
      if (limits.maxDocuments !== -1 && documents.length >= limits.maxDocuments) {
        setError(`ドキュメント数の上限（${limits.maxDocuments}件）に達しています`);
        return null;
      }

      const now = Date.now();
      const newDocument: Document = {
        id: generateId(),
        title,
        content,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await db.createDocument(newDocument);
        addDocument(newDocument);
        return newDocument;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create document');
        return null;
      }
    },
    [documents.length, limits.maxDocuments, addDocument, setError]
  );

  // ドキュメント更新
  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>) => {
      try {
        await db.updateDocument(id, updates);
        updateDocumentState(id, updates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update document');
      }
    },
    [updateDocumentState, setError]
  );

  // ドキュメント削除
  const deleteDocument = useCallback(
    async (id: string) => {
      try {
        await db.deleteDocument(id);
        deleteDocumentState(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete document');
      }
    },
    [deleteDocumentState, setError]
  );

  // ドキュメント取得
  const getDocument = useCallback(async (id: string): Promise<Document | null> => {
    try {
      const doc = await db.getDocumentById(id);
      if (doc) {
        setCurrentDocument(doc);
      }
      return doc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document');
      return null;
    }
  }, [setCurrentDocument, setError]);

  return {
    documents,
    currentDocument,
    isLoading,
    error,
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    setCurrentDocument,
    limits,
  };
}

export function useVersions(documentId: string | null) {
  const { versions, setVersions, addVersion } = useDocumentStore();
  const { user } = useAuthStore();
  const plan = user?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan];

  // バージョン一覧取得
  const loadVersions = useCallback(async () => {
    if (!documentId) return;
    try {
      const vers = await db.getVersionsByDocumentId(documentId);
      setVersions(vers);
    } catch (err) {
      console.error('Failed to load versions:', err);
    }
  }, [documentId, setVersions]);

  // バージョン作成（自動保存）
  const createAutoSaveVersion = useCallback(
    async (content: string) => {
      if (!documentId) return;

      const version: Version = {
        id: generateId(),
        documentId,
        content,
        createdAt: Date.now(),
        source: 'local',
        autoSaved: true,
      };

      try {
        await db.createVersion(version);
        addVersion(version);
      } catch (err) {
        console.error('Failed to create auto-save version:', err);
      }
    },
    [documentId, addVersion]
  );

  // 手動スナップショット作成
  const createManualSnapshot = useCallback(
    async (content: string, label?: string): Promise<boolean> => {
      if (!documentId) return false;

      // プラン制限チェック
      if (!limits.manualSnapshot) {
        console.warn('Manual snapshot not available in current plan');
        return false;
      }

      const version: Version = {
        id: generateId(),
        documentId,
        content,
        createdAt: Date.now(),
        source: 'local',
        autoSaved: false,
        label,
      };

      try {
        await db.createVersion(version);
        addVersion(version);
        return true;
      } catch (err) {
        console.error('Failed to create manual snapshot:', err);
        return false;
      }
    },
    [documentId, limits.manualSnapshot, addVersion]
  );

  // 古いバージョンのクリーンアップ
  const cleanupOldVersions = useCallback(async () => {
    try {
      const deleted = await db.deleteOldVersions(limits.historyRetentionDays);
      if (deleted > 0) {
        await loadVersions();
      }
    } catch (err) {
      console.error('Failed to cleanup old versions:', err);
    }
  }, [limits.historyRetentionDays, loadVersions]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  return {
    versions,
    loadVersions,
    createAutoSaveVersion,
    createManualSnapshot,
    cleanupOldVersions,
    autoSaveIntervalSec: limits.autoSaveIntervalSec,
    canCreateManualSnapshot: limits.manualSnapshot,
  };
}

// UUID生成関数のエクスポート
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
