/**
 * Dashboard — professional card-based layout with Tailwind + lucide-react.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import FutureWellnessPrediction from '../components/FutureWellnessPrediction';
import {
  ClipboardList,
  BookOpen,
  HeartPulse,
  CalendarDays,
  AlertCircle,
  Smile,
  ChevronRight,
  TrendingUp,
  Activity,
  Stethoscope,
  Layers,
} from 'lucide-react';

// Mood badge color mapping
const MOOD_COLORS = {
  'Happy / Balanced': 'bg-green-100 text-green-700',
  Calm:              'bg-blue-100 text-blue-700',
  'Mild Stress':     'bg-yellow-100 text-yellow-700',
  Anxious:           'bg-orange-100 text-orange-700',
  'Highly Stressed': 'bg-red-100 text-red-700',
  Neutral:           'bg-gray-100 text-gray-600',
};

function MoodBadge({ mood }) {
  const cls = MOOD_COLORS[mood] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cls}`}>
      {mood}
    </span>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-lg font-semibold text-gray-800 mb-4">{children}</h2>;
}

const QUICK_LINKS = [
  {
    to: '/mood-assessment',
    label: 'Mood Assessment',
    desc: 'Answer 5 questions or doodle to log your mood.',
    icon: ClipboardList,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    to: '/study',
    label: 'Study Planner',
    desc: 'Manage assignments and track deadlines.',
    icon: BookOpen,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    to: '/relax',
    label: 'Relaxation',
    desc: 'Breathing exercises and calming resources.',
    icon: HeartPulse,
    color: 'bg-rose-50 text-rose-600',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || user?.email?.split('@')[0] || 'Student').split(' ')[0];
  const navigate = useNavigate();

  const [latestMood, setLatestMood]   = useState(null);
  const [academicStress, setAcademicStress] = useState(null);
  const [weeklyReport, setWeeklyReport]     = useState(null);
  const [dailyPlan, setDailyPlan]           = useState(null);
  const [relaxationInsights, setRelaxationInsights] = useState(null);
  const [upcomingSessions, setUpcomingSessions]       = useState([]);
  const [completedSessions, setCompletedSessions]     = useState([]);

  useEffect(() => {
    apiRequest('/mood/latest')
      .then((d) => setLatestMood(d || null))
      .catch(() => setLatestMood(null));
    apiRequest('/mood/academic-stress')
      .then((d) => setAcademicStress(d || null))
      .catch(() => setAcademicStress(null));
    apiRequest('/mood/weekly-report')
      .then((d) => setWeeklyReport(d || null))
      .catch(() => setWeeklyReport(null));
    apiRequest('/wellness/daily-plan')
      .then((d) => setDailyPlan(d || null))
      .catch(() => setDailyPlan(null));
    apiRequest('/relaxation/effectiveness')
      .then((d) => setRelaxationInsights(d || null))
      .catch(() => setRelaxationInsights(null));
    apiRequest('/student/counselling')
      .then((d) => {
        setUpcomingSessions(d?.upcomingSessions || []);
        setCompletedSessions(d?.completedSessions || []);
      })
      .catch(() => {
        setUpcomingSessions([]);
        setCompletedSessions([]);
      });
  }, []);

  const effectiveMood        = latestMood?.moodCategory || academicStress?.combinedPredictedMood || academicStress?.predictedMood;
  const effectiveSuggestions = latestMood?.suggestedActivities || academicStress?.suggestions || [];
  const doodleMoodTag        = latestMood?.doodleMoodTag || null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Welcome ── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {firstName}</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Track your wellness, manage your schedule, and stay balanced.
        </p>
      </div>

      {/* ── Current Mood ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Current Mood</SectionTitle>
          {latestMood?.source === 'combined'
            ? <Layers size={20} className="text-blue-400" />
            : <Smile size={20} className="text-gray-300" />}
        </div>

        {effectiveMood ? (
          <div className="space-y-2">
            <MoodBadge mood={effectiveMood} />

            {/* ── Combined (questionnaire + doodle) ── */}
            {latestMood?.source === 'combined' ? (
              <>
                <p className="text-sm text-gray-500">
                  Collective analysis from questionnaire &amp; doodle
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {latestMood?.questionnaireContribution != null && (
                    <p className="text-xs text-gray-400">
                      Questionnaire score:
                      <span className="font-medium text-gray-600 ml-1">
                        {latestMood.questionnaireContribution}
                      </span>
                    </p>
                  )}
                  {latestMood?.doodleMoodTag && (
                    <p className="text-xs text-gray-400">
                      Doodle expression:
                      <span className="font-medium text-gray-600 ml-1">
                        {latestMood.doodleMoodTag}
                      </span>
                    </p>
                  )}
                  {latestMood?.hybridScore != null && (
                    <p className="text-xs text-gray-400">
                      Combined wellness score:
                      <span className="font-medium text-gray-600 ml-1">
                        {latestMood.hybridScore}
                      </span>
                    </p>
                  )}
                </div>
              </>
            ) : latestMood?.source === 'doodle_log' && latestMood?.interpretation ? (
              <p className="text-sm text-gray-500">{latestMood.interpretation}</p>
            ) : latestMood?.hybridMoodCategory ? (
              <>
                <p className="text-sm text-gray-500">Based on questionnaire &amp; activity patterns</p>
                {latestMood?.hybridScore != null && (
                  <p className="text-xs text-gray-400">Wellness score: {latestMood.hybridScore}</p>
                )}
                {doodleMoodTag && (
                  <p className="text-xs text-gray-400">
                    Doodle expression: <span className="font-medium">{doodleMoodTag.toLowerCase()}</span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Latest recorded mood</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              No mood logged yet. Complete a mood assessment to get started.
            </p>
            <button
              type="button"
              onClick={() => navigate('/mood-assessment')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Start Assessment
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </Card>

      {/* ── Smart Stress Alerts ── */}
      {academicStress?.alerts?.length > 0 && (
        <Card className="border-l-4 border-l-red-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <h2 className="text-base font-semibold text-gray-800">Smart Stress Alerts</h2>
          </div>
          <div className="space-y-3">
            {academicStress.alerts.map((alert, i) => (
              <div key={i}>
                <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                <div className="flex flex-wrap gap-2">
                  {(alert.recommendedActions || []).slice(0, 4).map((action) => (
                    <Link
                      key={action}
                      to="/relax"
                      className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 no-underline transition-colors"
                    >
                      {action}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Suggested Activities ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Suggested Activities</SectionTitle>
          <Activity size={18} className="text-gray-300" />
        </div>

        {effectiveSuggestions.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {effectiveSuggestions.map((a) => (
              <div
                key={a}
                className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-700 font-medium hover:bg-gray-100 transition-colors text-center"
              >
                {a}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Complete a mood assessment to get personalised suggestions.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/mood-assessment')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Start Mood Assessment
          </button>
          {['Breathing', 'Music & Sounds', 'Walk & Stretch', 'Journal'].map((label) => (
            <Link
              key={label}
              to="/relax"
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 no-underline transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </Card>

      {/* ── Academic Stress ── */}
      {academicStress && (
        <Card>
          <SectionTitle>Academic Stress Snapshot</SectionTitle>
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div>
              <span className="block text-xs text-gray-400 uppercase tracking-wide mb-0.5">Upcoming deadlines (3 days)</span>
              <span className="text-xl font-semibold text-gray-800">{academicStress.upcomingDeadlines}</span>
            </div>
            <div>
              <span className="block text-xs text-gray-400 uppercase tracking-wide mb-0.5">Pending tasks</span>
              <span className="text-xl font-semibold text-gray-800">{academicStress.pendingTasks}</span>
            </div>
          </div>
        </Card>
      )}

      {/* ── Digital Twin ── */}
      <FutureWellnessPrediction />

      {/* ── Counselling Sessions ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope size={18} className="text-blue-500" />
          <SectionTitle>Counselling Sessions</SectionTitle>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Upcoming</p>
            {upcomingSessions.length ? (
              <div className="space-y-2">
                {upcomingSessions.map((s) => (
                  <div key={`${s._id}-${s.dateTime}`} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-gray-700 font-medium">
                        {s.dateTime ? new Date(s.dateTime).toLocaleDateString() : '—'}
                        {s.time ? ` at ${s.time}` : ''}
                      </p>
                      <p className="text-gray-500">{s.mode || '—'}{s.notes ? ` · ${s.notes}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No upcoming sessions.</p>
            )}
          </div>

          {completedSessions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed</p>
              <div className="space-y-2">
                {completedSessions.map((s) => (
                  <div key={`${s._id}-${s.dateTime}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-gray-700 font-medium">
                        {s.dateTime ? new Date(s.dateTime).toLocaleDateString() : '—'}
                        {s.time ? ` at ${s.time}` : ''}
                      </p>
                      <p className="text-gray-500">{s.mode || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Daily Wellness Plan ── */}
      <Card>
        <SectionTitle>Today's Wellness Plan</SectionTitle>
        {dailyPlan?.plan?.length > 0 ? (
          <ul className="space-y-2">
            {dailyPlan.plan.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            Your personalised plan will appear here based on your mood and study planner.
          </p>
        )}
      </Card>

      {/* ── Relaxation Insights ── */}
      <Card>
        <SectionTitle>Relaxation Insights</SectionTitle>
        {relaxationInsights?.insights?.length > 0 ? (
          <ul className="space-y-2">
            {relaxationInsights.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            Log your mood before and after relaxation sessions to see personalised insights.
          </p>
        )}
      </Card>

      {/* ── Mood Calendar CTA ── */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Mood Calendar</h2>
            <p className="text-sm text-gray-500">View your emotional history and track mood trends over time.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mood-calendar')}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <CalendarDays size={15} />
            Open Calendar
          </button>
        </div>
      </Card>

      {/* ── Weekly Report ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">Weekly Wellness Report</h2>
        </div>

        {weeklyReport ? (
          <Card>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Avg Mood Score', value: weeklyReport.averageMoodScore ?? '—' },
                { label: 'Most Stressful Day', value: weeklyReport.mostStressfulDay ?? '—' },
                { label: 'Tasks Completed', value: weeklyReport.completedTasks ?? '—' },
                { label: 'Relaxation Sessions', value: weeklyReport.relaxationActivitiesUsed ?? 0 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-xl font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {weeklyReport.insights?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Insights</p>
                <ul className="space-y-1.5">
                  {weeklyReport.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {weeklyReport.moodTrendByDay?.some((d) => d.avgScore != null) && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Mood by Day</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyReport.moodTrendByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 25]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="avgScore" name="Avg mood score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-gray-400">
              Complete mood assessments and use relaxation activities to see your weekly report.
            </p>
          </Card>
        )}
      </div>

      {/* ── Quick Access ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_LINKS.map(({ to, label, desc, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 no-underline hover:-translate-y-1 hover:shadow-md transition-all duration-150"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* bottom padding */}
      <div className="pb-6" />
    </div>
  );
}
