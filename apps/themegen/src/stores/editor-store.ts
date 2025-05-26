import { defaultThemeState } from "@/config/themes";
import { isDeepEqual } from "@/lib/utils";
import { ThemeEditorState } from "@/types/editor";
import { getPresetThemeStyles } from "@/utils/theme-preset-helper";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_HISTORY_COUNT = 30;
const HISTORY_OVERRIDE_THRESHOLD_MS = 500;

interface ThemeHistoryEntry {
  state: ThemeEditorState;
  timestamp: number;
}

interface EditorStore {
  themeState: ThemeEditorState;
  themeCheckpoint: ThemeEditorState | null;
  history: ThemeHistoryEntry[];
  future: ThemeHistoryEntry[];
  setThemeState: (state: ThemeEditorState) => void;
  applyThemePreset: (preset: string) => void;
  saveThemeCheckpoint: () => void;
  resetToCurrentPreset: () => void;
  hasThemeChangedFromCheckpoint: () => boolean;
  hasUnsavedChanges: () => boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      themeState: defaultThemeState,
      themeCheckpoint: null,
      history: [],
      future: [],
      setThemeState: (newState: ThemeEditorState) => {
        const oldThemeState = get().themeState;
        let currentHistory = get().history;
        let currentFuture = get().future;

        // 检查是否仅currentMode改变
        const oldStateWithoutMode = { ...oldThemeState, currentMode: undefined };
        const newStateWithoutMode = { ...newState, currentMode: undefined };

        if (
          isDeepEqual(oldStateWithoutMode, newStateWithoutMode) &&
          oldThemeState.currentMode !== newState.currentMode
        ) {
          set({ themeState: newState });
          return;
        }

        const currentTime = Date.now();

        // 最近历史记录
        const lastHistoryEntry =
          currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;

        // 如果没有历史记录，或者历史记录时间戳与当前时间戳的差值大于HISTORY_OVERRIDE_THRESHOLD_MS，则添加新的历史记录
        if (
          !lastHistoryEntry ||
          currentTime - lastHistoryEntry.timestamp >= HISTORY_OVERRIDE_THRESHOLD_MS
        ) {
          currentHistory = [...currentHistory, { state: oldThemeState, timestamp: currentTime }];
          currentFuture = [];
        }

        // 如果历史记录数量超过MAX_HISTORY_COUNT，则移除最早的历史记录
        if (currentHistory.length > MAX_HISTORY_COUNT) {
          currentHistory.shift();
        }

        set({
          themeState: newState,
          history: currentHistory,
          future: currentFuture,
        });
      },
      applyThemePreset: (preset: string) => {
        const currentThemeState = get().themeState;
        const oldHistory = get().history;
        const currentTime = Date.now();

        const newStyles = getPresetThemeStyles(preset);
        const newThemeState: ThemeEditorState = {
          ...currentThemeState,
          preset,
          styles: newStyles,
          hslAdjustments: defaultThemeState.hslAdjustments,
        };

        const newHistoryEntry = { state: currentThemeState, timestamp: currentTime };

        const updatedHistory = [...oldHistory, newHistoryEntry];
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
          updatedHistory.shift();
        }

        set({
          themeState: newThemeState,
          themeCheckpoint: newThemeState,
          history: updatedHistory,
          future: [],
        });
      },
      saveThemeCheckpoint: () => {
        set({ themeCheckpoint: get().themeState });
      },
      restoreThemeCheckpoint: () => {
        const checkpoint = get().themeCheckpoint;
        if (checkpoint) {
          const oldThemeState = get().themeState;
          const oldHistory = get().history;
          const currentTime = Date.now();

          const newHistoryEntry = { state: oldThemeState, timestamp: currentTime };

          const updatedHistory = [...oldHistory, newHistoryEntry];
          if (updatedHistory.length > MAX_HISTORY_COUNT) {
            updatedHistory.shift();
          }

          set({
            themeState: {
              ...checkpoint,
              currentMode: get().themeState.currentMode,
            },
            history: updatedHistory,
            future: [],
          });
        } else {
          console.warn("no theme checkpoint available to restore to.");
        }
      },
      hasThemeChangedFromCheckpoint: () => {
        const checkpoint = get().themeCheckpoint;
        return !isDeepEqual(get().themeState, checkpoint);
      },
      hasUnsavedChanges: () => {
        const themeState = get().themeState;
        const presetThemeStyles = getPresetThemeStyles(themeState.preset ?? "default");
        const stylesChanged = !isDeepEqual(themeState.styles, presetThemeStyles);
        const hslChanged = !isDeepEqual(
          themeState.hslAdjustments,
          defaultThemeState.hslAdjustments
        );
        return stylesChanged || hslChanged;
      },
      resetToCurrentPreset: () => {
        const currentThemeState = get().themeState;

        const presetThemeStyles = getPresetThemeStyles(currentThemeState.preset ?? "default");
        const newThemeState: ThemeEditorState = {
          ...currentThemeState,
          styles: presetThemeStyles,
          hslAdjustments: defaultThemeState.hslAdjustments,
        };

        set({
          themeState: newThemeState,
          themeCheckpoint: newThemeState,
          history: [],
          future: [],
        });
      },
      undo: () => {
        const history = get().history;
        if (history.length === 0) {
          return;
        }

        const currentThemeState = get().themeState;
        const future = get().future;

        const lastHistoryEntry = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        const newFutureEntry = { state: currentThemeState, timestamp: Date.now() };
        const newFuture = [newFutureEntry, ...future];

        set({
          themeState: lastHistoryEntry.state,
          themeCheckpoint: lastHistoryEntry.state,
          history: newHistory,
          future: newFuture,
        });
      },
      redo: () => {
        const future = get().future;
        if (future.length === 0) {
          return;
        }

        const history = get().history;

        const lastFutyreEntry = future[0];
        const newFuture = future.slice(1);

        const currentThemeState = lastFutyreEntry.state;

        const updatedHistory = [...history, { state: currentThemeState, timestamp: Date.now() }];
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
          updatedHistory.shift();
        }

        set({
          themeState: lastFutyreEntry.state,
          themeCheckpoint: lastFutyreEntry.state,
          history: updatedHistory,
          future: newFuture,
        });
      },
      canUndo: () => get().history.length > 0,
      canRedo: () => get().future.length > 0,
    }),
    {
      name: "themeGen-editor-storage",
    }
  )
);
