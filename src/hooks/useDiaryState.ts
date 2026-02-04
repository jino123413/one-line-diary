import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, subYears, subMonths, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  mood: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DiaryStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  moodCounts: Record<string, number>;
}

const STORAGE_KEY = 'ONE_LINE_DIARY_ENTRIES';

const loadEntries = (): DiaryEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveEntries = (entries: DiaryEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const useDiaryState = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveEntries(entries);
    }
  }, [entries, isLoaded]);

  const addEntry = useCallback((date: string, text: string, mood: string) => {
    const newEntry: DiaryEntry = {
      id: `${date}-${Date.now()}`,
      date,
      text: text.trim(),
      mood,
      createdAt: new Date().toISOString(),
    };

    setEntries(prev => {
      // Remove existing entry for the same date
      const filtered = prev.filter(e => e.date !== date);
      return [...filtered, newEntry].sort((a, b) => b.date.localeCompare(a.date));
    });

    return newEntry;
  }, []);

  const updateEntry = useCallback((id: string, text: string, mood: string) => {
    setEntries(prev => prev.map(entry =>
      entry.id === id
        ? { ...entry, text: text.trim(), mood, updatedAt: new Date().toISOString() }
        : entry
    ));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const getEntryByDate = useCallback((date: string): DiaryEntry | undefined => {
    return entries.find(e => e.date === date);
  }, [entries]);

  const getFlashbacks = useCallback((currentDate: string) => {
    const flashbacks: { label: string; entry: DiaryEntry }[] = [];

    try {
      const current = parseISO(currentDate);
      if (!isValid(current)) return flashbacks;

      const oneYearAgo = format(subYears(current, 1), 'yyyy-MM-dd');
      const oneMonthAgo = format(subMonths(current, 1), 'yyyy-MM-dd');

      const yearEntry = entries.find(e => e.date === oneYearAgo);
      const monthEntry = entries.find(e => e.date === oneMonthAgo);

      if (yearEntry) {
        flashbacks.push({
          label: format(parseISO(yearEntry.date), 'yyyy년 M월 d일', { locale: ko }),
          entry: yearEntry
        });
      }

      if (monthEntry) {
        flashbacks.push({
          label: format(parseISO(monthEntry.date), 'M월 d일', { locale: ko }),
          entry: monthEntry
        });
      }
    } catch {
      // Invalid date
    }

    return flashbacks;
  }, [entries]);

  const getEntriesForMonth = useCallback((year: number, month: number): Set<number> => {
    const daysWithEntries = new Set<number>();
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    entries.forEach(entry => {
      if (entry.date.startsWith(monthStr)) {
        const day = parseInt(entry.date.split('-')[2], 10);
        daysWithEntries.add(day);
      }
    });

    return daysWithEntries;
  }, [entries]);

  const calculateStats = useCallback((): DiaryStats => {
    const stats: DiaryStats = {
      totalEntries: entries.length,
      currentStreak: 0,
      longestStreak: 0,
      moodCounts: {},
    };

    // Count moods
    entries.forEach(entry => {
      stats.moodCounts[entry.mood] = (stats.moodCounts[entry.mood] || 0) + 1;
    });

    // Calculate streaks
    const sortedDates = [...entries]
      .map(e => e.date)
      .sort()
      .reverse();

    if (sortedDates.length === 0) return stats;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    // Current streak
    let currentStreak = 0;
    let checkDate = today;

    // Check if today or yesterday has an entry
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      checkDate = sortedDates[0];

      for (let i = 0; i < sortedDates.length; i++) {
        if (sortedDates[i] === checkDate) {
          currentStreak++;
          const prevDate = new Date(checkDate);
          prevDate.setDate(prevDate.getDate() - 1);
          checkDate = format(prevDate, 'yyyy-MM-dd');
        } else if (sortedDates[i] < checkDate) {
          break;
        }
      }
    }

    stats.currentStreak = currentStreak;

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDateObj = parseISO(sortedDates[i - 1]);
      const prevDateObj = parseISO(sortedDates[i]);
      const diffDays = Math.round((currentDateObj.getTime() - prevDateObj.getTime()) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    stats.longestStreak = Math.max(longestStreak, currentStreak);

    return stats;
  }, [entries]);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate,
    getFlashbacks,
    getEntriesForMonth,
    calculateStats,
  };
};

export const MOODS = [
  { emoji: '\u{1F60A}', label: '\uAE30\uC058' },     // 기쁨
  { emoji: '\u{1F60C}', label: '\uD3C9\uC628' },     // 평온
  { emoji: '\u{1F914}', label: '\uC0DD\uAC01' },     // 생각
  { emoji: '\u{1F622}', label: '\uC2AC\uD514' },     // 슬픔
  { emoji: '\u{1F621}', label: '\uD654\uB0A8' },     // 화남
  { emoji: '\u{1F634}', label: '\uD53C\uACE4' },     // 피곤
];

export const getMoodEmoji = (mood: string): string => {
  return MOODS.find(m => m.emoji === mood)?.emoji || '\u{1F60A}';
};
