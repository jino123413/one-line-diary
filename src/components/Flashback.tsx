import { DiaryEntry } from '../hooks/useDiaryState';

interface FlashbackProps {
  flashbacks: { label: string; entry: DiaryEntry }[];
}

export const Flashback = ({ flashbacks }: FlashbackProps) => {
  if (flashbacks.length === 0) return null;

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
};
