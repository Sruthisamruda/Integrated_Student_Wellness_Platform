/**
 * Emoji mood selector: user picks one mood value to submit.
 */

const MOODS = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'anxious', emoji: '😟', label: 'Anxious' },
  { value: 'sad', emoji: '😢', label: 'Sad' },
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
];

export default function MoodPicker({ value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        justifyContent: 'center',
      }}
    >
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          aria-pressed={value === m.value}
          title={m.label}
          style={{
            padding: '0.75rem',
            fontSize: '1.75rem',
            border: value === m.value ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: value === m.value ? 'var(--color-primary-soft)' : 'var(--color-surface)',
            cursor: 'pointer',
            transition: 'all var(--transition)',
            boxShadow: value === m.value ? 'var(--shadow-sm)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (value !== m.value) {
              e.currentTarget.style.background = 'var(--color-primary-soft)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (value !== m.value) {
              e.currentTarget.style.background = 'var(--color-surface)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }
          }}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  );
}
