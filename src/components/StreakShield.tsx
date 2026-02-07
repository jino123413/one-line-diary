interface StreakShieldProps {
  streak: number;
  targetDate: string;
  onWatch: () => void;
  onDismiss: () => void;
}

export const StreakShield = ({ streak, targetDate, onWatch, onDismiss }: StreakShieldProps) => {
  return (
    <div className="streak-shield-overlay">
      <div className="streak-shield-modal">
        <button className="shield-close" onClick={onDismiss}>
          <i className="ri-close-line"></i>
        </button>

        <div className="shield-icon">⚠️</div>

        <h3 className="shield-title">
          <span className="streak-count">{streak}일</span> 연속 기록이<br/>
          끊어질 위기예요!
        </h3>

        <p className="shield-description">
          어제 일기를 쓰지 않았어요.<br/>
          지금 광고를 보면 어제 일기를 쓸 수 있어요.
        </p>

        <div className="shield-streak-preview">
          <div className="streak-fire">
            <i className="ri-fire-fill"></i>
            <span>{streak}일</span>
          </div>
          <i className="ri-arrow-right-line"></i>
          <div className="streak-danger">
            <i className="ri-close-circle-fill"></i>
            <span>0일</span>
          </div>
        </div>

        <button className="shield-btn" onClick={onWatch}>
          <span className="ad-badge">AD</span>
          <i className="ri-shield-check-line"></i>
          연속 기록 지키기
        </button>
        <p className="ad-notice">광고 시청 후 어제 날짜로 일기를 쓸 수 있어요</p>
      </div>
    </div>
  );
};
