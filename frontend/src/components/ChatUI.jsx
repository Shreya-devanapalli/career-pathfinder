import { colors, fonts } from '../styles/theme'

export function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: `1px solid ${selected ? colors.amber : colors.line}`,
        background: selected ? colors.accentSoft : 'transparent',
        color: selected ? colors.amber : colors.paper,
        fontFamily: fonts.mono,
        fontSize: 13,
        cursor: 'pointer',
        margin: '4px 6px 4px 0',
      }}
    >
      {label}
    </button>
  )
}

export function Bubble({ children }) {
  return (
    <div
      style={{
        background: colors.panel,
        border: `1px solid ${colors.line}`,
        borderRadius: '4px 16px 16px 16px',
        padding: '16px 18px',
        color: colors.paper,
        fontFamily: fonts.serif,
        fontSize: 17,
        lineHeight: 1.5,
        maxWidth: 520,
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  )
}

export function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '16px 18px' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.teal,
            animation: `cp-bounce 1.1s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes cp-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function SectionLabel({ text }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 11,
        color: colors.muted,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  )
}

export function Tag({ label, color }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        border: `1px solid ${color}`,
        color,
        borderRadius: 999,
        fontSize: 13,
        fontFamily: fonts.mono,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {label}
    </span>
  )
}
