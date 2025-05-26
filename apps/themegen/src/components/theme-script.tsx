export function ThemeScript(){
  const scriptContent = `(${injectThemeCssVars.toString()})();`

  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}

      //抑制 React 在服务器端渲染 (SSR) 与客户端渲染过程中出现内容不匹配时生成的 hydration 警告。
      suppressHydrationWarning
    />
  );
}


function injectThemeCssVars(){
    const storageKey = "themeGen-editor-theme"
    const root = document.documentElement;
    const defaultLightStyles = `${JSON.stringify(defaultLightThemeStyles)}`
    const defaultDarkStyles = `${JSON.stringify(defaultDarkThemeStyles)}`

    let themeState = null

    try{
        const persistedThemeJSON = localStorage.getItem(storageKey)
        if(persistedThemeJSON){
            themeState = JSON.parse(persistedThemeJSON).state.themeState
        }
    }catch(error){
        console.warn("Theme initialisation: Failed to read/parse localStorage:",error)
    }

    const prefersDark = window.matchMedia("(perfers-color-schema: dark)").matches;

    const mode = themeState?.mode ?? (prefersDark ? "dark" : "light")

    const activeStyles = mode === "dark" ? themeState.styles.dark || defaultDarkStyles:
    themeState.styles.light || defaultLightStyles

    const stylesToApply = Object.keys(defaultLightThemeStyles)

    for(const style of stylesToApply){
        const value = activeStyles[style]
        if(value){
            root.style.setProperty(`--${style}`,value)
        }
    }
    

}