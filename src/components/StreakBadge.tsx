interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge = ({ streak }: StreakBadgeProps) => {
  return (
    <div className="streak-badge">
      <i className="ri-fire-fill"></i>
      <span>{streak}\uC77C \uC5F0\uC18D</span>
    </div>
  );
};
