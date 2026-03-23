import { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api';

const BRUSH_SIZES = [3, 6, 10, 14];
const COLOR_PALETTE = [
  { id: 'dark-black', label: 'Black', value: '#111827' },
  { id: 'dark-grey', label: 'Grey', value: '#6b7280' },
  { id: 'dark-red', label: 'Red', value: '#ef4444' },
  { id: 'bright-green', label: 'Green', value: '#22c55e' },
  { id: 'bright-blue', label: 'Blue', value: '#3b82f6' },
  { id: 'bright-yellow', label: 'Yellow', value: '#fbbf24' },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const hexToRgb = (hex) => {
  const h = String(hex).replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  // eslint-disable-next-line no-bitwise
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const computeDoodleTagAndScore = ({ ctx, canvas, doodleStats }) => {
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const totalPixels = w * h;
  let drawnPixels = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  // Heuristic luma thresholds
  const DARK_LUMA = 110; // darker strokes
  const BRIGHT_LUMA = 170; // bright strokes
  const ALPHA_THRESHOLD = 10;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a <= ALPHA_THRESHOLD) continue;

    drawnPixels += 1;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma < DARK_LUMA) darkPixels += 1;
    if (luma > BRIGHT_LUMA) brightPixels += 1;
  }

  const coverageRatio = totalPixels ? drawnPixels / totalPixels : 0;
  const darkRatio = drawnPixels ? darkPixels / drawnPixels : 0;
  const brightRatio = drawnPixels ? brightPixels / drawnPixels : 0;

  // doodleStats includes speed estimate (captured while drawing)
  const avgSpeed = doodleStats?.avgSpeedPxPerMs ?? 0;
  const speedNorm = clamp((avgSpeed - 0.01) / 0.15, 0, 1);

  // Combine signals into a 0–100 score
  let doodleStressScore = 0;
  doodleStressScore += darkRatio * 60;
  doodleStressScore += coverageRatio * 55;
  doodleStressScore += speedNorm * 25;
  doodleStressScore -= brightRatio * 25;
  doodleStressScore = clamp(doodleStressScore, 0, 100);

  let doodleMoodTag = 'Calm';
  if (doodleStressScore < 35) doodleMoodTag = 'Calm';
  else if (doodleStressScore < 55) doodleMoodTag = 'Mild Stress';
  else if (doodleStressScore < 75) doodleMoodTag = 'Anxious';
  else doodleMoodTag = 'Highly Stressed';

  const interpretation =
    doodleMoodTag === 'Highly Stressed'
      ? 'Your drawing shows signs of high stress and strong emotional intensity.'
      : doodleMoodTag === 'Anxious'
        ? 'Your drawing suggests anxiety or emotional pressure.'
        : doodleMoodTag === 'Mild Stress'
          ? 'Your drawing shows mild stress with some emotional tension.'
          : 'Your drawing looks calm and grounded.';

  return {
    doodleStressScore: Math.round(doodleStressScore),
    doodleMoodTag,
    interpretation,
    doodleMetrics: {
      darkRatio,
      brightRatio,
      coverageRatio,
      avgSpeedPxPerMs: avgSpeed,
      avgBrushSizePx: doodleStats?.avgBrushSizePx ?? 0,
    },
  };
};

const suggestedRelaxationForTag = (tag) => {
  if (tag === 'Calm') return ['Light stretching', 'Listen to relaxing music', 'Short walk outside'];
  if (tag === 'Mild Stress') return ['Take a 10 minute break', 'Play a short game', 'Listen to music', 'Talk with a friend'];
  if (tag === 'Anxious') return ['Guided breathing exercise', 'Go for a walk', 'Listen to calming music', 'Reduce today’s study load'];
  return ['Take a longer break away from your desk', 'Go outside for fresh air', 'Try slow breathing exercises', 'Write next small steps in a journal'];
};

const exportCanvasJpegDataUrl = async ({ canvas }) => {
  const { width: w, height: h } = canvas;
  const maxW = 320;
  const maxH = 220;
  const scale = Math.min(maxW / w, maxH / h, 1);
  const targetW = Math.max(80, Math.round(w * scale));
  const targetH = Math.max(60, Math.round(h * scale));

  const tmp = document.createElement('canvas');
  tmp.width = targetW;
  tmp.height = targetH;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(canvas, 0, 0, targetW, targetH);

  // JPEG smaller than PNG
  return tmp.toDataURL('image/jpeg', 0.72);
};

export default function DoodleMoodLogging() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState('brush'); // brush | eraser
  const [brushSize, setBrushSize] = useState(10);
  const [color, setColor] = useState(COLOR_PALETTE[0].value);

  const [saveImage, setSaveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [result, setResult] = useState(null);

  const doodleStatsRef = useRef({
    strokeCount: 0,
    lastPoint: null,
    totalDist: 0,
    totalTime: 0,
    speedSamples: 0,
    sumBrushSize: 0,
    brushSamples: 0,
    avgSpeedPxPerMs: 0,
    avgBrushSizePx: brushSize,
  });

  const paletteStressColors = useMemo(() => {
    // Used only for analysis hints; the real analysis is pixel-based.
    return COLOR_PALETTE.map((c) => ({ ...c, ...hexToRgb(c.value) }));
  }, []);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Internal resolution
    canvas.width = 900;
    canvas.height = 520;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    // Keep transparent background so coverage/density analysis is accurate.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    setupCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const getPoint = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
      const clientY = e.touches ? e.touches[0]?.clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    let isDrawing = false;

    const drawLine = (from, to, isEraser, w, strokeColor) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = w;

      if (isEraser) {
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

    const onPointerDown = (e) => {
      e.preventDefault();
      setError('');
      setResult(null);
      isDrawing = true;

      const stats = doodleStatsRef.current;
      stats.strokeCount += 1;
      stats.lastPoint = { ...getPoint(e), t: performance.now() };

      if (tool === 'brush') {
        stats.sumBrushSize += brushSize;
        stats.brushSamples += 1;
        stats.avgBrushSizePx = stats.sumBrushSize / Math.max(1, stats.brushSamples);
      }
    };

    const onPointerMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault();

      const stats = doodleStatsRef.current;
      const last = stats.lastPoint;
      if (!last) return;

      const pt = getPoint(e);
      const t = performance.now();
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Math.max(1, t - last.t);

      stats.totalDist += dist;
      stats.totalTime += dt;
      stats.speedSamples += 1;
      stats.avgSpeedPxPerMs = stats.totalDist / Math.max(1, stats.totalTime);

      drawLine(last, pt, tool === 'eraser', brushSize, color);
      stats.lastPoint = { ...pt, t };
    };

    const onPointerUp = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      isDrawing = false;
      doodleStatsRef.current.lastPoint = null;
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
  }, [tool, brushSize, color]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    doodleStatsRef.current = {
      strokeCount: 0,
      lastPoint: null,
      totalDist: 0,
      totalTime: 0,
      speedSamples: 0,
      sumBrushSize: 0,
      brushSamples: 0,
      avgSpeedPxPerMs: 0,
      avgBrushSizePx: brushSize,
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) throw new Error('Canvas not ready');

      const analysis = computeDoodleTagAndScore({
        ctx,
        canvas,
        doodleStats: doodleStatsRef.current,
      });

      if (analysis.doodleMetrics.coverageRatio < 0.005) {
        setError('Please doodle something first (a few strokes are enough).');
        setResult(null);
        return;
      }

      let doodleImageDataUrl = '';
      if (saveImage) {
        doodleImageDataUrl = await exportCanvasJpegDataUrl({ canvas });
      }

      const payload = {
        doodleMoodTag: analysis.doodleMoodTag,
        doodleStressScore: analysis.doodleStressScore,
        doodleMetrics: analysis.doodleMetrics,
        doodleImageDataUrl,
      };

      const data = await apiRequest('/mood/doodle-submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setResult({
        doodleMoodTag: data?.doodleMoodTag || analysis.doodleMoodTag,
        interpretation: data?.interpretation || analysis.interpretation,
        suggestedActivities: data?.suggestedActivities || suggestedRelaxationForTag(analysis.doodleMoodTag),
        attachedToQuestionnaire: data?.attachedToQuestionnaire || false,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit doodle mood');
    } finally {
      setSubmitting(false);
    }
  };

  const toolLabel = tool === 'eraser' ? 'Eraser' : `Brush (${brushSize}px)`;

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Express Your Mood (Doodle)</h2>
      <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
        Quick expression. Doodle mood is optional and does not override your questionnaire mood.
      </p>

      {error ? (
        <div className="message-error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      ) : null}

      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginTop: '1rem' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            touchAction: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <button type="button" className={tool === 'brush' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTool('brush')} disabled={submitting}>
          Brush
        </button>
        <button type="button" className={tool === 'eraser' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTool('eraser')} disabled={submitting}>
          Eraser
        </button>
        <button type="button" className="btn btn-danger" onClick={clearCanvas} disabled={submitting}>
          Clear canvas
        </button>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, alignSelf: 'center' }}>{toolLabel}</span>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Brush size</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {BRUSH_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={brushSize === s ? 'btn btn-primary' : 'btn btn-outline'}
                onClick={() => setBrushSize(s)}
                disabled={tool === 'eraser' || submitting}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Color palette</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.id}
                type="button"
                className={color === c.value && tool === 'brush' ? 'btn btn-primary' : 'btn btn-outline'}
                onClick={() => {
                  setColor(c.value);
                  setTool('brush');
                }}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '999px' }}
                disabled={tool === 'eraser' || submitting}
              >
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.value, display: 'inline-block', marginRight: 8 }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--color-text-muted)' }}>
          <input type="checkbox" checked={saveImage} onChange={(e) => setSaveImage(e.target.checked)} disabled={submitting} />
          Save doodle image (optional)
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Analyzing...' : 'Save & Submit Doodle'}
        </button>
      </div>

      {result ? (
        <div
          style={{
            marginTop: '1rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.9rem',
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Doodle mood tag</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.25rem' }}>{result.doodleMoodTag}</div>
            </div>
            {result.attachedToQuestionnaire ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Attached to today’s questionnaire mood.</div>
            ) : null}
          </div>
          <div style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{result.interpretation}</div>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Suggested relaxation activities</div>
            {result.suggestedActivities?.length ? (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
                {result.suggestedActivities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No activities found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

