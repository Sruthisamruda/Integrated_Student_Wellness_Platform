/**
 * Mood Tracker — doodle-based mood logging (/mood).
 * Canvas is the primary input; mood is inferred with lightweight rules and saved via API.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';
import { analyzeDoodleMood, exportCanvasJpeg } from '../utils/doodleMoodDetect';

const BRUSH = { small: 4, medium: 10, large: 18 };
const COLORS = [
  { label: 'Black', value: '#111827' },
  { label: 'Grey', value: '#6b7280' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Yellow', value: '#fbbf24' },
];

const MAX_SNAPSHOTS = 25;

function cloneFullImageData(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  return new ImageData(new Uint8ClampedArray(src.data), w, h);
}

function putFullImageData(ctx, img, w, h) {
  ctx.putImageData(img, 0, 0);
}

export default function MoodTracker() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const snapshotStackRef = useRef([]);
  const snapshotIndexRef = useRef(0);

  const doodleStatsRef = useRef({
    lastPoint: null,
    totalDist: 0,
    totalTime: 0,
    avgSpeedPxPerMs: 0,
  });

  const [brushSizeKey, setBrushSizeKey] = useState('medium');
  const brushSize = BRUSH[brushSizeKey];
  const [color, setColor] = useState(COLORS[0].value);
  const [tool, setTool] = useState('brush');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [, bumpUndoUi] = useState(0);
  const refreshUndoUi = () => bumpUndoUi((n) => n + 1);

  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const clone = cloneFullImageData(ctx, w, h);
    let stack = snapshotStackRef.current;
    let idx = snapshotIndexRef.current;
    stack = stack.slice(0, idx + 1);
    stack.push(clone);
    while (stack.length > MAX_SNAPSHOTS) {
      stack.shift();
    }
    snapshotStackRef.current = stack;
    snapshotIndexRef.current = stack.length - 1;
    refreshUndoUi();
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 920;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snapshotStackRef.current = [cloneFullImageData(ctx, canvas.width, canvas.height)];
    snapshotIndexRef.current = 0;
    refreshUndoUi();
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const undo = () => {
    const stack = snapshotStackRef.current;
    let idx = snapshotIndexRef.current;
    if (idx <= 0) return;
    idx -= 1;
    snapshotIndexRef.current = idx;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) putFullImageData(ctx, stack[idx], canvas.width, canvas.height);
    refreshUndoUi();
    setResult(null);
    setError('');
  };

  const redo = () => {
    const stack = snapshotStackRef.current;
    let idx = snapshotIndexRef.current;
    if (idx >= stack.length - 1) return;
    idx += 1;
    snapshotIndexRef.current = idx;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) putFullImageData(ctx, stack[idx], canvas.width, canvas.height);
    refreshUndoUi();
    setResult(null);
    setError('');
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snapshotStackRef.current = [cloneFullImageData(ctx, canvas.width, canvas.height)];
    snapshotIndexRef.current = 0;
    doodleStatsRef.current = {
      lastPoint: null,
      totalDist: 0,
      totalTime: 0,
      avgSpeedPxPerMs: 0,
    };
    refreshUndoUi();
    setResult(null);
    setError('');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const getPoint = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      const cx = e.touches ? e.touches[0]?.clientX : e.clientX;
      const cy = e.touches ? e.touches[0]?.clientY : e.clientY;
      return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
    };

    let drawing = false;
    let strokeMoved = false;

    const drawSeg = (from, to, eraser, width, strokeColor) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = width;
      if (eraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = strokeColor;
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    };

    const onDown = (e) => {
      e.preventDefault();
      setError('');
      setResult(null);
      drawing = true;
      strokeMoved = false;
      const p = getPoint(e);
      doodleStatsRef.current.lastPoint = { ...p, t: performance.now() };
    };

    const onMove = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const last = doodleStatsRef.current.lastPoint;
      if (!last) return;
      const p = getPoint(e);
      const t = performance.now();
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) strokeMoved = true;
      const dt = Math.max(1, t - last.t);
      const st = doodleStatsRef.current;
      st.totalDist += dist;
      st.totalTime += dt;
      st.avgSpeedPxPerMs = st.totalDist / Math.max(1, st.totalTime);
      drawSeg(last, p, tool === 'eraser', brushSize, color);
      st.lastPoint = { ...p, t };
    };

    const onUp = (e) => {
      if (!drawing) return;
      e.preventDefault();
      drawing = false;
      doodleStatsRef.current.lastPoint = null;
      if (strokeMoved) pushSnapshot();
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [tool, brushSize, color, pushSnapshot]);

  const stack = snapshotStackRef.current;
  const idx = snapshotIndexRef.current;
  const canUndo = idx > 0;
  const canRedo = idx < stack.length - 1;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) throw new Error('Canvas not ready');

      const { moodCategory, metrics } = analyzeDoodleMood({
        ctx,
        canvas,
        doodleStats: doodleStatsRef.current,
      });

      if (metrics.coverageRatio < 0.004) {
        setError('Draw something on the canvas before submitting.');
        return;
      }

      const doodleImage = exportCanvasJpeg(canvas, 0.75);
      const data = await apiRequest('/mood/doodle-log', {
        method: 'POST',
        body: JSON.stringify({ doodleImage, moodCategory }),
      });

      setResult({
        moodCategory: data.moodCategory || moodCategory,
        message: data.message || `Your drawing indicates: ${moodCategory}`,
        suggestedActivities: data.suggestedActivities || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to save mood');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'linear-gradient(180deg, #f4f7fb 0%, #eef3f8 45%, #f8fafc 100%)',
        margin: '-0.5rem',
        padding: '1.5rem 1rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.35rem', fontWeight: 800 }}>Mood Tracker</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
          Express how you feel by drawing. We&apos;ll read colors, density, and coverage to suggest a mood and wellness tips.
        </p>

        {error ? (
          <div className="message-error" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              borderRadius: '16px',
              padding: '12px',
              background: 'linear-gradient(145deg, #ffffff 0%, #f0f4f8 100%)',
              boxShadow: '0 12px 40px rgba(30, 77, 107, 0.12), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 'min(92vw, 920px)',
                height: 'auto',
                borderRadius: '10px',
                touchAction: 'none',
                background: 'rgba(255,255,255,0.35)',
              }}
            />
          </div>
        </div>

        <div
          className="card"
          style={{
            maxWidth: 920,
            margin: '0 auto',
            boxShadow: 'var(--shadow)',
            border: '1px solid rgba(30, 77, 107, 0.08)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Tools</span>
            <button type="button" className={tool === 'brush' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTool('brush')} disabled={submitting}>
              Brush
            </button>
            <button type="button" className={tool === 'eraser' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTool('eraser')} disabled={submitting}>
              Eraser
            </button>
            <button type="button" className="btn btn-outline" onClick={undo} disabled={!canUndo || submitting}>
              Undo
            </button>
            <button type="button" className="btn btn-outline" onClick={redo} disabled={!canRedo || submitting}>
              Redo
            </button>
            <button type="button" className="btn btn-danger" onClick={clearCanvas} disabled={submitting}>
              Clear canvas
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Brush size</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'small', label: 'Small' },
                { key: 'medium', label: 'Medium' },
                { key: 'large', label: 'Large' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={brushSizeKey === key ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => setBrushSizeKey(key)}
                  disabled={tool === 'eraser' || submitting}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Colors</div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={color === c.value && tool === 'brush' ? 'btn btn-primary' : 'btn btn-outline'}
                  onClick={() => {
                    setColor(c.value);
                    setTool('brush');
                  }}
                  disabled={tool === 'eraser' || submitting}
                  style={{ borderRadius: 999, padding: '0.35rem 0.75rem' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: c.value,
                      marginRight: 8,
                      verticalAlign: 'middle',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                    }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="btn btn-primary" style={{ minWidth: 200 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit mood'}
          </button>

          {result ? (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                background: 'var(--color-primary-soft)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{result.message}</p>
              {result.suggestedActivities?.length > 0 ? (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>Relaxation ideas</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.65 }}>
                    {result.suggestedActivities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Your dashboard will use this as your latest mood. Refresh the dashboard to see it there.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
