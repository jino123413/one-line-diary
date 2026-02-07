import { DiaryEntry } from '../hooks/useDiaryState';

interface FlashbackLockedProps {
  flashbacks: { label: string; entry: DiaryEntry }[];
  isUnlocked: boolean;
  onUnlock: () => void;
}

export const FlashbackLocked = ({ flashbacks, isUnlocked, onUnlock }: FlashbackLockedProps) => {
  if (flashbacks.length === 0) return null;

  // 잠금 해제된 상태면 일반 플래시백 표시
  if (isUnlocked) {
    return (
      <section className="flashback-section">
        <h3 className="flashback-title">
          <i className="ri-time-line"></i>
          지난 기억
        </h3>
        {flashbacks.map((fb, index) => (
          <div key={index} className="flashback-card" style={{ marginBottom: index < flashbacks.length - 1 ? 8 : 0 }}>
            <p className="flashback-date">{fb.label}</p>
            <p className="flashback-content">{fb.entry.text}</p>
            <span className="flashback-mood">{fb.entry.mood}</span>
          </div>
        ))}
      </section>
    );
  }

  // 잠금 상태: 미리보기만 표시
  return (
    <section className="flashback-section flashback-locked">
      <h3 className="flashback-title">
        <i className="ri-time-line"></i>
        지난 기억
        <span className="locked-badge">
          <i className="ri-lock-line"></i>
        </span>
      </h3>
      {flashbacks.map((fb, index) => (
        <div key={index} className="flashback-card flashback-preview" style={{ marginBottom: index < flashbacks.length - 1 ? 8 : 0 }}>
          <p className="flashback-date">{fb.label}</p>
          <p className="flashback-content blurred">
            {fb.entry.text.substring(0, 10)}...
          </p>
          <span className="flashback-mood blurred">{fb.entry.mood}</span>
        </div>
      ))}

      <div className="unlock-section">
        <button className="unlock-btn" onClick={onUnlock}>
          <span className="ad-badge">AD</span>
          <i className="ri-lock-unlock-line"></i>
          추억 열기
        </button>
        <p className="ad-notice">광고 보고 과거의 기록을 확인하세요</p>
      </div>
    </section>
  );
};
