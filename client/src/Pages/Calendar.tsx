import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import WeeklyCalendarGrid from '../Components/Calendar/WeeklyCalendarGrid';
import ChapterTiles from '../Components/Calendar/ChapterTiles';

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

interface Chapter {
  id: number;
  subject: string;
  phase: number;
  name: string;
  serial_number: number;
  highlight_color?: string;
}

interface CalendarEvent {
  id: number;
  chapter: Chapter;
  date: string;
  position: number;
}

interface Progress {
  id: number;
  chapter: number;
  highlight_color?: string;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lastAction, setLastAction] = useState<{ type: 'move' | 'create' | 'delete', event: CalendarEvent, prev?: { date: string, position: number } } | null>(null);
  const [isChaptersCollapsed, setIsChaptersCollapsed] = useState(false);

  const handleMoveEvent = async (eventId: number, date: Date, position?: number) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const existing = events.find(e => e.id === eventId);
      if (!existing) return;
      setLastAction({ type: 'move', event: existing, prev: { date: existing.date, position: existing.position } });
      const updated: CalendarEvent = { ...existing, date: dateStr, position: typeof position === 'number' ? position : 0 };
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
      await API.patch(`calendar-events/${eventId}/`, { date: dateStr, position: updated.position });
    } catch (err) {
      if (lastAction?.type === 'move' && lastAction.prev) {
        setEvents(prev => prev.map(e => e.id === lastAction.event.id ? { ...e, date: lastAction.prev!.date, position: lastAction.prev!.position } : e));
      }
      console.error('Error moving calendar event:', err);
    }
  };

  const handleUndo = async () => {
    if (!lastAction) return;
    try {
      if (lastAction.type === 'create') {
        await API.delete(`calendar-events/${lastAction.event.id}/`);
        setEvents(prev => prev.filter(e => e.id !== lastAction.event.id));
      } else if (lastAction.type === 'move' && lastAction.prev) {
        await API.patch(`calendar-events/${lastAction.event.id}/`, { date: lastAction.prev.date, position: lastAction.prev.position });
        setEvents(prev => prev.map(e => e.id === lastAction.event.id ? { ...e, date: lastAction.prev!.date, position: lastAction.prev!.position } : e));
      } else if (lastAction.type === 'delete') {
        const recreated = await API.post('calendar-events/', {
          chapter: lastAction.event.chapter.id,
          date: lastAction.event.date,
          position: lastAction.event.position
        });
        setEvents(prev => [...prev, recreated.data]);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      setLastAction(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chaptersResponse = await API.get('chapters/');
        setChapters(chaptersResponse.data);
        const eventsResponse = await API.get('calendar-events/');
        setEvents(eventsResponse.data);
        const progressResponse = await API.get('progress/');
        setProgress(progressResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/');
      }
    };
    fetchData();
  }, [navigate]);

  const handleDragStart = (chapterId: number) => {
    console.log('Dragging chapter:', chapterId);
  };

  const handleDrop = async (date: Date, chapterId: number, position?: number) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const dayCount = events.filter(e => e.date === dateStr).length;
      const response = await API.post('calendar-events/', {
        chapter: chapterId,
        date: dateStr,
        position: typeof position === 'number' ? position : dayCount
      });
      setEvents(prev => [...prev, response.data]);
      setLastAction({ type: 'create', event: response.data });
    } catch (err) {
      console.error('Error creating calendar event:', err);
    }
  };

  const handleRemove = async (eventId: number) => {
    try {
      const existing = events.find(e => e.id === eventId);
      if (!existing) return;
      setLastAction({ type: 'delete', event: existing });
      setEvents(prev => prev.filter(e => e.id !== eventId));
      await API.delete(`calendar-events/${eventId}/`);
    } catch (err) {
      console.error('Error removing calendar event:', err);
      setEvents(prev => lastAction && lastAction.type === 'delete'
        ? [...prev, lastAction.event]
        : prev
      );
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const colorsByChapter = React.useMemo(() => {
    const map: Record<number, string> = {};
    progress.forEach(p => {
      if (p.highlight_color) map[p.chapter] = p.highlight_color!;
    });
    return map;
  }, [progress]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <style>{`
 * {
     scrollbar-width: none;
    /* Firefox */
     -ms-overflow-style: none;
    /* IE and Edge */
}
 *::-webkit-scrollbar {
     display: none;
    /* Chrome, Safari and Opera */
}
 @media (max-width: 768px) {
     .calendar-body-layout {
         padding: 8px;
         gap: 8px;
    }
     .calendar-month-container {
         padding: 0;
    }
     .calendar-month-header {
         flex-direction: column;
         gap: 12px;
         align-items: stretch;
         padding: 12px 12px 8px;
    }
     .calendar-controls {
         flex-wrap: wrap;
         justify-content: center;
         gap: 6px;
    }
     .control-btn {
         flex: 1;
         min-width: 0;
         font-size: 11px;
         padding: 6px 8px;
         white-space: nowrap;
    }
     .control-btn span {
         display: none;
    }
     .chapters-row {
         padding: 12px;
         margin: 0 -8px;
         border-radius: 0;
    }
     .calendar-title {
         font-size: 1.1rem !important;
    }
     .calendar-nav {
         font-size: 1.4rem !important;
    }
     .main-calendar {
         margin: 0 -8px;
         border-radius: 0;
    }
}
 .calendar-body-layout {
     display: flex;
     flex-direction: column;
     min-height: calc(100vh - 84px);
     padding: 24px;
     box-sizing: border-box;
     gap: 16px;
     max-width: 100%;
     margin-top: 0;
}
 .chapters-row {
     background: #fff;
     border-radius: 12px;
     padding: 20px;
     box-sizing: border-box;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);
     position: sticky;
     top: 84px;
     z-index: 20;
     transition: height 0.3s ease, opacity 0.3s ease;
}
 .chapters-row.collapsed {
     height: 60px;
     overflow: hidden;
}
 .chapters-content {
     transition: opacity 0.3s ease;
}
 .chapters-row.collapsed .chapters-content {
     opacity: 0;
}
 .chapters-header {
     font-family: 'IBM Plex Mono', monospace;
     font-size: 1.125rem;
     font-weight: bold;
     margin-bottom: 20px;
     letter-spacing: 0.5px;
     display: flex;
     justify-content: space-between;
     align-items: center;
}
 .collapse-button {
     padding: 4px 8px;
     border: none;
     background: transparent;
     border-radius: 4px;
     font-size: 13px;
     color: #da4187;
     cursor: pointer;
     transition: all 0.2s;
     display: flex;
     align-items: center;
     gap: 6px;
     font-weight: 500;
}
 .collapse-button::after {
     content: '';
     width: 0;
     height: 0;
     border-left: 4px solid transparent;
     border-right: 4px solid transparent;
     border-top: 5px solid #da4187;
     transition: transform 0.2s ease;
     margin-top: 2px;
}
 .collapse-button:hover {
     opacity: 0.8;
}
 .chapters-row.collapsed .collapse-button::after {
     transform: rotate(-90deg);
}
 .subject-collapse-button {
     padding: 2px 6px;
     border: none;
     background: transparent;
     border-radius: 4px;
     font-size: 11px;
     color: #da4187;
     cursor: pointer;
     transition: all 0.2s;
     display: flex;
     align-items: center;
     gap: 4px;
     font-weight: 500;
}
 .subject-collapse-button::after {
     content: '';
     width: 0;
     height: 0;
     border-left: 3px solid transparent;
     border-right: 3px solid transparent;
     border-top: 4px solid #da4187;
     transition: transform 0.2s ease;
     margin-top: 1px;
}
 .subject-collapse-button:hover {
     opacity: 0.8;
}
 .subject-group.collapsed .subject-collapse-button::after {
     transform: rotate(-90deg);
}
 .main-calendar {
     background: #fff;
     border-radius: 14px;
     box-sizing: border-box;
     box-shadow: 0 1px 3px rgba(0,0,0,0.1);
     display: flex;
     flex-direction: column;
}
 .calendar-month-container {
     width: 100%;
     padding: 0 24px 24px;
     display: flex;
     flex-direction: column;
}
 .calendar-grid-scroll {
     overflow-x: auto;
     width: 100%;
}
 .calendar-month-header {
     width: 100%;
     display: flex;
     justify-content: space-between;
     align-items: center;
     font-family: 'IBM Plex Mono', monospace;
     margin-bottom: 20px;
     padding: 20px 16px 0;
     background: #fff;
     position: sticky;
     top: 0;
     z-index: 10;
}
 .calendar-title-section {
     display: flex;
     align-items: center;
     gap: 16px;
     flex-wrap: nowrap;
     min-width: 0;
}
 .calendar-nav {
     color: #da4187;
     font-size: 1.8rem;
     cursor: pointer;
     user-select: none;
     flex-shrink: 0;
     padding: 0 8px;
}
 .calendar-title {
     font-size: clamp(1.2rem, 4vw, 2rem);
     font-weight: bold;
     color: #111827;
     white-space: nowrap;
     overflow: hidden;
     text-overflow: ellipsis;
}
 .calendar-controls {
     display: flex;
     gap: 8px;
}
 .control-btn {
     padding: 8px 12px;
     border: 1px solid #e5e7eb;
     background: white;
     border-radius: 6px;
     font-size: 13px;
     color: #374151;
     cursor: pointer;
     transition: all 0.2s;
     display: flex;
     align-items: center;
     justify-content: center;
}
 .control-btn:hover {
     background: #f3f4f6;
}

        `}

      </style>
      <div className="calendar-body-layout">
        <div className={`chapters-row${isChaptersCollapsed ? ' collapsed' : ''}`}>
          <div className="chapters-header">
            <span>Chapters</span>
            <button
              className="collapse-button"
              onClick={() => setIsChaptersCollapsed(!isChaptersCollapsed)}
              title={isChaptersCollapsed ? "Show chapters" : "Hide chapters"}
            >
              {isChaptersCollapsed ? "Show chapters" : "Hide chapters"}
            </button>
          </div>
          <div className="chapters-content">
            <ChapterTiles
              chapters={chapters.filter(ch => {
                const color = (ch.highlight_color || (colorsByChapter && colorsByChapter[ch.id]) || '').toLowerCase();
                return color && color !== '#ffffff';
              })}
              onDragStart={handleDragStart}
              colorsByChapter={colorsByChapter}
            />
          </div>
        </div>
        <main className="main-calendar">
          <div className="calendar-month-container">
            <div className="calendar-month-header">
              <div className="calendar-title-section">
                <span className="calendar-nav" onClick={handlePrevMonth}>&lt;</span>
                <span className="calendar-title">
                  {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <span className="calendar-nav" onClick={handleNextMonth}>&gt;</span>
              </div>
              <div className="calendar-controls">
                <button className="control-btn" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                  ←<span> Previous Week</span>
                </button>
                <button className="control-btn" onClick={handleToday}>
                  Today
                </button>
                <button className="control-btn" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                  <span>Next Week </span>→
                </button>
              </div>
            </div>
            <div className="calendar-grid-scroll">
              <WeeklyCalendarGrid
                currentDate={currentDate}
                selectedDate={selectedDate}
                events={events}
                onDrop={handleDrop}
                onSelect={setSelectedDate}
                locale={navigator.language}
                chapters={chapters}
                onMove={handleMoveEvent}
                onRemove={handleRemove}
                colorsByChapter={colorsByChapter}
              />
            </div>
          </div>
        </main>
      </div>
    </>

  );
};

export default Calendar;
