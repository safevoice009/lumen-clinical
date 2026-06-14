import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export interface CommandItem {
  id: string;
  category: string;
  name: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filtered = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '540px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px' }}>
          <Search size={16} color="var(--fg-muted)" style={{ marginRight: '10px' }} />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--fg-primary)',
              fontSize: '14px',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: '12px' }}>
              No results found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => { cmd.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--brand-subtle)' : 'transparent',
                    color: isSelected ? 'var(--brand)' : 'var(--fg-primary)',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 600
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: isSelected ? 'var(--brand)' : 'var(--fg-muted)', display: 'inline-flex' }}>{cmd.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ color: isSelected ? 'var(--brand)' : 'var(--fg-primary)' }}>{cmd.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--fg-muted)' }}>{cmd.category}</span>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", padding: '2px 6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--fg-muted)' }}>
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
