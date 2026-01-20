import { create } from 'zustand';
import type { Document, Version } from '@/types';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  versions: Version[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  setCurrentDocument: (document: Document | null) => void;

  setVersions: (versions: Version[]) => void;
  addVersion: (version: Version) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  versions: [],
  isLoading: false,
  error: null,

  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: Date.now() } : doc
      ),
      currentDocument:
        state.currentDocument?.id === id
          ? { ...state.currentDocument, ...updates, updatedAt: Date.now() }
          : state.currentDocument,
    })),

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      currentDocument:
        state.currentDocument?.id === id ? null : state.currentDocument,
    })),

  setCurrentDocument: (document) => set({ currentDocument: document }),

  setVersions: (versions) => set({ versions }),

  addVersion: (version) =>
    set((state) => ({
      versions: [version, ...state.versions],
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
