import { useState, useEffect, useRef } from 'react';
import { format, parseISO, isToday, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDiaryState, MOODS } from './hooks/useDiaryState';
import { useInterstitialAd } from './hooks/useInterstitialAd';
import { Calendar } from './components/Calendar';
import { FlashbackLocked } from './components/FlashbackLocked';
import { MoodSelector } from './components/MoodSelector';
import { StreakBadge } from './components/StreakBadge';
import { Statistics } from './components/Statistics';
import { StreakShield } from './components/StreakShield';

const AD_GROUP_ID = 'ait.v2.live.52ded636ab0a44de';

type Tab = 'write' | 'calendar' | 'stats';

function App() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<Tab>('write');
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOODS[0].emoji);
  const [isEditing, setIsEditing] = useState(false);
  const [flashbackUnlocked, setFlashbackUnlocked] = useState(false);
  const [showStreakShield, setShowStreakShield] = useState(false);
  const [streakShieldUsed, setStreakShieldUsed] = useState(false);
  const [allowYesterdayWrite, setAllowYesterdayWrite] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isLoaded,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryByDate,
    getFlashbacks,
    getEntriesForMonth,
    calculateStats,
  } = useDiaryState();

  // 광고 훅
  const { showInterstitialAd } = useInterstitialAd(AD_GROUP_ID);

  const currentEntry = getEntryByDate(selectedDate);
  const flashbacks = getFlashbacks(selectedDate);
  const stats = calculateStats();
  const isSelectedToday = isToday(parseISO(selectedDate));

  // 연속 기록 위기 감지
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const hasYesterdayEntry = getEntryByDate(yesterday);
  const isStreakInDanger = stats.currentStreak > 0 && !hasYesterdayEntry && !streakShieldUsed;

  // 앱 시작 시 연속 기록 위기 확인
  useEffect(() => {
    if (isLoaded && isStreakInDanger && !streakShieldUsed) {
      // 앱 로드 후 2초 뒤에 모달 표시
      const timer = setTimeout(() => {
        setShowStreakShield(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isStreakInDanger, streakShieldUsed]);

  // Reset input when date changes
  useEffect(() => {
    if (currentEntry && !isEditing) {
      setInputText('');
      setSelectedMood(MOODS[0].emoji);
    }
  }, [selectedDate, currentEntry, isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSubmit = () => {
    if (!inputText.trim()) return;

    if (isEditing && currentEntry) {
      updateEntry(currentEntry.id, inputText, selectedMood);
      setIsEditing(false);
    } else {
      addEntry(selectedDate, inputText, selectedMood);
    }

    setInputText('');
    setSelectedMood(MOODS[0].emoji);
  };

  const handleEdit = () => {
    if (currentEntry) {
      setInputText(currentEntry.text);
      setSelectedMood(currentEntry.mood);
      setIsEditing(true);
      textareaRef.current?.focus();
    }
  };

  const handleDelete = () => {
    if (currentEntry && window.confirm('이 일기를 삭제할까요?')) {
      deleteEntry(currentEntry.id);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setInputText('');
    setSelectedMood(MOODS[0].emoji);
  };

  // 플래시백 잠금 해제 (광고 시청 후)
  const handleUnlockFlashback = () => {
    showInterstitialAd({
      onDismiss: () => {
        setFlashbackUnlocked(true);
        // 오늘 하루 동안 잠금 해제 상태 유지
        try {
          localStorage.setItem('flashback_unlock_date', format(new Date(), 'yyyy-MM-dd'));
        } catch (e) {
          // ignore
        }
      },
    });
  };

  // 플래시백 잠금 해제 상태 확인
  useEffect(() => {
    try {
      const unlockDate = localStorage.getItem('flashback_unlock_date');
      if (unlockDate === format(new Date(), 'yyyy-MM-dd')) {
        setFlashbackUnlocked(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 연속 기록 보호막 (광고 시청 후)
  const handleStreakShield = () => {
    showInterstitialAd({
      onDismiss: () => {
        setShowStreakShield(false);
        setStreakShieldUsed(true);
        setAllowYesterdayWrite(true);
        // 어제 날짜로 이동
        setSelectedDate(yesterday);
        setActiveTab('write');
      },
    });
  };


  const getEncouragementMessage = () => {
    const messages = [
      { icon: '\u{1F31F}', text: '오늘 하루도 수고했어요!' },
      { icon: '\u{1F331}', text: '작은 기록이 큰 추억이 됩니다' },
      { icon: '\u{2728}', text: '당신의 하루를 한 줄로 남겨보세요' },
      { icon: '\u{1F4DD}', text: '오늘은 어떤 하루였나요?' },
      { icon: '\u{1F60A}', text: '기록하는 습관이 삶을 바꿔요' },
    ];

    const index = new Date().getDate() % messages.length;
    return messages[index];
  };

  if (!isLoaded) {
    return (
      <div className="app-container">
        <div className="loading">불러오는 중...</div>
      </div>
    );
  }

  const encouragement = getEncouragementMessage();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="header-title">오늘 한 줄</h1>
          <p className="header-date">
            {format(parseISO(selectedDate), 'M월 d일 EEEE', { locale: ko })}
          </p>
        </div>
        {stats.currentStreak > 0 && (
          <StreakBadge streak={stats.currentStreak} />
        )}
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        <button
          className={`tab-item ${activeTab === 'write' ? 'active' : ''}`}
          onClick={() => setActiveTab('write')}
        >
          오늘 기록
        </button>
        <button
          className={`tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          캘린더
        </button>
        <button
          className={`tab-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          통계
        </button>
      </nav>

      {/* Content based on active tab */}
      {activeTab === 'write' && (
        <>
          {/* Flashback Section (잠금 해제 가능) */}
          {flashbacks.length > 0 && (
            <FlashbackLocked
              flashbacks={flashbacks}
              isUnlocked={flashbackUnlocked}
              onUnlock={handleUnlockFlashback}
            />
          )}

          {/* Encouragement */}
          {!currentEntry && isSelectedToday && (
            <div className="encouragement">
              <div className="encouragement-icon">{encouragement.icon}</div>
              <p className="encouragement-text">{encouragement.text}</p>
            </div>
          )}

          {/* Diary Content */}
          <div className="diary-content">
            <div className="diary-date-header">
              {isSelectedToday ? '오늘의 기록' : format(parseISO(selectedDate), 'M월 d일의 기록', { locale: ko })}
            </div>

            {currentEntry && !isEditing ? (
              <div className="diary-entry-view">
                <div className="diary-entry-display">
                  <div className="diary-mood-large">{currentEntry.mood}</div>
                  <p className="diary-text">{currentEntry.text}</p>
                  <p className="diary-time">
                    {format(parseISO(currentEntry.createdAt), 'a h:mm', { locale: ko })}
                    {currentEntry.updatedAt && ' (수정됨)'}
                  </p>
                </div>
                <div className="entry-actions">
                  <button className="action-btn edit" onClick={handleEdit}>
                    <i className="ri-edit-line"></i>
                    수정
                  </button>
                  <button className="action-btn delete" onClick={handleDelete}>
                    <i className="ri-delete-bin-line"></i>
                    삭제
                  </button>
                </div>

              </div>
            ) : (
              <div className="diary-empty">
                <i className="ri-quill-pen-line"></i>
                <p className="diary-empty-text">
                  {isSelectedToday
                    ? '오늘의 한 줄을 남겨보세요'
                    : '이 날의 기록이 없어요'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setActiveTab('write');
          }}
          getEntriesForMonth={getEntriesForMonth}
        />
      )}

      {activeTab === 'stats' && (
        <Statistics stats={stats} />
      )}


      {/* Bottom Spacer */}
      <div className="bottom-spacer"></div>

      {/* Bottom Input - only show when writing */}
      {(activeTab === 'write' && (!currentEntry || isEditing)) && (
        <div className="bottom-input">
          <MoodSelector
            selectedMood={selectedMood}
            onSelect={setSelectedMood}
          />
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="diary-input"
              placeholder="오늘 하루를 한 문장으로..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
            />
            {isEditing ? (
              <>
                <button
                  className="submit-btn"
                  onClick={handleCancelEdit}
                  style={{ background: '#ADB5BD' }}
                >
                  <i className="ri-close-line"></i>
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={!inputText.trim()}
                >
                  <i className="ri-check-line"></i>
                </button>
              </>
            ) : (
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={!inputText.trim()}
              >
                <i className="ri-send-plane-fill"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 연속 기록 보호막 모달 */}
      {showStreakShield && (
        <StreakShield
          streak={stats.currentStreak}
          targetDate={yesterday}
          onWatch={handleStreakShield}
          onDismiss={() => {
            setShowStreakShield(false);
            setStreakShieldUsed(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
