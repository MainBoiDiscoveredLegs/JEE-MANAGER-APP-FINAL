import React, { useState, useEffect, useRef } from 'react';
import API from '../../api';
import ColorPicker from './ColorPicker';

interface Chapter {
    id: number;
    subject: string;
    phase: number;
    name: string;
    serial_number: number;
}

interface Progress {
    id?: number;
    chapter: number;
    status: string;
    highlight_color?: string;
    ncert_done?: boolean;
    package_cpp_done?: boolean;
    package_section1_done?: boolean;
    package_section2_done?: boolean;
    package_section3_done?: boolean;
    mains_archive_done?: boolean;
    advance_archive_done?: boolean;
    class_notes_done?: boolean;
    tab_assignments_done?: boolean;
}

interface ChapterTableProps {
    subjectFilter: string | null;
    phaseFilter: number | null;
    search: string;
}

const ChapterTable: React.FC<ChapterTableProps> = ({ subjectFilter = null, phaseFilter = null, search = '' }) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [progress, setProgress] = useState<Record<number, Progress>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editedStatus, setEditedStatus] = useState<Record<number, string>>({});
    const [isEditing, setIsEditing] = useState<Record<number, boolean>>({});
    const saveTimersRef = useRef<Record<number, NodeJS.Timeout>>({});

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        const el = document.createElement('div');
        el.textContent = message;
        el.style.position = 'fixed';
        el.style.right = '16px';
        el.style.bottom = '16px';
        el.style.zIndex = '10000';
        el.style.padding = '10px 14px';
        el.style.borderRadius = '6px';
        el.style.color = '#fff';
        el.style.fontSize = '14px';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        el.style.background = type === 'success' ? '#16a34a' : '#dc2626';
        el.style.opacity = '0';
        el.style.transition = 'opacity 180ms ease';
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.opacity = '1'; });
        setTimeout(() => {
            el.style.opacity = '0';
            el.addEventListener('transitionend', () => el.remove(), { once: true });
        }, 2200);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [chaptersRes, progressRes] = await Promise.all([
                    API.get('chapters/'),
                    API.get('progress/')
                ]);
                setChapters(chaptersRes.data);
                const progressMap: Record<number, Progress> = {};
                progressRes.data.forEach((item: Progress) => {
                    progressMap[item.chapter] = item;
                });
                setProgress(progressMap);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch data');
                setLoading(false);
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    const handleProgressUpdate = async (chapterId: number, updates: Partial<Progress>) => {
        const prevProgressItem = progress[chapterId];
        setProgress(prev => ({
            ...prev,
            [chapterId]: { ...prev[chapterId], ...updates, chapter: chapterId }
        }));
        try {
            let response;
            if (prevProgressItem?.id) {
                response = await API.patch(`progress/${prevProgressItem.id}/`, updates);
            } else {
                response = await API.post('progress/', { chapter: chapterId, ...updates });
            }
            setProgress(prev => ({ ...prev, [chapterId]: response.data }));
            showToast('Progress updated', 'success');
        } catch (err) {
            setProgress(prev => {
                const newState = { ...prev };
                if (prevProgressItem) {
                    newState[chapterId] = prevProgressItem;
                } else {
                    delete newState[chapterId];
                }
                return newState;
            });
            showToast('Failed to update progress', 'error');
            console.error('Error updating progress:', err);
        }
    };

    const saveStatus = async (chapterId: number) => {
        const newStatus = editedStatus[chapterId]?.slice(0, 500) || '';
        await handleProgressUpdate(chapterId, { status: newStatus });
        setIsEditing(prev => ({ ...prev, [chapterId]: false }));
    };

    useEffect(() => {
        return () => {
            Object.values(saveTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    const visibleChapters = chapters.filter(ch => {
        if (subjectFilter && ch.subject !== subjectFilter) return false;
        if (phaseFilter && ch.phase !== phaseFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            return (
                ch.name.toLowerCase().includes(s) ||
                ch.subject.toLowerCase().includes(s) ||
                String(ch.serial_number).includes(s)
            );
        }
        return true;
    });

    const groupedChapters: Record<string, { subject: string; phase: number; chapters: Chapter[] }> = {};
    visibleChapters.forEach(chapter => {
        const key = `${chapter.subject}-${chapter.phase}`;
        if (!groupedChapters[key]) {
            groupedChapters[key] = { subject: chapter.subject, phase: chapter.phase, chapters: [] };
        }
        groupedChapters[key].chapters.push(chapter);
    });

    return (
        <div className="chapter-table" style={{ fontFamily: 'ui-monospace, monospace' }}>
            <style>{`
        .chapter-checkbox {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      cursor: pointer;
    }
    .chapter-checkbox input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
      accent-color: var(--ds-accent);
    }
    .checkbox-content {
      flex: 1;
      font-size: 13px;
      color: #374151;
    }
    .chapter-checkbox input[type="checkbox"]:checked + .checkbox-content {
      opacity: 0.6;
      text-decoration: line-through;
    }

@media (max-width: 768px) {
  table, thead, tbody, th, td, tr {
    display: block;
    width: 100%;
  }

  thead {
    display: none;
  }

  tr {
    margin-bottom: 16px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background: #fff;
    padding: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  td.color-cell {
    width: 100% !important;
    max-width: none;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 10px;
  }
    td.color-cell fieldset {
    flex-wrap: nowrap !important;
  }

  td.sno-cell,
  td.chapter-cell {
    display: inline;
    padding: 0;
    margin: 0;
  }

  td.sno-cell::after {
    content: ". ";
  }

  td.status-cell {
    margin-top: 10px;
  }

  td.progress-cell {
    margin-top: 10px;
  }
      textarea {
        min-height: 40px !important;
        width: 100% !important;
      }
}

    }
      `}</style>

            {Object.values(groupedChapters).map(group => (
                <div key={`${group.subject}-${group.phase}`} style={{ marginBottom: 18 }}>
                    <h3 style={{ margin: '8px 0', color: '#111827', fontWeight: 700 }}>
                        {group.subject.toUpperCase()} - Phase {group.phase}
                    </h3>
                    <div style={{ overflowX: 'auto', borderRadius: 10, background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '14px 18px', background: '#f0f0f0' }}> </th>
                                    <th style={{ padding: '14px 18px', background: '#f0f0f0' }}>S.No</th>
                                    <th style={{ padding: '14px 18px', background: '#f0f0f0' }}>Chapter</th>
                                    <th style={{ padding: '14px 18px', background: '#f0f0f0' }}>Status</th>
                                    <th style={{ padding: '14px 18px', background: '#f0f0f0' }}>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.chapters.map(chapter => {
                                    const p = progress[chapter.id] || {};
                                    return (
                                        <tr key={chapter.id} style={{ background: p.highlight_color || '#ffffff', borderBottom: '1px solid #ddd' }}>
                                            <td className="color-cell" style={{ padding: '14px 18px', width: 50, maxWidth: 50 }}>
                                                <ColorPicker
                                                    value={p.highlight_color || '#ffffff'}
                                                    onChange={(hex) => handleProgressUpdate(chapter.id, { highlight_color: hex })}
                                                    label="Highlight"
                                                />
                                            </td>
                                            <td className="sno-cell" data-label="S.No" style={{ padding: '14px 18px', width: 60 }}>{chapter.serial_number}</td>
                                            <td className="chapter-cell" data-label="Chapter" style={{ padding: '14px 18px' }}>{chapter.name}</td>
                                            <td className="status-cell" data-label="Status" style={{ padding: '14px 18px', width: 240 }}>
                                                <textarea
                                                    value={isEditing[chapter.id] ? (editedStatus[chapter.id] || '') : (p.status || '')}
                                                    onChange={(e) => {
                                                        const val = e.target.value.slice(0, 500);
                                                        setEditedStatus(prev => ({ ...prev, [chapter.id]: val }));
                                                        setIsEditing(prev => ({ ...prev, [chapter.id]: true }));
                                                        if (saveTimersRef.current[chapter.id]) clearTimeout(saveTimersRef.current[chapter.id]);
                                                        saveTimersRef.current[chapter.id] = setTimeout(() => saveStatus(chapter.id), 900);
                                                    }}
                                                    style={{ width: '100%', minHeight: 52, padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                                                    placeholder="Enter status..."
                                                />
                                            </td>
                                            <td className="progress-cell" data-label="Progress" style={{ padding: '10px 14px' }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 8,
                                                        fontSize: 12,
                                                        color: '#374151',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ width: 14, height: 14 }}
                                                                checked={p.ncert_done || false}
                                                                onChange={(e) =>
                                                                    handleProgressUpdate(chapter.id, { ncert_done: e.target.checked })
                                                                }
                                                            />
                                                            <span className="checkbox-content">NCERT</span>
                                                        </label>
                                                        <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ width: 14, height: 14 }}
                                                                checked={p.class_notes_done || false}
                                                                onChange={(e) =>
                                                                    handleProgressUpdate(chapter.id, {
                                                                        class_notes_done: e.target.checked,
                                                                    })
                                                                }
                                                            />
                                                            <span className="checkbox-content">Notes</span>
                                                        </label>
                                                        <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ width: 14, height: 14 }}
                                                                checked={p.tab_assignments_done || false}
                                                                onChange={(e) =>
                                                                    handleProgressUpdate(chapter.id, {
                                                                        tab_assignments_done: e.target.checked,
                                                                    })
                                                                }
                                                            />
                                                            <span className="checkbox-content">TA</span>
                                                        </label>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                        <div style={{ flex: 1, paddingRight: 12 }}>
                                                            <div
                                                                style={{
                                                                    fontWeight: 600,
                                                                    fontSize: 12,
                                                                    marginBottom: 6,
                                                                    borderBottom: '2px solid #00000049',
                                                                    paddingBottom: 2,
                                                                }}
                                                            >
                                                                Package
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: 'repeat(2, auto)',
                                                                    gap: '6px 12px',
                                                                }}
                                                            >
                                                                <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{ width: 14, height: 14 }}
                                                                        checked={p.package_cpp_done || false}
                                                                        onChange={(e) =>
                                                                            handleProgressUpdate(chapter.id, {
                                                                                package_cpp_done: e.target.checked,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="checkbox-content">CPP</span>
                                                                </label>
                                                                <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{ width: 14, height: 14 }}
                                                                        checked={p.package_section1_done || false}
                                                                        onChange={(e) =>
                                                                            handleProgressUpdate(chapter.id, {
                                                                                package_section1_done: e.target.checked,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="checkbox-content">S1</span>
                                                                </label>
                                                                <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{ width: 14, height: 14 }}
                                                                        checked={p.package_section2_done || false}
                                                                        onChange={(e) =>
                                                                            handleProgressUpdate(chapter.id, {
                                                                                package_section2_done: e.target.checked,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="checkbox-content">S2</span>
                                                                </label>
                                                                <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{ width: 14, height: 14 }}
                                                                        checked={p.package_section3_done || false}
                                                                        onChange={(e) =>
                                                                            handleProgressUpdate(chapter.id, {
                                                                                package_section3_done: e.target.checked,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="checkbox-content">S3</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div style={{ flex: 1, paddingLeft: 12 }}>
                                                            <div
                                                                style={{
                                                                    fontWeight: 600,
                                                                    fontSize: 12,
                                                                    marginBottom: 6,
                                                                    borderBottom: '2px solid #00000049',
                                                                    paddingBottom: 2,
                                                                }}
                                                            >
                                                                Archive
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{ width: 14, height: 14 }}
                                                                        checked={p.mains_archive_done || false}
                                                                        onChange={(e) =>
                                                                            handleProgressUpdate(chapter.id, {
                                                                                mains_archive_done: e.target.checked,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="checkbox-content">Mains</span>
                                                                </label>
                                                                <label className="chapter-checkbox" style={{ gap: 6 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        style={{ width: 14, height: 14 }}
                                                                        checked={p.advance_archive_done || false}
                                                                        onChange={(e) =>
                                                                            handleProgressUpdate(chapter.id, {
                                                                                advance_archive_done: e.target.checked,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="checkbox-content">Adv</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>



                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChapterTable;
