import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  getDaysInMonth,
  getDay,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { DiaryEntry, MOODS } from '../hooks/useDiaryState';

interface EmotionReportProps {
  entries: DiaryEntry[];
  showInterstitialAd: (callback: { onDismiss?: () => void }) => void;
}

const UNLOCK_KEY = 'emotion_report_unlocked_at';
const UNLOCK_DURATION = 3 * 60 * 60 * 1000; // 3시간

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const isReportUnlocked = (): boolean => {
  try {
    const unlockedAt = localStorage.getItem(UNLOCK_KEY);
    if (!unlockedAt) return false;
    return Date.now() - parseInt(unlockedAt, 10) < UNLOCK_DURATION;
  } catch {
    return false;
  }
};

const getWeeklySummary = (
  topMood: { label: string } | null,
  recordedDays: number,
): string => {
  if (!topMood) return '이번 주 기록을 시작해 보세요.';

  if (recordedDays === 7) {
    if (topMood.label === '기쁨')
      return '이번 주는 기쁨이 가장 많은 한 주였어요. 7일 모두 기록했어요!';
    if (topMood.label === '슬픔')
      return '힘든 날도 있었지만, 7일 모두 기록한 당신이 멋져요.';
    if (topMood.label === '피곤')
      return '바쁜 한 주였지만 매일 기록을 남겼어요. 대단해요!';
    return `이번 주는 ${topMood.label}이 가장 많았어요. 7일 모두 기록했어요!`;
  }
  if (recordedDays >= 5) {
    if (topMood.label === '기쁨')
      return `기쁜 날이 많은 한 주였어요. ${recordedDays}일이나 기록했어요!`;
    if (topMood.label === '슬픔')
      return '힘든 날이 많았지만, 꾸준히 기록한 당신이 멋져요.';
    return `이번 주는 ${topMood.label}이 가장 많았어요. 꾸준히 기록하고 있어요!`;
  }
  if (recordedDays >= 3) {
    return `이번 주는 ${recordedDays}일 기록했어요. 조금만 더 힘내봐요!`;
  }
  return '이번 주는 조금 쉬어갔네요. 다음 주엔 더 많이 기록해 봐요.';
};

const getMonthlySummary = (
  topMood: { label: string } | null,
  consistencyScore: number,
  prevComparison: {
    recordRateChange: number;
    topMoodChange: number;
  } | null,
): string => {
  const parts: string[] = [];

  if (prevComparison) {
    if (prevComparison.topMoodChange > 0 && topMood?.label === '기쁨') {
      parts.push('지난달보다 기쁜 날이 늘었어요');
    } else if (prevComparison.topMoodChange < 0 && topMood?.label === '슬픔') {
      parts.push('지난달보다 슬픈 날이 줄었어요');
    }

    if (prevComparison.recordRateChange > 0) {
      parts.push('기록 습관이 더 좋아졌어요');
    } else if (prevComparison.recordRateChange < 0) {
      parts.push('기록 횟수가 조금 줄었어요');
    }
  }

  if (parts.length === 0) {
    if (consistencyScore >= 80) {
      parts.push(`이번 달 기록 습관 점수 ${consistencyScore}점! 대단해요`);
    } else if (consistencyScore >= 50) {
      parts.push('꾸준히 기록하고 있어요. 다음 달은 더 높은 점수를 목표로!');
    } else {
      parts.push('다음 달은 더 자주 기록해 봐요');
    }
  }

  return parts.join(', ') + '.';
};

type ReportTab = 'weekly' | 'monthly';

export const EmotionReport = ({
  entries,
  showInterstitialAd,
}: EmotionReportProps) => {
  const [unlocked, setUnlocked] = useState(isReportUnlocked);
  const [reportTab, setReportTab] = useState<ReportTab>('weekly');

  const now = new Date();
  const hasMonthlyData = entries.length >= 30;

  // 주간 리포트 데이터
  const weeklyReport = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekEntries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= weekStart && d <= weekEnd;
    });

    const moodCounts: Record<string, number> = {};
    weekEntries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    const moodDistribution = MOODS.map((m) => ({
      emoji: m.emoji,
      label: m.label,
      count: moodCounts[m.emoji] || 0,
      percentage:
        weekEntries.length > 0
          ? Math.round(
              ((moodCounts[m.emoji] || 0) / weekEntries.length) * 100,
            )
          : 0,
    }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count);

    const dayCount: Record<number, number> = {};
    for (let i = 0; i < 7; i++) dayCount[i] = 0;
    weekEntries.forEach((e) => {
      const day = getDay(parseISO(e.date));
      dayCount[day]++;
    });

    let mostActiveDay = 1;
    let leastActiveDay = 1;
    let maxCount = 0;
    let minCount = Infinity;

    for (const [day, count] of Object.entries(dayCount)) {
      const d = parseInt(day);
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = d;
      }
      if (count < minCount) {
        minCount = count;
        leastActiveDay = d;
      }
    }

    const topMood = moodDistribution.length > 0 ? moodDistribution[0] : null;

    return {
      weekStartStr: format(weekStart, 'M월 d일', { locale: ko }),
      weekEndStr: format(weekEnd, 'M월 d일', { locale: ko }),
      moodDistribution,
      recordedDays: weekEntries.length,
      mostActiveDay: DAY_NAMES[mostActiveDay],
      leastActiveDay: DAY_NAMES[leastActiveDay],
      summary: getWeeklySummary(topMood, weekEntries.length),
    };
  }, [entries]);

  // 월간 리포트 데이터
  const monthlyReport = useMemo(() => {
    if (!hasMonthlyData) return null;

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const totalDaysInMonth = getDaysInMonth(now);

    const monthEntries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd;
    });

    const moodCounts: Record<string, number> = {};
    monthEntries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    const moodDistribution = MOODS.map((m) => ({
      emoji: m.emoji,
      label: m.label,
      count: moodCounts[m.emoji] || 0,
    }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count);

    const consistencyScore = Math.round(
      (monthEntries.length / totalDaysInMonth) * 100,
    );

    const prevMonthDate = subMonths(now, 1);
    const prevMonthStart = startOfMonth(prevMonthDate);
    const prevMonthEnd = endOfMonth(prevMonthDate);
    const prevMonthDays = getDaysInMonth(prevMonthDate);

    const prevMonthEntries = entries.filter((e) => {
      const d = parseISO(e.date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    let prevComparison = null;
    if (prevMonthEntries.length > 0) {
      const prevMoodCounts: Record<string, number> = {};
      prevMonthEntries.forEach((e) => {
        prevMoodCounts[e.mood] = (prevMoodCounts[e.mood] || 0) + 1;
      });

      const prevRate = Math.round(
        (prevMonthEntries.length / prevMonthDays) * 100,
      );

      const moodChanges = MOODS.map((m) => ({
        emoji: m.emoji,
        label: m.label,
        current: moodCounts[m.emoji] || 0,
        previous: prevMoodCounts[m.emoji] || 0,
        diff: (moodCounts[m.emoji] || 0) - (prevMoodCounts[m.emoji] || 0),
      })).filter((m) => m.current > 0 || m.previous > 0);

      const topMoodCurrent =
        moodDistribution.length > 0 ? moodDistribution[0] : null;
      const topMoodCurrentCount = topMoodCurrent
        ? moodCounts[topMoodCurrent.emoji] || 0
        : 0;
      const topMoodPrevCount = topMoodCurrent
        ? prevMoodCounts[topMoodCurrent.emoji] || 0
        : 0;

      prevComparison = {
        moodChanges,
        recordRateChange: consistencyScore - prevRate,
        prevRate,
        topMoodChange: topMoodCurrentCount - topMoodPrevCount,
      };
    }

    const topMood = moodDistribution.length > 0 ? moodDistribution[0] : null;
    const leastMood =
      moodDistribution.length > 1
        ? moodDistribution[moodDistribution.length - 1]
        : null;

    return {
      monthLabel: format(now, 'yyyy년 M월', { locale: ko }),
      moodDistribution,
      topMood,
      leastMood,
      recordedDays: monthEntries.length,
      totalDaysInMonth,
      consistencyScore,
      prevComparison,
      summary: getMonthlySummary(
        topMood,
        consistencyScore,
        prevComparison
          ? {
              recordRateChange: prevComparison.recordRateChange,
              topMoodChange: prevComparison.topMoodChange,
            }
          : null,
      ),
    };
  }, [entries, hasMonthlyData]);

  // 최소 3개 기록 필요
  if (entries.length < 3) return null;

  const handleUnlock = () => {
    showInterstitialAd({
      onDismiss: () => {
        setUnlocked(true);
        try {
          localStorage.setItem(UNLOCK_KEY, String(Date.now()));
        } catch {
          // ignore
        }
      },
    });
  };

  // 잠금 상태
  if (!unlocked) {
    return (
      <div className="emotion-report-card emotion-report-locked">
        <div className="report-header">
          <i className="ri-bar-chart-box-line report-header-icon"></i>
          <h3 className="report-title">나의 감정 리포트</h3>
        </div>
        <p className="report-description">
          이번 주 기록을 분석한 감정 리포트를 확인해 보세요.
        </p>
        <ul className="report-preview-list">
          <li>가장 많이 느낀 감정</li>
          <li>요일별 기록 패턴</li>
          <li>한 주 감정 흐름 요약</li>
        </ul>
        <div className="unlock-section">
          <button className="unlock-btn" onClick={handleUnlock}>
            <span className="ad-badge">AD</span>
            <i className="ri-bar-chart-box-line"></i>
            감정 리포트 확인하기
          </button>
          <p className="ad-notice">광고 시청 후 리포트가 잠금 해제됩니다</p>
        </div>
      </div>
    );
  }

  // 잠금 해제 상태 - 리포트 표시
  return (
    <div className="emotion-report-card emotion-report-unlocked">
      {hasMonthlyData && (
        <div className="report-tab-toggle">
          <button
            className={`report-tab-btn ${reportTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setReportTab('weekly')}
          >
            주간
          </button>
          <button
            className={`report-tab-btn ${reportTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setReportTab('monthly')}
          >
            월간
          </button>
        </div>
      )}

      {reportTab === 'weekly' && weeklyReport && (
        <div className="report-content">
          <h3 className="report-content-title">
            {weeklyReport.weekStartStr} ~ {weeklyReport.weekEndStr} 감정 리포트
          </h3>

          <div className="report-section">
            <h4 className="report-section-title">이번 주의 감정</h4>
            <div className="mood-bars">
              {weeklyReport.moodDistribution.map((m) => (
                <div key={m.emoji} className="mood-bar-item">
                  <span className="mood-bar-label">
                    {m.emoji} {m.label}
                  </span>
                  <div className="mood-bar-track">
                    <div
                      className="mood-bar-fill"
                      style={{ width: `${m.percentage}%` }}
                    ></div>
                  </div>
                  <span className="mood-bar-count">{m.count}일</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h4 className="report-section-title">기록 습관</h4>
            <div className="habit-stats">
              <div className="habit-item">
                <span className="habit-label">기록한 날</span>
                <span className="habit-value">
                  {weeklyReport.recordedDays}일 / 7일
                </span>
              </div>
              <div className="habit-item">
                <span className="habit-label">가장 많이 쓴 요일</span>
                <span className="habit-value">
                  {weeklyReport.mostActiveDay}요일
                </span>
              </div>
              <div className="habit-item">
                <span className="habit-label">가장 적게 쓴 요일</span>
                <span className="habit-value">
                  {weeklyReport.leastActiveDay}요일
                </span>
              </div>
            </div>
          </div>

          <div className="report-summary">
            <p>"{weeklyReport.summary}"</p>
          </div>
        </div>
      )}

      {reportTab === 'monthly' && monthlyReport && (
        <div className="report-content">
          <h3 className="report-content-title">
            {monthlyReport.monthLabel} 감정 리포트
          </h3>

          <div className="report-section">
            <h4 className="report-section-title">이번 달의 감정</h4>
            <div className="habit-stats">
              {monthlyReport.topMood && (
                <div className="habit-item">
                  <span className="habit-label">가장 많이 느낀 감정</span>
                  <span className="habit-value">
                    {monthlyReport.topMood.emoji} {monthlyReport.topMood.label} (
                    {monthlyReport.topMood.count}일)
                  </span>
                </div>
              )}
              {monthlyReport.leastMood && (
                <div className="habit-item">
                  <span className="habit-label">가장 적게 느낀 감정</span>
                  <span className="habit-value">
                    {monthlyReport.leastMood.emoji}{' '}
                    {monthlyReport.leastMood.label} (
                    {monthlyReport.leastMood.count}일)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="report-section">
            <h4 className="report-section-title">기록 습관 점수</h4>
            <div className="consistency-score">
              <span className="score-value">
                {monthlyReport.consistencyScore}점
              </span>
              <span className="score-detail">
                {monthlyReport.totalDaysInMonth}일 중{' '}
                {monthlyReport.recordedDays}일
              </span>
            </div>
          </div>

          {monthlyReport.prevComparison && (
            <div className="report-section">
              <h4 className="report-section-title">지난달과 비교</h4>
              <div className="comparison-list">
                {monthlyReport.prevComparison.moodChanges
                  .slice(0, 3)
                  .map((mc) => (
                    <div key={mc.emoji} className="comparison-item">
                      <span className="comparison-label">
                        {mc.emoji} {mc.label}
                      </span>
                      <span className="comparison-change">
                        {mc.previous}일 → {mc.current}일
                        {mc.diff !== 0 && (
                          <span
                            className={
                              mc.diff > 0 ? 'change-up' : 'change-down'
                            }
                          >
                            {mc.diff > 0 ? ' \u2191' : ' \u2193'}{' '}
                            {Math.abs(mc.diff)}일
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                <div className="comparison-item">
                  <span className="comparison-label">기록률</span>
                  <span className="comparison-change">
                    {monthlyReport.prevComparison.prevRate}% →{' '}
                    {monthlyReport.consistencyScore}%
                    {monthlyReport.prevComparison.recordRateChange !== 0 && (
                      <span
                        className={
                          monthlyReport.prevComparison.recordRateChange > 0
                            ? 'change-up'
                            : 'change-down'
                        }
                      >
                        {monthlyReport.prevComparison.recordRateChange > 0
                          ? ' \u2191'
                          : ' \u2193'}{' '}
                        {Math.abs(
                          monthlyReport.prevComparison.recordRateChange,
                        )}
                        %p
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="report-summary">
            <p>"{monthlyReport.summary}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
