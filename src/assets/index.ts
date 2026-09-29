/** Inline SVG data URLs so `<img src>` is always valid in Storybook (empty string breaks images and can confuse the browser). */
const strataWordmarkOnLight = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40"><text x="8" y="26" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#0b0b0c">Strata</text></svg>`,
);

const strataWordmarkOnDark = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40"><text x="8" y="26" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#f4f4f1">Strata</text></svg>`,
);

/** Use on light UI (dark glyph). */
export const StrataLogoLight = `data:image/svg+xml,${strataWordmarkOnLight}`;

/** Use on dark UI (light glyph). */
export const StrataLogoDark = `data:image/svg+xml,${strataWordmarkOnDark}`;
