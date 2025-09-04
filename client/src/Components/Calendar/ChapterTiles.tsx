import React from 'react';

interface Chapter {
  id: number;
  subject: string;
  phase: number;
  name: string;
  serial_number: number;
  highlight_color?: string;
}

interface ChapterTilesProps {
  chapters: Chapter[];
  onDragStart: (chapterId: number) => void;
  colorsByChapter?: Record<number, string>;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (!(h.length === 3 || h.length === 6)) return null;
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}
function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function bestTextColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex || '#D2E8FF');
  if (!rgb) return '#111827';
  const Lbg = luminance(rgb);
  const Lwhite = luminance({ r: 255, g: 255, b: 255 });
  const Lblack = luminance({ r: 17, g: 24, b: 39 });
  const cWhite = (Math.max(Lbg, Lwhite) + 0.05) / (Math.min(Lbg, Lwhite) + 0.05);
  const cBlack = (Math.max(Lbg, Lblack) + 0.05) / (Math.min(Lbg, Lblack) + 0.05);
  return cBlack >= cWhite ? '#111827' : '#ffffff';
}

const ChapterTiles: React.FC<ChapterTilesProps> = ({ chapters, onDragStart, colorsByChapter }) => {
  const [collapsedSubjects, setCollapsedSubjects] = React.useState<{ [key: string]: boolean }>({});

  const toggleSubject = (subject: string) => {
    setCollapsedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  const handleDragStart = (e: DragEvent | React.DragEvent<HTMLDivElement>, chapterId: number, bg: string, title: string) => {
    const dt = e instanceof DragEvent ? e.dataTransfer : (e as React.DragEvent<HTMLDivElement>).dataTransfer;
    if (!dt) return;

    dt.setData('chapterId', chapterId.toString());
    onDragStart(chapterId);

    // lil drag preview
    try {
      const preview = document.createElement('div');
      preview.style.position = 'fixed';
      preview.style.top = '-1000px';
      preview.style.left = '-1000px';
      preview.style.padding = '6px 10px';
      preview.style.borderRadius = '999px';
      preview.style.fontFamily = 'var(--ds-font, ui-monospace, monospace)';
      preview.style.fontSize = '12px';
      preview.style.background = bg;
      preview.style.color = bestTextColor(bg);
      preview.style.border = '1px solid rgba(0,0,0,.15)';
      preview.textContent = title;
      document.body.appendChild(preview);
      dt.setDragImage(preview, 0, 0);
      setTimeout(() => preview.remove(), 0);
    } catch { }
  };

  // Grouping the lil guys by sub
  const chaptersBySubject: { [key: string]: Chapter[] } = {};
  chapters.forEach(chapter => {
    if (!chaptersBySubject[chapter.subject]) {
      chaptersBySubject[chapter.subject] = [];
    }
    chaptersBySubject[chapter.subject].push(chapter);
  });

  return (
    <div className="chapter-tiles" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxHeight: window.innerWidth <= 768 ? '200px' : 'none',
      overflowY: window.innerWidth <= 768 ? 'auto' : 'visible'
    }}>
      <style>{`
        @media (hover: none) {
          .chapter-tile {
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
          }

          .chapter-tile.touch-dragging {
            opacity: 0.7;
            transform: scale(1.02);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            position: relative;
            z-index: 1;
          }

          .chapter-tile:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }
        }

        .chapter-tile.dragging {
          opacity: 0.7;
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .subject-group {
          transition: margin 0.2s ease;
        }
        
        .subject-group.collapsed .chapters {
          display: none;
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
      `}</style>
      {Object.entries(chaptersBySubject).map(([subject, subjectChapters]) => (
        <div key={subject} className={`subject-group${collapsedSubjects[subject] ? ' collapsed' : ''}`}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#4B5563',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>{subject}</h3>
            <button
              onClick={() => toggleSubject(subject)}
              className="subject-collapse-button"
            >
              {collapsedSubjects[subject] ? 'Show' : 'Hide'}
            </button>
          </div>
          <div className="chapters" style={{
            display: collapsedSubjects[subject] ? 'none' : 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
            {subjectChapters.map(chapter => {
              const bg = chapter.highlight_color || (colorsByChapter && colorsByChapter[chapter.id]) || '#D2E8FF';
              const textColor = bestTextColor(bg);
              const label = `${chapter.name} · P${chapter.phase} • #${chapter.serial_number}`;
              return (
                <div
                  key={chapter.id}
                  className="chapter-tile"
                  draggable
                  data-tooltip={label}
                  onDragStart={(e) => {
                    handleDragStart(e, chapter.id, bg, chapter.name);
                    e.currentTarget.classList.add('dragging');
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('dragging');
                  }}
                  onTouchStart={(e) => {
                    const tile = e.currentTarget;
                    let isDragging = false;
                    let dragStarted = false;

                    const touch = e.touches[0];
                    const initialX = touch.clientX;
                    const initialY = touch.clientY;

                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      if (isDragging) return;

                      const moveTouch = moveEvent.touches[0];
                      const deltaX = moveTouch.clientX - initialX;
                      const deltaY = moveTouch.clientY - initialY;

                      if (!dragStarted && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                        dragStarted = true;
                        isDragging = true;
                        moveEvent.preventDefault();

                        tile.classList.add('touch-dragging');

                        const dt = new DataTransfer();
                        dt.setData('chapterId', chapter.id.toString());

                        const dragStartEvent = new DragEvent('dragstart', {
                          bubbles: true,
                          cancelable: true,
                          dataTransfer: dt
                        });

                        tile.dispatchEvent(dragStartEvent);
                        onDragStart(chapter.id);
                      }
                    };

                    const handleTouchEnd = () => {
                      tile.classList.remove('touch-dragging');
                      document.removeEventListener('touchmove', handleTouchMove);
                      document.removeEventListener('touchend', handleTouchEnd);
                    };

                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    cursor: 'move',
                    maxWidth: '200px',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: bg,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div className="chapter-name" style={{
                      fontWeight: 600,
                      color: textColor,
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {chapter.name}
                    </div>
                    <div className="chapter-info" style={{
                      opacity: .85,
                      color: textColor,
                      fontSize: '11px',
                      marginTop: '2px'
                    }}>
                      Phase {chapter.phase} • #{chapter.serial_number}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChapterTiles;

