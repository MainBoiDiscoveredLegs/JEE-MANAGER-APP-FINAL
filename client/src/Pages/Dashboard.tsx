import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, ArrowClockwise } from 'phosphor-react';
import { NavLink, useNavigate } from 'react-router-dom';
import API from '../api';
import ChapterTable from '../Components/Dashboard/ChapterTable';

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface Chapter {
  id: number;
  subject: string;
  phase: number;
  name: string;
  serial_number: number;
}

interface Progress {
  id: number;
  chapter: number;
  status: string;
  highlight_color?: string;
  updated_date?: string;
  ncert_done: boolean;
  package_cpp_done: boolean;
  package_section1_done: boolean;
  package_section2_done: boolean;
  package_section3_done: boolean;
  mains_archive_done: boolean;
  advance_archive_done: boolean;
  tab_assignments_done: boolean;
  class_notes_done: boolean;

}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<number | null>(null);
  const navigate = useNavigate();

  
  const fetchData = async () => {
    try {
      const [meRes, chRes, prRes] = await Promise.all([
        API.get('me/'),
        API.get('chapters/'),
        API.get('progress/'),
      ]);
      setUser(meRes.data);
      setChapters(chRes.data);
      setProgress(prRes.data);
    } catch (err) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await fetchData();
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const filteredChapters = useMemo(() => {
    return chapters.filter(chapter => {
      if (phaseFilter && chapter.phase !== phaseFilter) return false;
      if (subjectFilter && chapter.subject !== subjectFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          chapter.name.toLowerCase().includes(searchLower) ||
          chapter.subject.toLowerCase().includes(searchLower) ||
          String(chapter.serial_number).includes(searchLower)
        );
      }
      return true;
    });
  }, [chapters, phaseFilter, subjectFilter, search]);

  const totalChapters = filteredChapters.length;
  const totalUpdated = useMemo(
    () => {
      const filteredChapterIds = new Set(filteredChapters.map(c => c.id));
      return progress.filter(p =>
        filteredChapterIds.has(p.chapter) &&
        (p.status || '').trim().length > 0
      ).length;
    },
    [progress, filteredChapters]
  );
  const completionPct = useMemo(() => {
    if (totalChapters === 0) return 0;
    return Math.min(100, Math.round((totalUpdated / totalChapters) * 100));
  }, [totalChapters, totalUpdated]);

  const recentActivity = useMemo(() => {
    const items = [...progress]
      .sort((a, b) => {
        const ta = a.updated_date ? new Date(a.updated_date).getTime() : 0;
        const tb = b.updated_date ? new Date(b.updated_date).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 8);
    return items;
  }, [progress]);

  if (loading) {
    return (
      <div className="ds-container">
        <div className="grid-12">
          <div className="col-12 ds-card ds-card-pad">
            <div className="skeleton" style={{ height: 20, width: 160, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-container db-layout" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace' }}>
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
      .db-layout{
          display:flex;
          gap:24px;
          align-items:flex-start;
          padding:22px;
      }
      .filters-row{
          background: #fff;
          padding: 12px 16px;
          border-radius:10px;
          margin-bottom:18px;
          display:flex;
          gap:12px;
          align-items:center 
      }
      .filters-row .filter-group{
          display:flex;
          gap:8px;
          align-items:center 
      }
      .db-sidebar{
          width:220px;
          background: linear-gradient(180deg, rgba(7,10,20,0.9), rgba(3,6,12,0.85));
          color: #e6eef8;
          padding:18px;
          border-radius:12px;
          box-shadow: 0 8px 30px rgba(2,6,23,0.45);
          border: 1px solid rgba(255,255,255,0.03) 
      }
      .db-brand{
          display:flex;
          align-items:center;
          gap:10px;
          font-weight:700;
          font-size:15px 
      }
      .db-brand > span:first-child{
          display:inline-block;
          width:12px;
          height:12px;
          border-radius:50%;
          background:var(--ds-accent);
          box-shadow: 0 0 12px rgba(215,73,134,.45) 
      }
      .db-nav{
          display:flex;
          flex-direction:column;
          gap:6px;
          margin-top:10px 
      }
      .db-nav a, .db-nav button{
          color:inherit;
          text-decoration:none;
          padding:8px 10px;
          border-radius:8px;
          font-weight:600;
          background:transparent;
          border:none;
          text-align:left 
      }
      .db-nav a[aria-current="page"], .db-nav a.active{
          background: rgba(255,255,255,0.03);
          color: var(--ds-accent);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.01) 
      }
      .db-nav button.ds-focus-ring{
          cursor:pointer 
      }
      .db-main{
          flex:1 
      }
      .db-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:18px 
      }
      .db-search{
          display:flex;
          align-items:center;
          gap:8px;
          background:var(--ds-surface);
          padding:8px 12px;
          border-radius:10px;
          border:1px solid var(--ds-border);
          min-width:320px 
      }
      .db-search svg{
          color:var(--ds-muted) 
      }
      .db-search input{
          border:0;
          background:transparent;
          outline:none;
          width:100%;
          color:var(--ds-on-surface);
          font-family:inherit 
      }
      .db-actions{
          display:flex;
          align-items:center 
      }
      .db-actions .ds-btn{
          margin-left:8px 
      }
      .ds-card.ds-card-pad{
          padding:18px;
          border-radius:12px;
          box-shadow: 0 6px 20px rgba(8,16,24,0.06);
          border: 1px solid rgba(15,23,42,0.06) 
      }
      .kpi{
          padding:14px;
          border-radius:12px;
          background: linear-gradient(180deg, rgba(255,255,255,0.01), transparent);
          margin-bottom:12px 
      }
      .kpi h4{
          margin:0;
          font-size:13px;
          color:var(--ds-muted);
          font-weight:700 
      }
      .kpi-value{
          font-size:28px;
          font-weight:800;
          margin-top:6px;
          color:var(--ds-text) 
      }
      .kpi-bar{
          height:10px;
          background: rgba(15,23,42,0.05);
          border-radius:999px;
          margin-top:12px;
          overflow:hidden 
      }
      .kpi-bar i{
          display:block;
          height:100%;
          background: linear-gradient(90deg, var(--ds-accent), rgba(215,73,134,0.6));
          border-radius:999px;
          width:0;
          transition: width .6s cubic-bezier(.2,.9,.2,1) 
      }
      .activity h2{
          margin-top:0 
      }
      .activity-wrap{
          display:flex;
          flex-direction:column;
          gap:12px 
      }
      .activity-card{
          background: transparent;
          border: none;
          padding: 0;
      }
      .activity-list{
          list-style:none;
          margin:0;
          padding:0;
          display:flex;
          flex-direction:column;
          gap:12px;
          max-height:360px;
          overflow-y:auto 
      }
      .activity-list li{
          display:flex;
          gap:10px;
          align-items:flex-start;
          background:var(--ds-surface);
          padding:12px;
          border-radius:10px;
          border:1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 6px 20px rgba(8,16,24,0.06) 
      }
      .progress-card{
          background:var(--ds-surface);
          border:1px solid var(--ds-border);
          padding:12px;
          border-radius:10px 
      }
      .progress-label{
          font-size:12px;
          color:var(--ds-muted);
          font-weight:700 
      }
      .progress-value{
          font-size:20px;
          font-weight:800;
          margin-top:6px 
      }
      .activity, .activity * {
          color: #272727 !important 
      }
      .dot{
          width:10px;
          height:10px;
          border-radius:50%;
          background: linear-gradient(180deg,var(--ds-accent), rgba(215,73,134,.6));
          box-shadow: 0 6px 18px rgba(215,73,134,0.12);
          flex:0 0 10px 
      }
      @media (max-width: 900px){
          .db-sidebar{
              display:none 
          }
          .db-layout{
              padding:12px;
              flex-direction: column 
          }
          .col-8, .col-4{
              width:100% 
          }
          .filters-row {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
          }
          .filters-row > div:last-child {
              grid-column: 1 / -1;
          }
          .filter-group {
              width: 100% 
          }
          .filter-group label {
              display: block;
              margin-bottom: 4px 
          }
          .filter-group select {
              width: 100%;
              height: 40px;
              padding: 8px 12px;
              border-radius: 8px;
              border: 1px solid var(--ds-border);
              background: var(--ds-surface);
              color: var(--ds-on-surface);
              font-family: inherit;
          }
          .db-search {
              width: 100% 
          }
          .filters-search {
              height: 40px 
          }
          .activity-list {
              max-height: none 
          }
      }
      @media (max-width: 600px){
          .db-layout {
              padding: 8px 
          }
          .filters-row {
              padding: 10px 
          }
          .ds-card.ds-card-pad {
              padding: 12px 
          }
          table {
              font-size: 14px 
          }
          td, th {
              padding: 10px !important 
          }
      }
          `}</style>

      <section className="db-main">

        <div className="filters-row">
          <div className="filter-group">
            <label style={{ fontSize: 12, color: 'var(--ds-muted)' }}>Phase</label>
            <select
              value={phaseFilter ?? ''}
              onChange={(e) => setPhaseFilter(e.target.value ? Number(e.target.value) : null)}
              style={{ padding: '8px 10px', borderRadius: 8, fontFamily: 'inherit', background: 'var(--ds-surface)', border: '1px solid rgba(0, 0, 0, 0.2)', color: 'var(--ds-on-surface)' }}
            >
              <option value="">All Phases</option>
              {Array.from(new Set(chapters.map((c) => c.phase))).sort((a, b) => a - b).map((p) => (
                <option key={String(p)} value={String(p)}>Phase {p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label style={{ fontSize: 12, color: 'var(--ds-muted)' }}>Subject</label>
            <select
              value={subjectFilter ?? ''}
              onChange={(e) => setSubjectFilter(e.target.value || null)}
              style={{ padding: '8px 10px', borderRadius: 8, fontFamily: 'inherit', background: 'var(--ds-surface)', border: '1px solid rgba(0, 0, 0, 0.2)', color: 'var(--ds-on-surface)' }}
            >
              <option value="">All Subjects</option>
              {Array.from(new Set(chapters.map(c => c.subject))).sort().map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <div className="filters-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ds-surface)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.2)' }}>
              <MagnifyingGlass size={16} weight="regular" color="var(--ds-muted)" aria-hidden />
              <input aria-label="Search Chapters" placeholder="Search Chapters..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>

        <div className="grid-12">
          <div className="col-8 ds-card ds-card-pad">
            <ChapterTable subjectFilter={subjectFilter} phaseFilter={phaseFilter} search={search} />
          </div>

          <aside className="col-4 activity" aria-label="Recent activity" style={{ background: 'transparent', padding: 0 }}>
            <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ marginTop: 0 }}>Recent Activity</h2>
                <button
                  onClick={fetchData}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 15,
                  }}
                  aria-label="Refresh Recent Activity"
                >
                  <ArrowClockwise size={18} weight="bold" color="var(--ds-accent)" />
                </button>
              </div>

              <ul className="activity-list">
                {recentActivity.length === 0 ? (
                  <li className="ds-muted">No recent activity</li>
                ) : recentActivity.map((item) => (
                  <li key={item.id}>
                    <span className="dot" aria-hidden="true" />
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {(() => {
                          const ch = chapters.find(c => c.id === (item.chapter as unknown as number));
                          return ch ? ch.name : `Chapter ${item.chapter}`;
                        })()}
                      </div>
                      <div style={{ color: 'var(--ds-muted)', fontSize: 13 }}>
                        Status: "{(item.status || '').slice(0, 80) || '—'}"
                      </div>
                      <div style={{ color: 'var(--ds-muted)', fontSize: 12 }}>
                        {item.updated_date ? new Date(item.updated_date).toLocaleString() : '—'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
              <div className="progress-label">
                Total Chapters
                {(subjectFilter || phaseFilter || search) && (
                  <div style={{ fontSize: '11px', color: 'var(--ds-muted)', marginTop: '4px' }}>
                    {[
                      subjectFilter && `Subject: ${subjectFilter}`,
                      phaseFilter && `Phase: ${phaseFilter}`,
                      search && `Search: "${search}"`
                    ].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>
              <div className="progress-value">{totalChapters}</div>
              <div className="kpi-bar" style={{ marginTop: 8 }}>
                <i style={{ width: `${Math.min(100, (totalChapters / chapters.length) * 100)}%` }} />
              </div>
            </div>

            <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
              <div className="progress-label">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Material Progress
                  <button
                    onClick={fetchData}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 5,
                    }}
                    aria-label="Refresh Recent Activity"
                  >
                    <ArrowClockwise size={18} weight="bold" color="var(--ds-accent)" />
                  </button>

                </div>
                {(subjectFilter || phaseFilter) && (
                  <div style={{ fontSize: '11px', color: 'var(--ds-muted)', marginTop: '4px' }}>
                    {[
                      subjectFilter && `Subject: ${subjectFilter}`,
                      phaseFilter && `Phase: ${phaseFilter}`
                    ].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>

              {(() => {
                const total = filteredChapters.length || 1;
                const counts = {
                  "NCERT": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.ncert_done).length,
                  "Tab Assignments": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.tab_assignments_done).length,
                  "Package CPP": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.package_cpp_done).length,
                  "Section 1": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.package_section1_done).length,
                  "Section 2": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.package_section2_done).length,
                  "Section 3": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.package_section3_done).length,
                  "Mains": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.mains_archive_done).length,
                  "Advance": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.advance_archive_done).length,
                  "Class Notes": progress.filter(p => filteredChapters.some(c => c.id === p.chapter) && p.class_notes_done).length,
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    {Object.entries(counts).map(([label, value]) => {
                      const pct = Math.round((value / total) * 100);
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                            <span>{label}</span>
                            <span>{value}/{total}</span>
                          </div>
                          <div className="kpi-bar">
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>


            <div className="ds-card ds-card-pad">
              <div className="progress-label">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Updated (Has Status)
                  <button
                    onClick={fetchData}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 5,
                    }}
                    aria-label="Refresh Recent Activity"
                  >
                    <ArrowClockwise size={18} weight="bold" color="var(--ds-accent)" />
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ds-muted)', marginTop: '4px' }}>
                  {totalUpdated} of {totalChapters} chapters
                </div>
              </div>
              <div className="progress-value">{totalUpdated}</div>
              <div className="kpi-bar" style={{ marginTop: 8 }}>
                <i style={{ width: `${Math.min(100, totalChapters > 0 ? (totalUpdated / totalChapters) * 100 : 0)}%` }} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
