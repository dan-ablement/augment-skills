'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ScoringMode, NotAssessedHandling } from '@/types/hierarchy';

export interface ViewState {
  scoringMode: ScoringMode;
  skills: number[];
  roles: string[];
  managerId: number | null;
  notAssessed: NotAssessedHandling;
}

interface SavedView {
  id: string;
  user_email: string;
  name: string;
  description: string | null;
  is_shared: boolean;
  view_state: ViewState;
  created_at: string;
  updated_at: string;
}

interface SavedViewsDropdownProps {
  currentViewState: ViewState;
  onLoadView: (state: ViewState) => void;
}

export function SavedViewsDropdown({ currentViewState, onLoadView }: SavedViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveIsShared, setSaveIsShared] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchViews = useCallback(async () => {
    try {
      const res = await api.get('/views');
      setViews(res.data.views || []);
    } catch (err) {
      console.error('Failed to fetch saved views:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchViews();
  }, [isOpen, fetchViews]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSaveDialog(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      await api.post('/views', {
        name: saveName.trim(),
        description: saveDescription.trim() || null,
        is_shared: saveIsShared,
        view_state: currentViewState,
      });
      setSaveName('');
      setSaveDescription('');
      setSaveIsShared(false);
      setShowSaveDialog(false);
      await fetchViews();
    } catch (err) {
      console.error('Failed to save view:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/views/${id}`);
      setViews((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Failed to delete view:', err);
    }
  };

  const handleLoad = (view: SavedView) => {
    onLoadView(view.view_state);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setIsOpen(!isOpen); setShowSaveDialog(false); }}
        className="flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Views
        <svg className={`w-3 h-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {/* Saved views list */}
          <div className="max-h-60 overflow-y-auto">
            {views.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-500 text-center">No saved views yet</div>
            ) : (
              views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleLoad(view)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{view.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {view.is_shared ? '🌐 Shared' : '🔒 Personal'}
                      {view.description && ` · ${view.description}`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(view.id, e)}
                    className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete view"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Save dialog or save button */}
          <div className="border-t border-gray-100">
            {showSaveDialog ? (
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  placeholder="View name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <label className="flex items-center text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={saveIsShared}
                    onChange={(e) => setSaveIsShared(e.target.checked)}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded mr-1.5"
                  />
                  Share with team
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim() || isSaving}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                + Save Current View
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

