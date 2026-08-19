/*
 * Career Pathfinder design system.
 * All colours are CSS variables so every page automatically follows
 * the selected light/dark theme.
 */

export const colors = {
  ink: 'var(--cp-bg)',
  panel: 'var(--cp-surface)',
  line: 'var(--cp-border)',
  paper: 'var(--cp-text)',
  muted: 'var(--cp-text-muted)',
  amber: 'var(--cp-accent)',
  teal: 'var(--cp-primary)',
  coral: 'var(--cp-danger)',

  background: 'var(--cp-bg)',
  surface: 'var(--cp-surface)',
  surfaceSoft: 'var(--cp-surface-soft)',
  text: 'var(--cp-text)',
  textSecondary: 'var(--cp-text-secondary)',
  textMuted: 'var(--cp-text-muted)',
  primary: 'var(--cp-primary)',
  primaryDark: 'var(--cp-primary-dark)',
  primarySoft: 'var(--cp-primary-soft)',
  accent: 'var(--cp-accent)',
  accentSoft: 'var(--cp-accent-soft)',
  success: 'var(--cp-success)',
  successSoft: 'var(--cp-success-soft)',
  warning: 'var(--cp-warning)',
  warningSoft: 'var(--cp-warning-soft)',
  danger: 'var(--cp-danger)',
  dangerSoft: 'var(--cp-danger-soft)',
}

export const fonts = {
  serif: "'Manrope', sans-serif",
  sans: "'Plus Jakarta Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

export const page = {
  minHeight: '100vh',
  background: colors.ink,
  color: colors.paper,
  fontFamily: fonts.sans,
  display: 'flex',
  flexDirection: 'column',
}

export const btnPrimary = {
  background: colors.teal,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 9,
  padding: '12px 20px',
  fontFamily: fonts.sans,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background .2s ease, transform .2s ease',
}

export const inputStyle = {
  width: '100%',
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 9,
  padding: '12px 14px',
  color: colors.paper,
  fontSize: 14,
  fontFamily: fonts.sans,
  outline: 'none',
  marginBottom: 14,
}
