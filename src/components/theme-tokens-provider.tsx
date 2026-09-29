import * as React from 'react';

/**
 * Injects CSS custom properties for token overrides at a subtree level.
 * Distinct from light/dark `ThemeProvider` in `contexts/ThemeContext` (used by Toaster, navbar, etc.).
 */

export interface ThemeConfig {
  [key: string]: string | number;
}

export interface ThemeTokensProviderProps {
  theme?: ThemeConfig;
  children: React.ReactNode;
  className?: string;
}

export function ThemeTokensProvider({ theme, children, className }: ThemeTokensProviderProps) {
  const style = React.useMemo(() => {
    if (!theme) return undefined;

    const cssVars: Record<string, string> = {};
    Object.entries(theme).forEach(([key, value]) => {
      const cssKey = key.startsWith('--') ? key : `--${key}`;
      cssVars[cssKey] = String(value);
    });

    return cssVars as React.CSSProperties;
  }, [theme]);

  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}

/** Read/write design tokens on `document.documentElement` (not light/dark app theme). */
export function useThemeTokens() {
  const getTokenValue = React.useCallback((tokenName: string) => {
    const cssVarName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
    return getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();
  }, []);

  const setTokenValue = React.useCallback((tokenName: string, value: string) => {
    const cssVarName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
    document.documentElement.style.setProperty(cssVarName, value);
  }, []);

  return {
    getTokenValue,
    setTokenValue,
  };
}
