import React, { useMemo, useRef } from 'react';

type ViewMode = 'week';

type Chapter = {
    id: number;
    subject: string;
    phase: number;
    name: string;
    serial_number: number;
};

type CalendarEvent = {
    id: number;
    chapter: number | Chapter;
    date: string;
    position: number;
};

interface WeeklyCalendarGridProps {
    currentDate: Date;
    selectedDate: Date;
    events: CalendarEvent[];
    onDrop: (date: Date, chapterId: number, position?: number) => void;
    onSelect: (date: Date) => void;
    locale?: string;
    chapters?: Chapter[];
    colorsByChapter?: Record<number, string>;
    onMove?: (eventId: number, date: Date, position?: number) => void;
    onRemove?: (eventId: number) => void;
}

function clampToMidnight(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function startOfWeek(d: Date) {
    const x = clampToMidnight(d);
    const day = x.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    return addDays(x, diff);
}


function getWeekGridDates(anchorDate: Date) {
    const start = startOfWeek(anchorDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i));
    }
    return days;
}

function getChapterId(ch: number | Chapter): number {
    return typeof ch === 'number' ? ch : ch.id;
}

function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    if (![3, 6].includes(h.length)) return null;
    const norm = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(norm.slice(0, 2), 16);
    const g = parseInt(norm.slice(2, 4), 16);
    const b = parseInt(norm.slice(4, 6), 16);
    return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hexA: string, hexB: string) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    if (!a || !b) return 1;
    const L1 = relativeLuminance(a);
    const L2 = relativeLuminance(b);
    const [bright, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
    return (bright + 0.05) / (dark + 0.05);
}

function bestTextColor(bg: string): string {
    const black = '#111827';
    const white = '#ffffff';
    const cBlack = contrastRatio(bg, black);
    const cWhite = contrastRatio(bg, white);
    return cBlack >= cWhite ? black : white;
}

const DEFAULT_COLOR = '#ffffff';

const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
    currentDate,
    selectedDate,
    events,
    onDrop,
    onSelect,
    locale,
    chapters,
    colorsByChapter,
    onMove,
    onRemove,
}) => {
    const monthLabel = useMemo(() => {
        const fmt = new Intl.DateTimeFormat(locale || undefined, { month: 'long', year: 'numeric' });
        return fmt.format(currentDate);
    }, [currentDate, locale]);

    const days = useMemo(() => getWeekGridDates(currentDate), [currentDate]);
    const today = clampToMidnight(new Date());

    const chapterMap = useMemo(() => {
        const map: Record<number, Chapter> = {};
        for (const c of chapters || []) map[c.id] = c;
        return map;
    }, [chapters]);

    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        for (const ev of events || []) {
            const k = clampToMidnight(new Date(ev.date)).toDateString();
            if (!map[k]) map[k] = [];
            map[k].push(ev);
        }
        Object.values(map).forEach(list => list.sort((a, b) => a.position - b.position));
        return map;
    }, [events]);

    const gridRef = useRef<HTMLDivElement | null>(null);

    function colorForEvent(ev: CalendarEvent): { bg: string; text: string; border?: string } {
        let clr: string | undefined;
        if (typeof ev.chapter !== 'number' && (ev.chapter as any)?.highlight_color) {
            clr = (ev.chapter as any).highlight_color as string;
        } else {
            const id = getChapterId(ev.chapter);
            if (colorsByChapter && colorsByChapter[id]) clr = colorsByChapter[id];
        }
        const bg = clr || DEFAULT_COLOR;
        const text = bestTextColor(bg);
        if (contrastRatio(bg, text) < 4.5) {
            return { bg: 'transparent', text: '#111827', border: bg };
        }
        return { bg, text };
    }

    return (
        <div className="cal-container">
            <style>{`
        @media (max-width: 768px) {
          .cal-container {
            margin: -12px;
            width: calc(100% + 24px);
            border-radius: 0;
          }

          .week-grid {
            flex-direction: column;
          }

          .day-column {
            min-width: 0;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .day-column:last-child {
            border-bottom: none;
          }

          .day-header {
            flex-direction: row;
            justify-content: space-between;
            padding: 8px 12px;
          }

          .day-content {
            padding: 8px;
          }

          .cal-tile {
            padding: 6px 10px;
            font-size: 11px;
          }
        }

        .cal-container {
          width: 100%;
          background: #fff;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }

        .week-grid {
          display: flex;
          width: 100%;
          background: #f8fafc;
        }

        .day-column {
          flex: 1;
          min-width: 160px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }

        .day-column:last-child {
          border-right: none;
        }

        .day-header {
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: #f0f0f0;
          border-bottom: 1px solid #e5e7eb;
        }

        .weekday-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .weekday-date {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .day-content {
          padding: 12px;
          min-height: calc(5 * (32px + 8px));
          background: #fff;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .day-content.is-today {
          background: #fafafa;
        }

        .cal-tiles {
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: auto;
        }

        .cal-tile {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.4;
          cursor: move;
          width: 100%;
          border: none;
          font-family: 'IBM Plex Mono', monospace;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-sizing: border-box;
          margin: 0;
          text-align: left;
        }

        .cal-tile-content {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cal-tile-content {
          flex: 1;
        }

        .remove-button {
          opacity: 0;
          margin-left: 8px;
          background: none;
          border: none;
          padding: 2px 6px;
          font-size: 16px;
          cursor: pointer;
          color: inherit;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .cal-tile:hover .remove-button,
        .cal-tile.touch-dragging .remove-button {
          opacity: 1;
        }

        .remove-button:hover {
          background: rgba(0,0,0,0.1);
        }

        @media (hover: none) {
          .cal-tile {
            touch-action: none; /* Prevents scrolling while trying to drag */
          }

          .cal-tile.touch-dragging {
            opacity: 0.7;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .touch-drag-target {
            background-color: rgba(218, 65, 135, 0.05) !important;
          }
        }

        .dragging,
        .touch-dragging {
          opacity: 0.7;
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
      `}</style>
            <div ref={gridRef} className="week-grid">
                {days.map((day, i) => {
                    const isToday = sameDay(day, today);
                    const dateFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric' });
                    const dayEvents = eventsByDate[day.toDateString()] || [];

                    return (
                        <div key={day.toISOString()} className="day-column">
                            <div className="day-header">
                                <span className="weekday-name">
                                    {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}
                                </span>

                                <span
                                    className="weekday-date"
                                    style={isToday ? { color: '#D7266D' } : undefined}
                                >
                                    {dateFormatter.format(day)}
                                </span>
                            </div>

                            <div
                                className={`day-content${isToday ? ' is-today' : ''}`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dayColumn = e.currentTarget.closest('.day-column') as HTMLElement;

                                    gridRef.current?.querySelectorAll('.day-column').forEach(col => {
                                        const content = col.querySelector('.day-content') as HTMLElement;
                                        if (content) {
                                            content.style.background = col.classList.contains('is-today') ? '#fafafa' : '#fff';
                                        }
                                    });
                                    e.currentTarget.style.background = 'rgba(218, 65, 135, 0.05)';
                                }}
                                onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                        e.currentTarget.style.background = isToday ? '#fafafa' : '#fff';
                                    }
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const dropTarget = e.currentTarget;
                                    dropTarget.style.background = isToday ? '#fafafa' : '#fff';

                                    const eventId = e.dataTransfer.getData('eventId');
                                    const chapterId = e.dataTransfer.getData('chapterId');

                                    const tilesContainer = dropTarget.querySelector('.cal-tiles');
                                    if (!tilesContainer) return;

                                    const mouseY = e.clientY;
                                    const tiles = Array.from(tilesContainer.children) as HTMLElement[];

                                    let position = tiles.length;
                                    if (tiles.length > 0) {
                                        if (mouseY < tiles[0].getBoundingClientRect().top) {
                                            position = 0;
                                        } else if (mouseY > tiles[tiles.length - 1].getBoundingClientRect().bottom) {
                                            position = tiles.length;
                                        } else {
                                            for (let i = 0; i < tiles.length - 1; i++) {
                                                const currentBottom = tiles[i].getBoundingClientRect().bottom;
                                                const nextTop = tiles[i + 1].getBoundingClientRect().top;
                                                const gap = (currentBottom + nextTop) / 2;
                                                if (mouseY < gap) {
                                                    position = i + 1;
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (eventId && onMove) {
                                        onMove(parseInt(eventId, 10), day, position);
                                    } else if (chapterId) {
                                        onDrop(day, parseInt(chapterId, 10), position);
                                    }
                                }}


                                onTouchStart={(e) => {
                                    e.currentTarget.classList.add('touch-drag-target');
                                }}
                                onTouchEnd={(e) => {
                                    e.currentTarget.classList.remove('touch-drag-target');
                                }}
                            >
                                <div className="cal-tiles">
                                    {dayEvents.map((ev, idx) => {
                                        const colors = colorForEvent(ev);
                                        const chapter = typeof ev.chapter === 'number' ? chapterMap[ev.chapter] : ev.chapter;

                                        return (
                                            <button
                                                key={ev.id}
                                                className="cal-tile"
                                                data-index={idx}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('eventId', String(ev.id));
                                                    e.currentTarget.classList.add('dragging');
                                                }}
                                                onDragEnd={(e) => {
                                                    e.currentTarget.classList.remove('dragging');
                                                }}
                                                onTouchStart={(e) => {
                                                    const tile = e.currentTarget;
                                                    tile.classList.add('touch-dragging');

                                                    const touch = e.touches[0];
                                                    const initialX = touch.clientX;
                                                    const initialY = touch.clientY;

                                                    const handleTouchMove = (moveEvent: TouchEvent) => {
                                                        const moveTouch = moveEvent.touches[0];
                                                        const deltaX = moveTouch.clientX - initialX;
                                                        const deltaY = moveTouch.clientY - initialY;

                                                        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                                                            tile.setAttribute('draggable', 'true');
                                                            const dragEvent = new DragEvent('dragstart', {
                                                                bubbles: true,
                                                                cancelable: true,
                                                            });
                                                            Object.defineProperty(dragEvent, 'dataTransfer', {
                                                                value: new DataTransfer(),
                                                            });
                                                            dragEvent.dataTransfer?.setData('eventId', String(ev.id));
                                                            tile.dispatchEvent(dragEvent);
                                                        }
                                                    };

                                                    const handleTouchEnd = () => {
                                                        tile.classList.remove('touch-dragging');
                                                        tile.removeAttribute('draggable');
                                                        document.removeEventListener('touchmove', handleTouchMove);
                                                        document.removeEventListener('touchend', handleTouchEnd);
                                                    };

                                                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                                                    document.addEventListener('touchend', handleTouchEnd);
                                                }}
                                                style={{
                                                    background: colors.bg,
                                                    color: colors.text,
                                                    border: colors.border ? `1px solid ${colors.border}` : 'none',
                                                }}
                                                title={chapter ?
                                                    `${chapter.name} · Phase ${chapter.phase} • #${chapter.serial_number}` :
                                                    `Chapter ${getChapterId(ev.chapter)}`
                                                }
                                            >
                                                <span className="cal-tile-content">
                                                    {chapter?.name || `Chapter ${getChapterId(ev.chapter)}`}
                                                </span>
                                                {onRemove && (
                                                    <button
                                                        className="remove-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemove(ev.id);
                                                        }}
                                                        aria-label="Remove event"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklyCalendarGrid;
