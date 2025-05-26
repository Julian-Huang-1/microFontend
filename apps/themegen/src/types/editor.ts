import { ThemeStyles } from "./theme";

export interface BaseEditorState {
  styles: ThemeStyles;
}

export interface EditorControls {}

export interface EditorPreviewProps {
  styles: ThemeStyles;
}

export interface ThemeEditorState extends BaseEditorState {
  preset?: string;
  currentMode: "light" | "dark";
  hslAdjustments?: {
    hueShift: number;
    saturationScale: number;
    lightnessScale: number;
  };
}

export type EditorType = "button" | "input" | "card" | "dialog" | "theme";

export interface EditorConfig {
  type: EditorType;
  name: string;
  description: string;
  defaultState: BaseEditorState;
  controls: React.Component<any>;
  preview: React.Component<any>;
}
