/**
 * Emoji mood selector: user picks one mood value to submit.
 * Options map to backend mood values (happy, calm, anxious, sad, neutral, tired, energetic).
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          aria-pressed={value === m.value}
          title={m.label}
          style={{
            padding: '0.6rem',
            fontSize: '1.5rem',
            border: value === m.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: value === m.value ? 'rgba(45, 90, 123, 0.1)' : 'var(--color-surface)',
            cursor: 'pointer',
          }}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  );
}
