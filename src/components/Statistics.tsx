import { DiaryStats, MOODS } from '../hooks/useDiaryState';

interface StatisticsProps {
  stats: DiaryStats;
}

export const Statistics = ({ stats }: StatisticsProps) => {
  const totalMoodCount = Object.values(stats.moodCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '0 0 20px' }}>
      <div className="stats-section">
        <h3 className="stats-title">나의 기록</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">총 기록</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-label">현재 연속</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.longestStreak}</div>
            <div className="stat-label">최장 연속</div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-title">감정 통계</h3>
        {totalMoodCount > 0 ? (
          <div className="mood-stats">
            {MOODS.map((mood) => {
              const count = stats.moodCounts[mood.emoji] || 0;
              return (
                <div key={mood.emoji} className="mood-stat-item">
                  <span className="mood-stat-emoji">{mood.emoji}</span>
                  <span className="mood-stat-count">{count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ADB5BD', fontSize: '14px' }}>
            아직 기록이 없어요
          </div>
        )}
      </div>

      {stats.totalEntries > 0 && (
        <div className="encouragement" style={{ margin: '8px 0 0' }}>
          <div className="encouragement-icon">
            {stats.currentStreak >= 7 ? '🌟' :
             stats.currentStreak >= 3 ? '🔥' : '💪'}
          </div>
          <p className="encouragement-text">
            {stats.currentStreak >= 7
              ? `대단해요! ${stats.currentStreak}일 연속 기록 중!`
              : stats.currentStreak >= 3
              ? `좋아요! ${stats.currentStreak}일째 기록 중이에요`
              : stats.totalEntries === 1
              ? '첫 번째 기록을 남겼어요!'
              : `총 ${stats.totalEntries}개의 소중한 기록이 있어요`}
          </p>
        </div>
      )}

    </div>
  );
};
