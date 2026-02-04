import { DiaryStats, MOODS } from '../hooks/useDiaryState';

interface StatisticsProps {
  stats: DiaryStats;
}

export const Statistics = ({ stats }: StatisticsProps) => {
  const totalMoodCount = Object.values(stats.moodCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '0 0 20px' }}>
      <div className="stats-section">
        <h3 className="stats-title">\uB098\uC758 \uAE30\uB85D</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">\uCD1D \uAE30\uB85D</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-label">\uD604\uC7AC \uC5F0\uC18D</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.longestStreak}</div>
            <div className="stat-label">\uCD5C\uC7A5 \uC5F0\uC18D</div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3 className="stats-title">\uAC10\uC815 \uD1B5\uACC4</h3>
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
            \uC544\uC9C1 \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694
          </div>
        )}
      </div>

      {stats.totalEntries > 0 && (
        <div className="encouragement" style={{ margin: '8px 0 0' }}>
          <div className="encouragement-icon">
            {stats.currentStreak >= 7 ? '\uD83C\uDF1F' :
             stats.currentStreak >= 3 ? '\uD83D\uDD25' : '\uD83D\uDCAA'}
          </div>
          <p className="encouragement-text">
            {stats.currentStreak >= 7
              ? `\uB300\uB2E8\uD574\uC694! ${stats.currentStreak}\uC77C \uC5F0\uC18D \uAE30\uB85D \uC911!`
              : stats.currentStreak >= 3
              ? `\uC88B\uC544\uC694! ${stats.currentStreak}\uC77C\uC9F8 \uAE30\uB85D \uC911\uC774\uC5D0\uC694`
              : stats.totalEntries === 1
              ? '\uCCAB \uBC88\uC9F8 \uAE30\uB85D\uC744 \uB0A8\uACBC\uC5B4\uC694!'
              : `\uCD1D ${stats.totalEntries}\uAC1C\uC758 \uC18C\uC911\uD55C \uAE30\uB85D\uC774 \uC788\uC5B4\uC694`}
          </p>
        </div>
      )}
    </div>
  );
};
