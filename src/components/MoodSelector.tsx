import { MOODS } from '../hooks/useDiaryState';

interface MoodSelectorProps {
  selectedMood: string;
  onSelect: (mood: string) => void;
}

export const MoodSelector = ({ selectedMood, onSelect }: MoodSelectorProps) => {
  return (
    <div className="mood-selector">
      {MOODS.map((mood) => (
        <button
          key={mood.emoji}
          className={`mood-option ${selectedMood === mood.emoji ? 'selected' : ''}`}
          onClick={() => onSelect(mood.emoji)}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
};
