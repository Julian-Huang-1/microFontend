import { ThemeStyles } from "../types/theme";
import { useThemePresetStore } from "../stores/theme-preset-store";
import { defaultThemeState } from "@/config/themes";

export function getPresetThemeStyles(name: string): ThemeStyles {
  const defaultTheme = defaultThemeState.styles;
  if (name === "default") {
    return defaultTheme;
  }

  const store = useThemePresetStore.getState();
  const preset = store.getPreset(name);
  if (!preset) {
    return defaultTheme;
  }

  return {
    light: {
      ...defaultTheme.light,
      ...(preset.styles.light || {}),
    },
    dark: {
      ...defaultTheme.dark,
      // dark优先，没的取light
      ...(preset.styles.light || {}),
      ...(preset.styles.dark || {}),
    },
  };
}
