import React, { useState, useEffect } from 'react';
import API from '../api';

interface Chapter {
    id: number;
    subject: string;
    phase: number;
    name: string;
    serial_number: number;
}

interface Event {
    id: number;
    user: number;
    chapter: number;
    date: string;
    position: number;
    created_date: string;
    updated_date: string;
    completed?: boolean;
}

interface PomodoroSettings {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
}

const Study: React.FC = () => {
    const [todayChapters, setTodayChapters] = useState<Array<{ chapter: Chapter; event: Event }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timer, setTimer] = useState<number>(25 * 60);
    const [completedChapters, setCompletedChapters] = useState<Set<number>>(() => {
        const saved = localStorage.getItem('completedChapters');
        if (saved) {
            try {
                return new Set(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing completed chapters from localStorage:', e);
            }
        }
        return new Set();
    });
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [settings] = useState<PomodoroSettings>({
        workDuration: 25 * 60,
        breakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        sessionsBeforeLongBreak: 4
    });

    const [note, setNote] = useState<string>(() => {
        return localStorage.getItem('studyNote') || '';
    });

    useEffect(() => {
        localStorage.setItem('studyNote', note);
    }, [note]);

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    useEffect(() => {
        try {
            localStorage.setItem('completedChapters', JSON.stringify(Array.from(completedChapters)));
            console.log('Saved completed chapters:', Array.from(completedChapters));
        } catch (e) {
            console.error('Error saving completed chapters to localStorage:', e);
        }
    }, [completedChapters]);

    useEffect(() => {
        const fetchTodayChapters = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                console.log('Fetching chapters for date:', today);

                const [eventsRes, chaptersRes] = await Promise.all([
                    API.get('calendar-events/'),
                    API.get('chapters/')
                ]);

                console.log('Calendar events received:', eventsRes.data);
                console.log('All chapters received:', chaptersRes.data);

                const events = eventsRes.data.filter((event: Event) => {
                    const eventDate = event.date.split('T')[0];
                    const isToday = eventDate === today;
                    console.log('Event date:', eventDate, 'Is today?:', isToday, 'Event:', event);
                    return isToday;
                });

                console.log('Today\'s events:', events);

                const chapters = chaptersRes.data;

                const todayItems = events
                    .map((event: Event) => {
                        const chapter = chapters.find((ch: Chapter) => ch.id === event.chapter);
                        console.log('Matching chapter for event:', event.chapter, 'Found:', chapter);
                        return { event, chapter };
                    })
                    .filter((item: { event: Event; chapter: Chapter | undefined }) => item.chapter)
                    .sort((a: { event: Event }, b: { event: Event }) => a.event.position - b.event.position);

                console.log('Final today\'s items:', todayItems);
                setTodayChapters(todayItems);
            } catch (error) {
                console.error('Error fetching today\'s chapters:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTodayChapters();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            if (!isBreak) {
                setSessionsCompleted(prev => prev + 1);
                const isLongBreak = (sessionsCompleted + 1) % settings.sessionsBeforeLongBreak === 0;
                setTimer(isLongBreak ? settings.longBreakDuration : settings.breakDuration);
                setIsBreak(true);
            } else {
                setTimer(settings.workDuration);
                setIsBreak(false);
            }
        }

        return () => clearInterval(interval);
    }, [isRunning, timer, isBreak, sessionsCompleted, settings]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimer(settings.workDuration);
        setIsBreak(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}>
            <style>{`
            * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        *::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
  .page-header {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 24px;
  }

  .page-header h1 {
    margin: 0;
    font-size: 24px;
    color: #272727;
  }

  .today-date {
    margin-top: 8px;
    color: var(--ds-accent);
    font-weight: 500;
  }

  .study-container {
    display: grid;
    gap: 24px;
    align-items: start;
  }

  @media (min-width: 768px) {
    .study-container {
      grid-template-columns: 1fr 1fr;
    }
  }

  .left-column {
    display: flex;
    flex-direction: column;
    gap: 24px; /* space between timer and notes */
  }

  .timer-container, .chapters-container, .notes-container {
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .timer-container { 
    text-align: center; 
  }

  .timer-display {
    font-size: 48px;
    font-weight: 700;
    color: var(--ds-accent);
    margin: 20px 0;
  }

  .timer-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .timer-button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: var(--ds-accent);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .timer-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .timer-status {
    margin-top: 16px;
    font-size: 14px;
    color: #666;
  }

  .chapter-item {
    padding: 16px;
    border-bottom: 1px solid #eee;
  }

  .chapter-item:last-child {
    border-bottom: none;
  }

  .chapter-checkbox {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    cursor: pointer;
  }

  .chapter-checkbox input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    cursor: pointer;
    accent-color: var(--ds-accent);
  }

  .checkbox-content { 
    flex: 1; 
  }

  .chapter-title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .chapter-info {
    font-size: 14px;
    color: #666;
  }

  .chapter-checkbox input[type="checkbox"]:checked + .checkbox-content {
    opacity: 0.6;
  }

  .chapter-checkbox input[type="checkbox"]:checked + .checkbox-content .chapter-title {
    text-decoration: line-through;
  }

  .notes-container {
    background: #fffbea;
  }

  .sticky-note {
    width: 100%;
    min-height: 120px;
    border: none;
    resize: vertical;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    background: transparent;
    outline: none;
  }
`}</style>


            <div className="page-header">
                <h1>Study Session</h1>
                <div className="today-date">{formatDate(new Date())}</div>
            </div>

            <div className="study-container">
                <div className="left-column">
                {/* Timer */}
                <div className="timer-container">
                    <h2>Pomodoro Timer</h2>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                        <button
                            className="timer-button"
                            onClick={() => setTimer(prev => Math.max(60, prev - 5 * 60))}
                        >
                            –
                        </button>
                        <div className="timer-display">{formatTime(timer)}</div>
                        <button
                            className="timer-button"
                            onClick={() => setTimer(prev => prev + 5 * 60)}
                        >
                            +
                        </button>
                    </div>

                    <div style={{ marginTop: "12px" }}>
                        <select
                            style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                fontWeight: 600,
                                fontFamily: 'inherit',
                            }}
                            onChange={(e) => {
                                const newDuration = Number(e.target.value) * 60;
                                setTimer(newDuration);
                                setIsBreak(false);
                                setIsRunning(false);
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>
                                Choose preset...
                            </option>
                            <option value={25}>Pomodoro (25 min)</option>
                            <option value={30}>30 min study</option>
                            <option value={45}>45 min study</option>
                            <option value={50}>50 min study</option>
                        </select>
                    </div>

                    <div className="timer-buttons" style={{ marginTop: "12px" }}>
                        <button className="timer-button" onClick={toggleTimer}>
                            {isRunning ? "Pause" : "Start"}
                        </button>
                        <button className="timer-button" onClick={resetTimer}>
                            Reset
                        </button>
                    </div>

                    <div className="timer-status">
                        {isBreak ? "Break Time!" : "Work Time"}
                        <br />
                        Sessions completed: {sessionsCompleted}
                        <br />
                        <strong>
                            {isBreak
                                ? `Up next: ${Math.floor(settings.workDuration / 60)} minute study session`
                                : `Up next: ${Math.floor(settings.breakDuration / 60)} minute break`}
                        </strong>
                    </div>
                </div>
                {/* Sticky Notes */}
                <div className="notes-container">
                    <h2>Sticky Notes</h2>
                    <textarea
                        className="sticky-note"
                        placeholder="Write your study notes here..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
                </div>

                {/* Chapters */}
                <div className="chapters-container">
                    <h2>Today's Chapters</h2>
                    {isLoading ? (
                        <div>Loading chapters...</div>
                    ) : todayChapters.length > 0 ? (
                        todayChapters.map(({ chapter, event }) => (
                            <div key={event.id} className="chapter-item">
                                <label className="chapter-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={completedChapters.has(event.id)}
                                        onChange={() => {
                                            setCompletedChapters(prev => {
                                                const newSet = new Set(prev);
                                                if (prev.has(event.id)) {
                                                    newSet.delete(event.id);
                                                    console.log('Unchecked chapter:', event.id);
                                                } else {
                                                    newSet.add(event.id);
                                                    console.log('Checked chapter:', event.id);
                                                }
                                                return newSet;
                                            });

                                            try {
                                                const newState = completedChapters.has(event.id) ?
                                                    new Set([...completedChapters].filter(id => id !== event.id)) :
                                                    new Set([...completedChapters, event.id]);

                                                localStorage.setItem('completedChapters', JSON.stringify(Array.from(newState)));
                                                console.log('Immediately saved state:', Array.from(newState));
                                            } catch (e) {
                                                console.error('Error updating localStorage:', e);
                                            }

                                        }}
                                    />
                                    <div className="checkbox-content">
                                        <div className="chapter-title">{chapter.name}</div>
                                        <div className="chapter-info">
                                            <div>{chapter.subject.toUpperCase()} - Phase {chapter.phase}</div>
                                            <div style={{ color: '#666', marginTop: 4 }}>
                                                Chapter {chapter.serial_number} • Session {event.position + 1}
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        ))
                    ) : (
                        <div>No chapters scheduled for today</div>
                    )}
                </div>

                

            </div>
        </div>
    );
};

export default Study;
