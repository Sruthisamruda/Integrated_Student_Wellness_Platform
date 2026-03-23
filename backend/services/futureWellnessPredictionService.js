/**
 * Future Wellness Prediction (Digital Twin) scoring.
 *
 * Rule-based scoring system that estimates how a student's stress may change
 * over the next ~2–3 days using:
 * - Current hybrid mood
 * - Pending/completed/overdue tasks
 * - Deadlines within 24h and within the next 3 days
 * - Recent relaxation activity usage
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const mapStressScoreToLevel = (score) => {
  if (score < 35) {
    return { stressLevel: 'Low', stageLabel: 'Stable' };
  }
  if (score < 60) {
    return { stressLevel: 'Medium', stageLabel: 'Increasing Stress' };
  }
  return { stressLevel: 'High', stageLabel: 'High Risk' };
};

const getMoodStressOffset = ({ moodCategory, moodScore }) => {
  // Prefer category when available (from hybrid mood mapping),
  // otherwise fall back to numeric score bands.
  const cat = moodCategory || null;
  if (cat === 'Happy / Balanced') return { offset: -10, reason: 'Your current hybrid mood looks steady.' };
  if (cat === 'Calm') return { offset: -6, reason: 'Your current hybrid mood is relatively calm.' };
  if (cat === 'Mild Stress') return { offset: 0, reason: 'Your current mood indicates mild stress.' };
  if (cat === 'Anxious') return { offset: 8, reason: 'Your current mood suggests you may feel anxious.' };
  if (cat === 'Highly Stressed') return { offset: 16, reason: 'Your current mood is highly stressed.' };

  const s = Number.isFinite(moodScore) ? moodScore : 12;
  if (s <= 12) return { offset: -8, reason: 'Your current hybrid mood appears steady.' };
  if (s <= 15) return { offset: -3, reason: 'Your current hybrid mood indicates some stress.' };
  if (s <= 18) return { offset: 4, reason: 'Your current hybrid mood suggests increasing stress.' };
  if (s <= 21) return { offset: 10, reason: 'Your current hybrid mood suggests high stress.' };
  return { offset: 16, reason: 'Your current hybrid mood is near highly stressed.' };
};

const computeScoreAndReasons = (metrics) => {
  const reasons = [];

  const {
    currentMoodCategory,
    currentMoodScore,
    pendingTasks,
    completedTasks,
    overdueTasks,
    deadlinesWithin24h,
    deadlinesWithin3days,
    relaxationRecentCount,
  } = metrics;

  let score = 20;

  // Mood offset
  const mood = getMoodStressOffset({ moodCategory: currentMoodCategory, moodScore: currentMoodScore });
  score += mood.offset;
  // Mood reason is useful even when offsets are small.
  reasons.push(mood.reason);

  // Pending tasks
  if (pendingTasks >= 8) {
    score += 18;
    reasons.push(`High workload: ${pendingTasks} pending tasks.`);
  } else if (pendingTasks >= 5) {
    score += 12;
    reasons.push(`Workload is heavy: ${pendingTasks} pending tasks.`);
  } else if (pendingTasks >= 3) {
    score += 7;
    reasons.push(`You have ${pendingTasks} pending tasks to manage soon.`);
  }

  // Overdue tasks (significant)
  if (overdueTasks >= 3) {
    score += 28;
    reasons.push(`Multiple overdue tasks (${overdueTasks}) are increasing stress.`);
  } else if (overdueTasks >= 2) {
    score += 22;
    reasons.push(`You have ${overdueTasks} overdue tasks, which strongly increases stress.`);
  } else if (overdueTasks >= 1) {
    score += 16;
    reasons.push(`You have ${overdueTasks} overdue task, which can spike stress.`);
  }

  // Deadlines approaching
  if (deadlinesWithin24h >= 2) {
    score += 14;
    reasons.push(`Multiple deadlines approaching in 24 hours (${deadlinesWithin24h}).`);
  } else if (deadlinesWithin24h >= 1) {
    score += 8;
    reasons.push(`Deadline(s) in 24 hours (${deadlinesWithin24h}).`);
  }

  if (deadlinesWithin3days >= 3) {
    score += 12;
    reasons.push(`You also have several deadlines in the next 3 days (${deadlinesWithin3days}).`);
  } else if (deadlinesWithin3days >= 2) {
    score += 8;
    reasons.push(`Upcoming deadlines in the next 3 days (${deadlinesWithin3days}).`);
  } else if (deadlinesWithin3days >= 1) {
    score += 4;
    reasons.push(`An upcoming deadline within 3 days (${deadlinesWithin3days}).`);
  }

  // Completed tasks (reduce stress)
  if (completedTasks >= 4) {
    score -= 10;
    reasons.push(`Recent progress: ${completedTasks} tasks completed recently.`);
  } else if (completedTasks >= 2) {
    score -= 6;
    reasons.push(`You're making progress (${completedTasks} tasks completed recently).`);
  } else if (completedTasks >= 1) {
    score -= 2;
    reasons.push(`You completed at least one task recently.`);
  }

  // Relaxation (reduce stress)
  if (relaxationRecentCount >= 3) {
    score -= 12;
    reasons.push(`Relaxation used recently (${relaxationRecentCount} sessions) is helping.`); // future + past
  } else if (relaxationRecentCount >= 1) {
    score -= 6;
    reasons.push(`You used relaxation recently (${relaxationRecentCount} session${relaxationRecentCount === 1 ? '' : 's'}).`);
  }

  score = clamp(score, 0, 100);
  const { stressLevel, stageLabel } = mapStressScoreToLevel(score);

  return { futureStressScore: score, stressLevel, stageLabel, reasons };
};

const suggestedActionsFor = ({ stressLevel, adjustments, metrics }) => {
  const actions = [];

  const { completeTasksToday = 0, relaxationAdded = 0 } = adjustments || {};

  if (stressLevel === 'High') {
    if (completeTasksToday > 0) {
      actions.push(`Complete ${completeTasksToday} priority task${completeTasksToday > 1 ? 's' : ''} today.`);
    } else {
      actions.push('Complete 1 high-priority task today.');
    }
    if (metrics?.overdueTasks > 0) actions.push('Organize overdue tasks by priority first.');
    actions.push('Take a 10-minute break (walk or stretch).');
    actions.push('Use a short breathing exercise (2–3 minutes).');
    if (relaxationAdded > 0) actions.push(`Add ${relaxationAdded} short relaxation session${relaxationAdded > 1 ? 's' : ''} over the next days.`);
    actions.push('Review your next deadlines and pick the smallest next step.');
    return actions;
  }

  if (stressLevel === 'Medium') {
    if (completeTasksToday > 0) actions.push(`Finish ${completeTasksToday} task${completeTasksToday > 1 ? 's' : ''} to reduce backlog.`);
    actions.push('Take short breaks (10 minutes) between study blocks.');
    actions.push('Try breathing exercise or calming music.');
    if (metrics?.deadlinesWithin24h > 0) actions.push('Prioritize what’s due within 24 hours.');
    if (relaxationAdded > 0) actions.push(`Plan ${relaxationAdded} additional relaxation session${relaxationAdded > 1 ? 's' : ''}.`);
    return actions;
  }

  // Low
  if (completeTasksToday > 0) actions.push(`Keep momentum by completing ${completeTasksToday} task${completeTasksToday > 1 ? 's' : ''}.`);
  actions.push('Maintain your current schedule with small breaks.');
  actions.push('Use relaxation whenever you feel stress rising.');
  if (metrics?.deadlinesWithin24h > 0) actions.push('Check your next 24-hour deadlines to stay on track.');
  return actions;
};

const scenarioDescriptionFor = ({ scenario, stressLevel, adjustments }) => {
  const { completeTasksToday = 0, relaxationAdded = 0 } = adjustments || {};
  if (scenario === 'current') {
    return stressLevel === 'High'
      ? 'If you continue your current schedule, your stress level may rise due to upcoming deadlines and workload.'
      : 'If you keep your current schedule, your stress level may gradually increase due to approaching deadlines.';
  }

  const donePart = completeTasksToday > 0 ? `Complete ${completeTasksToday} task${completeTasksToday > 1 ? 's' : ''} today` : 'Complete a small task today';
  const relaxPart = relaxationAdded > 0 ? `and add ${relaxationAdded} short relaxation session${relaxationAdded > 1 ? 's' : ''}` : 'and take short breaks';
  return `If you follow the improved path (${donePart} ${relaxPart}), your stress level can stay stable.`;
};

const applySimulationAdjustments = ({ baseMetrics, adjustments }) => {
  const a = adjustments || {};
  const completeTasksToday = Number.isFinite(a.completeTasksToday) ? Math.max(0, Math.floor(a.completeTasksToday)) : 0;
  const relaxationAdded = Number.isFinite(a.relaxationAdded) ? Math.max(0, Math.floor(a.relaxationAdded)) : 0;

  const pendingTasks = Math.max(0, (baseMetrics.pendingTasks || 0) - completeTasksToday);
  const overdueTasks = Math.max(0, (baseMetrics.overdueTasks || 0) - Math.min(baseMetrics.overdueTasks || 0, completeTasksToday)); // assume you complete overdue first
  const completedTasks = (baseMetrics.completedTasks || 0) + completeTasksToday;
  const relaxationRecentCount = (baseMetrics.relaxationRecentCount || 0) + relaxationAdded;

  return {
    ...baseMetrics,
    pendingTasks,
    overdueTasks,
    completedTasks,
    relaxationRecentCount,
  };
};

/**
 * Predict a single scenario.
 * @param {Object} params
 * @param {'current'|'improved'|'custom'} params.scenario
 * @param {Object} params.baseMetrics - base inputs (from DB)
 * @param {Object} params.adjustments - simulation inputs
 */
const predictScenario = ({ scenario, baseMetrics, adjustments }) => {
  const metrics = applySimulationAdjustments({ baseMetrics, adjustments });
  const { futureStressScore, stressLevel, stageLabel, reasons } = computeScoreAndReasons(metrics);

  // Keep "reasons" focused on the requested keys (deadlines, pending tasks, etc.)
  // but we still include mood as the first driver.
  const suggestedActions = suggestedActionsFor({ stressLevel, adjustments, metrics });
  const scenarioDescription = scenarioDescriptionFor({ scenario, stressLevel, adjustments });

  return {
    scenario,
    futureStressScore,
    predictedStressLevel: stressLevel,
    predictedStressStage: stageLabel,
    reasons,
    suggestedActions,
    scenarioDescription,
  };
};

module.exports = {
  mapStressScoreToLevel,
  predictScenario,
  applySimulationAdjustments,
};

