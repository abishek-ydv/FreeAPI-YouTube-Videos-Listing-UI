import { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_URL = 'https://api.freeapi.app/api/v1/public/youtube/videos';

function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = m[1] ? parseInt(m[1]) : 0;
  const min = m[2] ? parseInt(m[2]) : 0;
  const sec = m[3] ? parseInt(m[3]) : 0;
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function formatCount(n) {
  const num = parseInt(n);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

function App() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  const [playing, setPlaying] = useState(null);
  const [descOpen, setDescOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('vf-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vf-theme', theme);
  }, [theme]);

  const fetchVideos = async (p) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?page=${p}&limit=8`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch');
      setVideos(json.data.data);
      setTotalPages(json.data.totalPages);
      setTotalItems(json.data.totalItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVideos(page); }, [page]);

  const allTags = useMemo(() => {
    const s = new Set();
    videos.forEach(v => (v.items?.snippet?.tags || []).forEach(t => s.add(t)));
    return ['All', ...Array.from(s).sort().slice(0, 10)];
  }, [videos]);

  const filtered = useMemo(() => {
    return videos.filter(v => {
      const sn = v.items?.snippet;
      if (!sn) return false;
      const q = search.toLowerCase();
      const ms = !q || sn.title.toLowerCase().includes(q) || sn.channelTitle.toLowerCase().includes(q);
      const mt = tagFilter === 'All' || (sn.tags || []).some(t => t.toLowerCase() === tagFilter.toLowerCase());
      return ms && mt;
    });
  }, [videos, search, tagFilter]);

  const sidebarVideos = useMemo(() => {
    if (!playing) return [];
    return videos.filter(v => v.items.id !== playing.items.id);
  }, [videos, playing]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const handlePlay = (video) => {
    setPlaying(video);
    setDescOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ps = playing?.items?.snippet;
  const pSt = playing?.items?.statistics;

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          VidFlow
        </div>
        <div className="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          <input type="text" placeholder="Search videos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="nav-right">
          <span className="nav-stats">{totalItems} videos</span>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>
        </div>
      </nav>

      {playing && ps ? (
        <div className="watch-page" key={playing.items.id}>
          <div className="watch-primary">
            <div className="player-container">
              <iframe
                src={`https://www.youtube.com/embed/${playing.items.id}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={ps.title}
              />
            </div>
            <div className="watch-info">
              <h1 className="watch-title">{ps.title}</h1>
              <div className="watch-row">
                <div className="channel-info">
                  <div className="ch-avatar">{ps.channelTitle?.charAt(0)}</div>
                  <div className="ch-meta">
                    <div className="ch-name">{ps.channelTitle}</div>
                    <div className="ch-sub-label">Channel</div>
                  </div>
                </div>
                <div className="action-group">
                  <button className="action-pill">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                    {formatCount(pSt.likeCount)}
                  </button>
                  <button className="action-pill">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {formatCount(pSt.commentCount)}
                  </button>
                  <button className="action-pill primary" onClick={() => setPlaying(null)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="m6 9-3 3 3 3"/></svg>
                    Back
                  </button>
                </div>
              </div>
              <div className="desc-box">
                <div className="desc-head">{formatCount(pSt.viewCount)} views · {timeAgo(ps.publishedAt)}</div>
                {ps.tags && (
                  <div className="desc-tags">
                    {ps.tags.slice(0, 8).map(t => <span key={t} className="desc-tag">#{t}</span>)}
                  </div>
                )}
                <p className={`desc-body ${descOpen ? 'open' : ''}`}>{ps.description}</p>
                <button className="toggle-desc" onClick={() => setDescOpen(v => !v)}>{descOpen ? 'Show less' : '...more'}</button>
              </div>
            </div>
          </div>

          <aside className="watch-sidebar">
            <div className="sidebar-label">Up Next</div>
            <div className="sidebar-list">
              {sidebarVideos.map(v => {
                const sn = v.items.snippet;
                const st = v.items.statistics;
                const thumb = sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url;
                return (
                  <div key={v.items.id} className="sb-card" onClick={() => handlePlay(v)}>
                    <div className="sb-thumb">
                      <img src={thumb} alt={sn.title} loading="lazy" />
                      <span className="sb-dur">{parseDuration(v.items.contentDetails.duration)}</span>
                    </div>
                    <div className="sb-text">
                      <div className="sb-title">{sn.title}</div>
                      <div className="sb-ch">{sn.channelTitle}</div>
                      <div className="sb-stats">{formatCount(st.viewCount)} views · {timeAgo(sn.publishedAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      ) : (
        <>
          <div className="tag-chips">
            {allTags.map(t => (
              <button key={t} className={`chip ${tagFilter === t ? 'active' : ''}`} onClick={() => setTagFilter(t)}>{t}</button>
            ))}
          </div>

          {isLoading && <div className="loading-container"><div className="spinner"></div><span>Loading videos...</span></div>}
          {error && <div className="empty-state"><h2>Something went wrong</h2><p>{error}</p></div>}

          {!isLoading && !error && (
            <>
              <div className="videos-grid">
                {filtered.map(v => {
                  const sn = v.items.snippet;
                  const st = v.items.statistics;
                  const thumb = sn.thumbnails?.maxres?.url || sn.thumbnails?.high?.url || sn.thumbnails?.medium?.url;
                  return (
                    <div key={v.items.id} className="vid-card" onClick={() => handlePlay(v)}>
                      <div className="vid-thumb">
                        <img className="vid-thumb-img" src={thumb} alt={sn.title} loading="lazy" />
                        <span className="vid-dur">{parseDuration(v.items.contentDetails.duration)}</span>
                      </div>
                      <div className="vid-meta">
                        <div className="vid-avatar">{sn.channelTitle?.charAt(0)}</div>
                        <div className="vid-text">
                          <div className="vid-title">{sn.title}</div>
                          <div className="vid-ch">{sn.channelTitle}</div>
                          <div className="vid-info">{formatCount(st.viewCount)} views · {timeAgo(sn.publishedAt)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="empty-state"><h2>No videos found</h2><p>Try a different search or tag.</p></div>}
              </div>
              <div className="pagination">
                <button className="pg-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {pageNumbers.map(n => <button key={n} className={`pg-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>)}
                <button className="pg-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default App;
