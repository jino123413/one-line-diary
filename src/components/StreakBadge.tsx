interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge = ({ streak }: StreakBadgeProps) => {
  return (
    <div className="streak-badge">
      <i className="ri-fire-fill"></i>
      <span>{streak}일 연속</span>
    </div>
  );
};
