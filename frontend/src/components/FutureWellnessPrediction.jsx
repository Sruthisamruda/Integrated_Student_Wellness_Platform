import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

const Spinner = () => (
  <div
    className="loading-wrap"
    style={{
      minHeight: 'unset',
      margin: '0.5rem 0',
    }}
  >
    <div className="loading-spinner" aria-hidden />
    <p>Loading prediction...</p>
  </div>
);

const StressPill = ({ level }) => {
  const color =
    level === 'High'
      ? 'var(--color-error)'
      : level === 'Medium'
        ? '#d97706'
        : '#16a34a';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.6rem',
        borderRadius: '999px',
        background: 'rgba(0,0,0,0.03)',
        border: `1px solid rgba(0,0,0,0.08)`,
        color,
        fontWeight: 700,
      }}
    >
      {level}
    </span>
  );
};

export default function FutureWellnessPrediction() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [baseMetrics, setBaseMetrics] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [improvedScenario, setImprovedScenario] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest('/wellness/future-prediction')
      .then((data) => {
        setBaseMetrics(data?.baseMetrics || null);
        setCurrentScenario(data?.currentScenario || null);
        setImprovedScenario(data?.improvedScenario || null);
      })
      .catch((err) => setError(err.message || 'Failed to load future prediction'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ marginTop: '1rem' }}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Future Wellness Prediction</h3>
        <div className="message-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const improvedTopReasons = (improvedScenario?.reasons || []).slice(0, 5);
  const currentTopReasons = (currentScenario?.reasons || []).slice(0, 5);

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Future Wellness Prediction</h3>
      <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
        Simulates how your stress level may change over the next 2–3 days.
      </p>

      {improvedScenario && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Future Stress Prediction</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
                <StressPill level={improvedScenario.predictedStressLevel} />{' '}
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{improvedScenario.predictedStressStage}</span>
              </div>
                {typeof improvedScenario.futureStressScore === 'number' && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Future Stress Score: <strong style={{ color: 'var(--color-text)' }}>{improvedScenario.futureStressScore}</strong>/100
                  </div>
                )}
            </div>
            {improvedScenario?.scenarioDescription && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: 420 }}>
                {improvedScenario.scenarioDescription}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Current Path</h4>
            {currentScenario?.predictedStressLevel && <StressPill level={currentScenario.predictedStressLevel} />}
          </div>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {currentScenario?.predictedStressStage || ''}
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Key reasons</div>
            {currentTopReasons.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
                {currentTopReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No reasons available yet.</p>
            )}
          </div>
        </div>

        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Improved Path (With Suggestions)</h4>
            {improvedScenario?.predictedStressLevel && <StressPill level={improvedScenario.predictedStressLevel} />}
          </div>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {improvedScenario?.predictedStressStage || ''}
          </p>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Key reasons</div>
            {improvedTopReasons.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
                {improvedTopReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No reasons available yet.</p>
            )}
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Suggested actions</div>
            {(improvedScenario?.suggestedActions || []).length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
                {improvedScenario.suggestedActions.slice(0, 5).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No suggested actions available.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

