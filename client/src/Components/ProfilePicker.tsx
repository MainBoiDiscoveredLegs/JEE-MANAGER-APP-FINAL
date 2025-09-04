import React, { useEffect, useState } from 'react';

const images = import.meta.glob('../assets/profilepic-options/*.{png,jpg,jpeg}', { eager: true, import: 'default' });
const PICKS = Object.values(images) as string[];

const STORAGE_KEY = 'sp_selected_pfp';

const ProfilePicker: React.FC<{ className?: string; size?: number }> = ({ className, size = 48 }) => {
  const [open, setOpen] = useState(false);
  const defaultPick = PICKS && PICKS.length ? PICKS[0] : '';
  const [selected, setSelected] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || defaultPick;
    } catch {
      return defaultPick;
    }
  });
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    try {
      if (selected) localStorage.setItem(STORAGE_KEY, selected);
    } catch (_) { }
  }, [selected]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!btnRef.current) return;
      const el = btnRef.current as HTMLElement;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [open]);

  const openPicker = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popupWidth = Math.min(300, window.innerWidth - 40);
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - popupWidth - 12);
      }
      const top = rect.bottom + 8;
      setPopupPos({ left, top });
    }
    setOpen(true);
  };

  return (
    <div style={{ position: 'relative' }} className={className}>
      <button
        ref={btnRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPicker())}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 4,
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
      >
        <img
          src={selected}
          alt="Profile"
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(0,0,0,0.1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />
      </button>

      {open && popupPos && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: 'fixed',
            left: popupPos.left,
            top: popupPos.top,
            background: '#fff',
            border: '1px solid #e0e0e0',
            padding: 16,
            borderRadius: 12,
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            zIndex: 1200,
            width: Math.min(320, window.innerWidth - 40),
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: 10,
            }}
          >
            {PICKS.map((src) => (
              <button
                key={src}
                onClick={() => {
                  setSelected(src);
                  setOpen(false);
                }}
                style={{
                  border: selected === src ? '2px solid var(--ds-accent, #e546cbff)' : '2px solid transparent',
                  padding: 10,
                  borderRadius: 10,
                  background: selected === src ? 'rgba(79,70,229,0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src={src}
                  alt="choice"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    objectFit: 'cover',
                    boxShadow: selected === src ? '0 0 8px rgba(79,70,229,0.4)' : '0 1px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f9fafb')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePicker;
