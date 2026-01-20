import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncDocument } from './githubSync';
import { getDocumentById } from './database';

const SYNC_QUEUE_KEY = '@notrailnote/sync_queue';

export interface SyncQueueItem {
  id: string;
  documentId: string;
  action: 'push' | 'pull';
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncQueueState {
  items: SyncQueueItem[];
  isProcessing: boolean;
  lastProcessedAt?: number;
}

// Load queue from storage
async function loadQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save queue to storage
async function saveQueue(items: SyncQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add item to sync queue
export async function addToSyncQueue(
  documentId: string,
  action: 'push' | 'pull' = 'push'
): Promise<void> {
  const queue = await loadQueue();

  // Check if already in queue
  const existing = queue.find((item) => item.documentId === documentId && item.action === action);
  if (existing) {
    return; // Already queued
  }

  const newItem: SyncQueueItem = {
    id: generateId(),
    documentId,
    action,
    createdAt: Date.now(),
    retryCount: 0,
  };

  queue.push(newItem);
  await saveQueue(queue);
}

// Remove item from queue
export async function removeFromQueue(id: string): Promise<void> {
  const queue = await loadQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await saveQueue(filtered);
}

// Get queue items
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return loadQueue();
}

// Clear all queue items
export async function clearSyncQueue(): Promise<void> {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
}

// Process a single queue item
async function processQueueItem(
  item: SyncQueueItem,
  accessToken: string,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const doc = await getDocumentById(item.documentId);
    if (!doc) {
      // Document no longer exists, remove from queue
      await removeFromQueue(item.id);
      return true;
    }

    if (item.action === 'push') {
      const result = await syncDocument(doc, accessToken, owner, repo);
      if (result.success) {
        await removeFromQueue(item.id);
        return true;
      } else {
        // Update retry count
        const queue = await loadQueue();
        const updated = queue.map((q) =>
          q.id === item.id
            ? { ...q, retryCount: q.retryCount + 1, lastError: result.message }
            : q
        );
        await saveQueue(updated);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing queue item:', error);
    // Update retry count
    const queue = await loadQueue();
    const updated = queue.map((q) =>
      q.id === item.id
        ? { ...q, retryCount: q.retryCount + 1, lastError: String(error) }
        : q
    );
    await saveQueue(updated);
    return false;
  }
}

// Process entire queue
export async function processSyncQueue(
  accessToken: string,
  owner: string,
  repo: string,
  options?: { maxRetries?: number; onProgress?: (processed: number, total: number) => void }
): Promise<{ success: number; failed: number }> {
  const { maxRetries = 3, onProgress } = options || {};

  const queue = await loadQueue();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];

    // Skip items that have exceeded retry limit
    if (item.retryCount >= maxRetries) {
      failed++;
      continue;
    }

    const result = await processQueueItem(item, accessToken, owner, repo);
    if (result) {
      success++;
    } else {
      failed++;
    }

    onProgress?.(i + 1, queue.length);
  }

  return { success, failed };
}

// Get pending sync count
export async function getPendingSyncCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

// Check if document is in queue
export async function isInSyncQueue(documentId: string): Promise<boolean> {
  const queue = await loadQueue();
  return queue.some((item) => item.documentId === documentId);
}
