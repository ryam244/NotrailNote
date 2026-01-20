import {
  getFileContent,
  createOrUpdateFile,
  decodeContent,
  type GitHubRepo,
} from './github';
import { updateDocument, getDocumentById } from './database';
import type { Document } from '@/types';

export interface SyncResult {
  success: boolean;
  action: 'pushed' | 'pulled' | 'conflict' | 'no_change' | 'error';
  message: string;
  commitSha?: string;
}

// Generate file path for document in repo
function getDocumentPath(title: string): string {
  // Sanitize filename: replace invalid chars with underscore
  const safeName = title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100);
  return `documents/${safeName}.md`;
}

// Push document to GitHub
export async function pushDocument(
  document: Document,
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<SyncResult> {
  try {
    const path = getDocumentPath(document.title);

    // Get existing file to check if update or create
    const existingFile = await getFileContent(accessToken, owner, repo, path, branch);

    const content = `# ${document.title}\n\n${document.content}`;
    const message = existingFile
      ? `Update: ${document.title}`
      : `Create: ${document.title}`;

    const result = await createOrUpdateFile(
      accessToken,
      owner,
      repo,
      path,
      content,
      message,
      existingFile?.sha,
      branch
    );

    if (!result) {
      return {
        success: false,
        action: 'error',
        message: 'GitHubへのアップロードに失敗しました',
      };
    }

    // Update document with sync info
    await updateDocument(document.id, {
      githubSync: {
        enabled: true,
        repoPath: `${owner}/${repo}/${path}`,
        branch,
        lastCommitSha: result.commit.sha,
        syncStatus: 'synced',
      },
    });

    return {
      success: true,
      action: 'pushed',
      message: '同期完了',
      commitSha: result.commit.sha,
    };
  } catch (error) {
    console.error('Push error:', error);
    return {
      success: false,
      action: 'error',
      message: error instanceof Error ? error.message : '同期エラー',
    };
  }
}

// Pull document from GitHub
export async function pullDocument(
  documentId: string,
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<SyncResult> {
  try {
    const file = await getFileContent(accessToken, owner, repo, path, branch);

    if (!file) {
      return {
        success: false,
        action: 'error',
        message: 'ファイルが見つかりません',
      };
    }

    const content = decodeContent(file.content);

    // Parse markdown: first line as title, rest as content
    const lines = content.split('\n');
    let title = '';
    let body = content;

    if (lines[0]?.startsWith('# ')) {
      title = lines[0].slice(2).trim();
      body = lines.slice(2).join('\n').trim();
    }

    // Update local document
    const doc = await getDocumentById(documentId);
    if (!doc) {
      return {
        success: false,
        action: 'error',
        message: 'ローカルドキュメントが見つかりません',
      };
    }

    await updateDocument(documentId, {
      title: title || doc.title,
      content: body,
      githubSync: {
        enabled: true,
        repoPath: `${owner}/${repo}/${path}`,
        branch,
        lastCommitSha: file.sha,
        syncStatus: 'synced',
      },
    });

    return {
      success: true,
      action: 'pulled',
      message: 'GitHubから取得しました',
      commitSha: file.sha,
    };
  } catch (error) {
    console.error('Pull error:', error);
    return {
      success: false,
      action: 'error',
      message: error instanceof Error ? error.message : '同期エラー',
    };
  }
}

// Sync document (smart sync - check for changes)
export async function syncDocument(
  document: Document,
  accessToken: string,
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<SyncResult> {
  try {
    const path = getDocumentPath(document.title);

    // Get remote file
    const remoteFile = await getFileContent(accessToken, owner, repo, path, branch);

    if (!remoteFile) {
      // File doesn't exist remotely, push
      return pushDocument(document, accessToken, owner, repo, branch);
    }

    const remoteContent = decodeContent(remoteFile.content);
    const localContent = `# ${document.title}\n\n${document.content}`;

    // Check if contents match
    if (remoteContent.trim() === localContent.trim()) {
      return {
        success: true,
        action: 'no_change',
        message: '変更はありません',
        commitSha: remoteFile.sha,
      };
    }

    // Check if local has been modified since last sync
    if (document.githubSync?.lastCommitSha === remoteFile.sha) {
      // Remote unchanged, local modified - push
      return pushDocument(document, accessToken, owner, repo, branch);
    }

    // Both changed - conflict (for now, prefer local)
    // TODO: Implement proper conflict resolution
    return pushDocument(document, accessToken, owner, repo, branch);
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      action: 'error',
      message: error instanceof Error ? error.message : '同期エラー',
    };
  }
}

// Mark document sync status as pending
export async function markSyncPending(documentId: string): Promise<void> {
  const doc = await getDocumentById(documentId);
  if (doc?.githubSync) {
    await updateDocument(documentId, {
      githubSync: {
        ...doc.githubSync,
        syncStatus: 'pending',
      },
    });
  }
}
