import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { apiRequest } from '../api';

const MOOD_TAGS = ['Calm', 'Happy', 'Stressed', 'Angry', 'Tired'];
const REPLAY_SPEEDS = [
  { key: 1, label: '1x' },
  { key: 2, label: '2x' },
];

const BRUSH_SIZES = { small: 5, medium: 10, large: 18 };

const COLORS = [
  { label: 'Black',  value: '#111827' },
  { label: 'Grey',   value: '#6b7280' },
  { label: 'Red',    value: '#ef4444' },
  { label: 'Green',  value: '#22c55e' },
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Orange', value: '#f97316' },
];

const CANVAS_W = 900;
const CANVAS_H = 520;
const MAX_SNAPSHOTS = 30;

// Capture points efficiently while keeping a smooth replay/drawing feel.
const MIN_DIST_RECORD_PX = 1.2;
const MAX_POINTS = 4500;
const SMOOTH_STEP_PX = 4; // interpolation step length during drawing
const MIN_SUBMIT_POINTS = 6;

const moodColors = {
  'Highly Stressed': { bg: 'rgba(239, 68, 68, 0.14)', fg: '#ef4444', border: 'rgba(239, 68, 68, 0.30)' },
  Stressed: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' },
  Angry: { bg: 'rgba(244, 63, 94, 0.12)', fg: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)' },
  Tired: { bg: 'rgba(251, 191, 36, 0.16)', fg: '#f59e0b', border: 'rgba(251, 191, 36, 0.28)' },
  Calm: { bg: 'rgba(34, 197, 94, 0.14)', fg: '#22c55e', border: 'rgba(34, 197, 94, 0.28)' },
  Happy: { bg: 'rgba(59, 130, 246, 0.12)', fg: '#3b82f6', border: 'rgba(59, 130, 246, 0.22)' },
  Neutral: { bg: 'rgba(148, 163, 184, 0.18)', fg: '#64748b', border: 'rgba(148, 163, 184, 0.35)' },
};

function cloneImageData(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  return new ImageData(new Uint8ClampedArray(src.data), w, h);
}

// As requested: average segment speed = distance / time (per consecutive point pair).
function calculateAverageSpeed(points) {
  let totalSpeed = 0;
  let count = 0;

  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const dt = points[i].timestamp - points[i - 1].timestamp;

    if (dt > 0) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = distance / dt;
      totalSpeed += speed;
      count += 1;
    }
  }

  return count ? totalSpeed / count : 0;
}

function inferMood({ speed, density }) {
  if (speed > 0.8 && density > 0.7) return 'Highly Stressed';
  if (speed > 0.6) return 'Stressed';
  if (speed < 0.3 && density < 0.4) return 'Tired';
  if (speed < 0.4) return 'Calm';
  return 'Neutral';
}

function reasonFromSpeed(normalizedSpeed) {
  if (normalizedSpeed > 0.6) return 'High drawing speed detected → possible stress';
  return 'Drawing speed appears lower → steadier state';
}

const computeMetricsAndMood = ({ strokes, emotionTag }) => {
  if (!Array.isArray(strokes) || strokes.length < 2) {
    const inferredMood = emotionTag || 'Calm';
    return {
      inferredMood,
      metrics: { speed: 0, density: 0 },
      reason: reasonFromSpeed(0),
    };
  }

  const avgSpeed = calculateAverageSpeed(strokes);
  const normalizedSpeed = Math.min(avgSpeed / 1.5, 1);
  const density = Math.min(strokes.length / 500, 1);

  const detectedMood = inferMood({ speed: normalizedSpeed, density });
  const inferredMood = emotionTag ? emotionTag : detectedMood;

  return {
    inferredMood,
    metrics: { speed: normalizedSpeed, density },
    reason: reasonFromSpeed(normalizedSpeed),
  };
};

export default function DoodleCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const strokesRef = useRef([]); // [{x,y,timestamp}]
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const didMoveRef = useRef(false);

  // Snapshot stack for undo/redo
  const snapshotStackRef = useRef([]);
  const snapshotIndexRef = useRef(0);

  const replayRafRef = useRef(null);
  const isReplayingRef = useRef(false);
  const replaySpeedRef = useRef(1);
  const strokeCountRafRef = useRef(null);
  const strokeCountPendingRef = useRef(0);

  // Tool state
  const [color, setColor] = useState(COLORS[0].value);
  const [brushSizeKey, setBrushSizeKey] = useState('medium');
  const [tool, setTool] = useState('brush'); // brush | eraser
  const brushSize = BRUSH_SIZES[brushSizeKey];

  // Optional: if set, it overrides inferredMood (as requested).
  const [emotionTag, setEmotionTag] = useState('');
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [isReplaying, setIsReplaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null); // { title, type }
  const [strokeCount, setStrokeCount] = useState(0);
  const [, bumpUndoUi] = useState(0);

  const refreshUndoUi = () => bumpUndoUi((n) => n + 1);

  const selectedColor = moodColors[result?.inferredMood]?.fg ?? '#111827';

  const moodBadgeStyle = useMemo(() => {
    const mood = result?.inferredMood;
    if (!mood) return null;
    return moodColors[mood] ?? null;
  }, [result?.inferredMood]);

  const showToast = (title, type = 'success') => {
    setToast({ title, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  // Push a full-canvas snapshot onto the undo stack
  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const clone = cloneImageData(ctx, CANVAS_W, CANVAS_H);
    let stack = snapshotStackRef.current;
    let idx = snapshotIndexRef.current;
    // Trim forward history when new stroke is drawn after undo
    stack = stack.slice(0, idx + 1);
    stack.push(clone);
    while (stack.length > MAX_SNAPSHOTS) stack.shift();
    snapshotStackRef.current = stack;
    snapshotIndexRef.current = stack.length - 1;
    refreshUndoUi();
  }, []);

  const undo = () => {
    const stack = snapshotStackRef.current;
    let idx = snapshotIndexRef.current;
    if (idx <= 0) return;
    idx -= 1;
    snapshotIndexRef.current = idx;
    const ctx = ctxRef.current;
    if (ctx) ctx.putImageData(stack[idx], 0, 0);
    setResult(null);
    setError('');
    refreshUndoUi();
  };

  const redo = () => {
    const stack = snapshotStackRef.current;
    let idx = snapshotIndexRef.current;
    if (idx >= stack.length - 1) return;
    idx += 1;
    snapshotIndexRef.current = idx;
    const ctx = ctxRef.current;
    if (ctx) ctx.putImageData(stack[idx], 0, 0);
    setResult(null);
    setError('');
    refreshUndoUi();
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    // Stop replay immediately.
    if (replayRafRef.current) {
      cancelAnimationFrame(replayRafRef.current);
      replayRafRef.current = null;
    }
    if (strokeCountRafRef.current) {
      cancelAnimationFrame(strokeCountRafRef.current);
      strokeCountRafRef.current = null;
    }
    isReplayingRef.current = false;
    setIsReplaying(false);

    strokesRef.current = [];
    lastPointRef.current = null;
    lastTimestampRef.current = null;
    didMoveRef.current = false;

    ctxRef.current.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Reinitialise snapshot stack to a blank state
    const blankSnapshot = cloneImageData(ctxRef.current, CANVAS_W, CANVAS_H);
    snapshotStackRef.current = [blankSnapshot];
    snapshotIndexRef.current = 0;

    setError('');
    setResult(null);
    setStrokeCount(0);
    refreshUndoUi();
  };

  const scheduleStrokeCountUpdate = () => {
    strokeCountPendingRef.current = strokesRef.current.length;
    if (strokeCountRafRef.current) return;
    strokeCountRafRef.current = requestAnimationFrame(() => {
      strokeCountRafRef.current = null;
      setStrokeCount(strokeCountPendingRef.current);
    });
  };

  const getPointFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = e.touches ? e.touches[0]?.clientX : e.clientX;
    const cy = e.touches ? e.touches[0]?.clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  };

  const drawSegment = (from, to, { width, color: strokeColor, ctx, eraser }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

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

    // For taps (dist ~ 0), draw a small dot.
    if (dist < 0.8) {
      ctx.beginPath();
      ctx.arc(to.x, to.y, Math.max(2, width / 2), 0, Math.PI * 2);
      if (!eraser) {
        ctx.fillStyle = strokeColor;
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    const steps = Math.max(1, Math.ceil(dist / SMOOTH_STEP_PX));
    let prevX = from.x;
    let prevY = from.y;

    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
      prevX = x;
      prevY = y;
    }

    ctx.restore();
  };

  const startReplay = () => {
    const pts = strokesRef.current;
    if (!pts || pts.length < MIN_SUBMIT_POINTS) {
      setError('Draw a bit more before replaying.');
      return;
    }
    if (!canvasRef.current || !ctxRef.current) return;
    if (isReplayingRef.current) return;

    isReplayingRef.current = true;
    setIsReplaying(true);
    setError('');

    // Freeze speed multiplier in a ref to avoid capturing stale state.
    replaySpeedRef.current = replaySpeed;

    const ctx = ctxRef.current;
    const replayColor = '#111827';
    const replayWidth = 10;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const baseTs = pts[0].timestamp;
    const startNow = performance.now();

    let lastDrawnIndex = 0;

    const step = () => {
      if (!isReplayingRef.current) return;

      const now = performance.now();
      const elapsedMs = now - startNow;
      const targetTime = (elapsedMs * replaySpeedRef.current);

      const targetAbsTs = baseTs + targetTime;

      // Find newest point whose timestamp has been reached.
      while (lastDrawnIndex + 1 < pts.length && pts[lastDrawnIndex + 1].timestamp <= targetAbsTs) {
        const from = pts[lastDrawnIndex];
        const to = pts[lastDrawnIndex + 1];
        drawSegment(from, to, { width: replayWidth, color: replayColor, ctx, eraser: false });
        lastDrawnIndex += 1;
      }

      if (lastDrawnIndex >= pts.length - 1) {
        isReplayingRef.current = false;
        setIsReplaying(false);
        return;
      }

      replayRafRef.current = requestAnimationFrame(step);
    };

    replayRafRef.current = requestAnimationFrame(step);
  };

  // Initialise canvas + first blank snapshot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Seed snapshot stack with a blank frame
    const blankSnapshot = cloneImageData(ctx, CANVAS_W, CANVAS_H);
    snapshotStackRef.current = [blankSnapshot];
    snapshotIndexRef.current = 0;
    refreshUndoUi();

    return () => {
      if (replayRafRef.current) cancelAnimationFrame(replayRafRef.current);
      if (strokeCountRafRef.current) cancelAnimationFrame(strokeCountRafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const toolRef = useRef(tool);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { toolRef.current = tool; }, [tool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const onPointerDown = (e) => {
      if (submitting) return;
      if (isReplayingRef.current) return;
      e.preventDefault();

      setError('');
      setResult(null);

      isDrawingRef.current = true;
      didMoveRef.current = false;

      const pt = getPointFromEvent(e);
      if (!pt) return;

      const t = performance.now();
      strokesRef.current.push({ x: pt.x, y: pt.y, timestamp: t });
      setStrokeCount(strokesRef.current.length);
      lastPointRef.current = { x: pt.x, y: pt.y };
      lastTimestampRef.current = t;

      // Draw an initial dot immediately for responsiveness.
      drawSegment(
        { x: pt.x, y: pt.y },
        { x: pt.x, y: pt.y },
        { width: brushSizeRef.current, color: colorRef.current, ctx, eraser: toolRef.current === 'eraser' }
      );
    };

    const onPointerMove = (e) => {
      if (!isDrawingRef.current) return;
      if (submitting) return;
      if (isReplayingRef.current) return;
      e.preventDefault();

      const last = lastPointRef.current;
      const lastT = lastTimestampRef.current;
      if (!last || lastT == null) return;

      const pt = getPointFromEvent(e);
      if (!pt) return;

      const t = performance.now();
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) didMoveRef.current = true;

      // Skip tiny jitter to reduce payload size.
      if (dist < MIN_DIST_RECORD_PX && t - lastT < 10) return;

      if (strokesRef.current.length >= MAX_POINTS) {
        // Downsample by dropping every other point when we exceed the cap.
        strokesRef.current = strokesRef.current.filter((_, idx) => idx % 2 === 0);
      }

      strokesRef.current.push({ x: pt.x, y: pt.y, timestamp: t });
      scheduleStrokeCountUpdate();

      drawSegment(
        last,
        { x: pt.x, y: pt.y },
        { width: brushSizeRef.current, color: colorRef.current, ctx, eraser: toolRef.current === 'eraser' }
      );

      lastPointRef.current = { x: pt.x, y: pt.y };
      lastTimestampRef.current = t;
    };

    const onPointerUp = (e) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      isDrawingRef.current = false;

      // If user only clicked/tapped, ensure we add one more point so replay isn't empty.
      if (!didMoveRef.current && lastPointRef.current) {
        const t = performance.now();
        strokesRef.current.push({ x: lastPointRef.current.x, y: lastPointRef.current.y, timestamp: t });
        scheduleStrokeCountUpdate();
      }

      lastPointRef.current = null;
      lastTimestampRef.current = null;

      // Save snapshot for undo/redo after each stroke
      pushSnapshot();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [submitting, pushSnapshot]);

  const handleSubmit = async () => {
    if (submitting) return;
    setError('');

    const strokes = strokesRef.current;
    if (!strokes || strokes.length < MIN_SUBMIT_POINTS) {
      setError('Please doodle something first (a few strokes are enough).');
      return;
    }

    const createdAt = new Date();
    const { inferredMood, metrics, reason } = computeMetricsAndMood({ strokes, emotionTag });

    setSubmitting(true);
    try {
      const payload = {
        strokes,
        emotionTag: emotionTag,
        inferredMood,
        metrics,
        createdAt,
      };

      const data = await apiRequest('/doodle', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const finalMood = data?.inferredMood || inferredMood;
      const message = data?.message || reason;

      setResult({
        emotionTag,
        inferredMood: finalMood,
        metrics: data?.metrics || metrics,
        message,
        createdAt: data?.createdAt || createdAt.toISOString(),
      });

      showToast('Saved doodle entry!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to save doodle entry');
    } finally {
      setSubmitting(false);
    }
  };

  const stack = snapshotStackRef.current;
  const idx = snapshotIndexRef.current;
  const canUndo = idx > 0 && !isReplaying && !submitting;
  const canRedo = idx < stack.length - 1 && !isReplaying && !submitting;
  const canReplay = strokeCount >= MIN_SUBMIT_POINTS && !submitting;
  const badgeBg = moodColors[result?.inferredMood]?.bg ?? 'rgba(0,0,0,0.03)';
  const badgeFg = moodColors[result?.inferredMood]?.fg ?? selectedColor;
  const badgeBorder = moodColors[result?.inferredMood]?.border ?? 'rgba(0,0,0,0.08)';

  return (
    <div className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Doodle Mood Logging</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Draw freely, pick an emotion, then replay your doodle for an instant mood insight.
          </p>
        </div>

        {result?.inferredMood ? (
          <span
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: 999,
              background: badgeBg,
              color: badgeFg,
              border: `1px solid ${badgeBorder}`,
              fontWeight: 800,
              height: 'fit-content',
              alignSelf: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              transition: 'transform var(--transition)',
            }}
            aria-label={`Inferred mood: ${result.inferredMood}`}
          >
            {result.inferredMood}
          </span>
        ) : null}
      </div>

      {toast ? (
        <div
          className="toast"
          role="status"
          style={{
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginTop: '1rem',
            background: 'rgba(39, 103, 73, 0.12)',
            border: '1px solid rgba(39, 103, 73, 0.35)',
            color: '#276749',
            fontWeight: 700,
          }}
        >
          {toast.title}
        </div>
      ) : null}

      {error ? (
        <div className="message-error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      ) : null}

      {/* ── Toolbar ── */}
      <div
        className="card"
        style={{
          marginTop: '1rem',
          marginBottom: '0.75rem',
          padding: '0.75rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Tool: Brush / Eraser */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className={tool === 'brush' ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setTool('brush')}
            disabled={submitting || isReplaying}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            ✏️ Brush
          </button>
          <button
            type="button"
            className={tool === 'eraser' ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setTool('eraser')}
            disabled={submitting || isReplaying}
            style={{ padding: '0.35rem 0.75rem' }}
          >
            🧹 Eraser
          </button>
        </div>

        {/* Divider */}
        <span style={{ width: 1, height: 28, background: 'var(--color-border)', flexShrink: 0 }} />

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            ↩ Undo
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            style={{ padding: '0.35rem 0.65rem' }}
          >
            ↪ Redo
          </button>
        </div>

        {/* Divider */}
        <span style={{ width: 1, height: 28, background: 'var(--color-border)', flexShrink: 0 }} />

        {/* Brush size */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Size</span>
          {Object.entries(BRUSH_SIZES).map(([key]) => (
            <button
              key={key}
              type="button"
              className={brushSizeKey === key ? 'btn btn-primary' : 'btn btn-outline'}
              onClick={() => { setBrushSizeKey(key); setTool('brush'); }}
              disabled={submitting || isReplaying}
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
            >
              {key === 'small' ? 'S' : key === 'medium' ? 'M' : 'L'}
            </button>
          ))}
        </div>

        {/* Divider */}
        <span style={{ width: 1, height: 28, background: 'var(--color-border)', flexShrink: 0 }} />

        {/* Colour swatches */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Color</span>
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => { setColor(c.value); setTool('brush'); }}
              disabled={submitting || isReplaying}
              aria-label={c.label}
              aria-pressed={color === c.value && tool === 'brush'}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: c.value,
                border: color === c.value && tool === 'brush'
                  ? '3px solid var(--color-primary)'
                  : '2px solid rgba(0,0,0,0.12)',
                cursor: submitting || isReplaying ? 'not-allowed' : 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'transform 0.1s, border 0.1s',
                transform: color === c.value && tool === 'brush' ? 'scale(1.2)' : 'scale(1)',
                boxShadow: color === c.value && tool === 'brush' ? '0 0 0 2px rgba(30,77,107,0.18)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <span style={{ width: 1, height: 28, background: 'var(--color-border)', flexShrink: 0 }} />

        {/* Clear */}
        <button
          type="button"
          className="btn btn-danger"
          onClick={clearCanvas}
          disabled={submitting || isReplaying}
          style={{ padding: '0.35rem 0.75rem' }}
        >
          🗑 Clear
        </button>
      </div>

      {/* ── Canvas ── */}
      <div className="canvas-shell">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            touchAction: 'none',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          }}
        />
      </div>

      {/* ── Mood tag pills ── */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
          Mood tag (optional). If set, it overrides inference.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MOOD_TAGS.map((tag) => {
            const active = emotionTag === tag;
            return (
              <button
                key={tag}
                type="button"
                className={`mood-pill ${active ? 'mood-pill-active' : ''}`}
                onClick={() => setEmotionTag(active ? '' : tag)}
                disabled={submitting || isReplaying}
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Replay controls ── */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={startReplay} disabled={!canReplay || isReplaying}>
          {isReplaying ? 'Replaying…' : '▶ Replay Drawing'}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {REPLAY_SPEEDS.map((s) => {
            const active = replaySpeed === s.key;
            return (
              <button
                key={s.key}
                type="button"
                className={active ? 'btn btn-primary' : 'btn btn-outline'}
                onClick={() => setReplaySpeed(s.key)}
                disabled={submitting || isReplaying}
                style={{ paddingLeft: '0.8rem', paddingRight: '0.8rem' }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Submit ── */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn btn-accent" onClick={handleSubmit} disabled={submitting || isReplaying}>
          {submitting ? (
            <>
              <span className="loading-spinner" aria-hidden style={{ marginRight: '0.4rem' }} />
              Saving…
            </>
          ) : (
            'Save Doodle'
          )}
        </button>

        <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
          Tip: draw 5–10 seconds for better inference.
        </span>
      </div>

      {/* ── Result card ── */}
      {result ? (
        <div style={{ marginTop: '1.25rem' }}>
          <div className="result-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 900 }}>
                  Smart feedback
                </div>
                <div style={{ marginTop: '0.35rem', lineHeight: 1.7, fontWeight: 650, color: '#0f172a' }}>
                  {result.message}
                </div>
              </div>
              <div style={{ minWidth: 220 }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                  Metrics
                </div>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}>Speed (normalized):</span>{' '}
                    <span style={{ fontWeight: 900 }}>{(result.metrics?.speed ?? 0).toFixed(3)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}>Density:</span>{' '}
                    <span style={{ fontWeight: 900 }}>{(result.metrics?.density ?? 0).toFixed(3)}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}> (0..1)</span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                    Emotion tag saved: {result.emotionTag || 'None'}
                  </div>
                </div>
              </div>
            </div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Your dashboard will reflect this mood. Refresh the dashboard to see it.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
