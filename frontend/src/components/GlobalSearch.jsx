import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users, FileText, X, ArrowRight } from 'lucide-react';
import { apiCall } from '../services/api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Atajo de teclado: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click fuera para cerrar
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiCall(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch {
        // Si el endpoint no existe todavía, hacemos búsqueda local
        const [props, clients] = await Promise.allSettled([
          apiCall(`/propiedades?search=${encodeURIComponent(query.trim())}&limit=5`),
          apiCall(`/clientes?search=${encodeURIComponent(query.trim())}&limit=5`),
        ]);
        setResults({
          propiedades: props.status === 'fulfilled' ? (props.value?.data || []).slice(0, 4) : [],
          clientes: clients.status === 'fulfilled' ? (clients.value?.data || []).slice(0, 4) : [],
          documentos: [],
        });
      } finally {
        setLoading(false);
      }
    }, 280);
  }, [query]);

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
    setResults(null);
  };

  const total = results
    ? (results.propiedades?.length || 0) + (results.clientes?.length || 0) + (results.documentos?.length || 0)
    : 0;

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
      {/* Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={15} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar propiedades, clientes… (⌘K)"
          style={{
            width: '100%',
            padding: '0.45rem 2rem 0.45rem 2.1rem',
            borderRadius: 8,
            border: '1.5px solid var(--border)',
            fontSize: '0.85rem',
            background: 'var(--bg-light)',
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); }}
            style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {open && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', borderRadius: 12, border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 9999, overflow: 'hidden', minWidth: 340
        }}>
          {loading && (
            <div style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Buscando...
            </div>
          )}

          {!loading && results && total === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No se encontraron resultados para "<strong>{query}</strong>"
            </div>
          )}

          {!loading && results && total > 0 && (
            <>
              {results.propiedades?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    Propiedades
                  </div>
                  {results.propiedades.map(p => (
                    <button key={p.id} onClick={() => goTo(`/propiedades/${p.id}`)}
                      style={{ width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={14} color="var(--primary)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{p.zona} · {p.tipo}</div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}

              {results.clientes?.length > 0 && (
                <div style={{ borderTop: results.propiedades?.length > 0 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    Clientes &amp; Leads
                  </div>
                  {results.clientes.map(c => (
                    <button key={c.id} onClick={() => goTo(`/clientes`)}
                      style={{ width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                        {c.nombre?.[0]}{c.apellidos?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{c.nombre} {c.apellidos}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{c.email || c.telefono} · {c.estado}</div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}

              {results.documentos?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ padding: '8px 14px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    Documentos
                  </div>
                  {results.documentos.map(d => (
                    <button key={d.id} onClick={() => goTo('/documentos')}
                      style={{ width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={14} color="#D97706" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{d.titulo || d.nombre}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{d.tipo}</div>
                      </div>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-light)', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
