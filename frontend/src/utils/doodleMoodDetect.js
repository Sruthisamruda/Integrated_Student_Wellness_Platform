/**
 * Lightweight rule-based mood from canvas pixels + drawing stats.
 * Returns moodCategory + stress score 0–100 for debugging.
 */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function analyzeDoodleMood({ ctx, canvas, doodleStats }) {
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const totalPixels = w * h;
  let drawnPixels = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  const DARK_LUMA = 110;
  const BRIGHT_LUMA = 170;
  const ALPHA_THRESHOLD = 10;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a <= ALPHA_THRESHOLD) continue;
    drawnPixels += 1;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma < DARK_LUMA) darkPixels += 1;
    if (luma > BRIGHT_LUMA) brightPixels += 1;
  }

  const coverageRatio = totalPixels ? drawnPixels / totalPixels : 0;
  const darkRatio = drawnPixels ? darkPixels / drawnPixels : 0;
  const brightRatio = drawnPixels ? brightPixels / drawnPixels : 0;

  const avgSpeed = doodleStats?.avgSpeedPxPerMs ?? 0;
  const speedNorm = clamp((avgSpeed - 0.01) / 0.15, 0, 1);

  let stressScore = 0;
  stressScore += darkRatio * 60;
  stressScore += coverageRatio * 55;
  stressScore += speedNorm * 25;
  stressScore -= brightRatio * 25;
  stressScore = clamp(stressScore, 0, 100);

  let moodCategory = 'Calm';
  if (stressScore < 35) moodCategory = 'Calm';
  else if (stressScore < 55) moodCategory = 'Mild Stress';
  else if (stressScore < 75) moodCategory = 'Anxious';
  else moodCategory = 'Highly Stressed';

  return {
    moodCategory,
    stressScore: Math.round(stressScore),
    metrics: {
      darkRatio,
      brightRatio,
      coverageRatio,
      avgSpeedPxPerMs: avgSpeed,
    },
  };
}

export function exportCanvasJpeg(canvas, quality = 0.72) {
  const { width: w, height: h } = canvas;
  const maxW = 480;
  const maxH = 320;
  const scale = Math.min(maxW / w, maxH / h, 1);
  const tw = Math.max(80, Math.round(w * scale));
  const th = Math.max(60, Math.round(h * scale));

  const tmp = document.createElement('canvas');
  tmp.width = tw;
  tmp.height = th;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(canvas, 0, 0, tw, th);
  return tmp.toDataURL('image/jpeg', quality);
}
