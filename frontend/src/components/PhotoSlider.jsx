import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react';

// Base del backend — necesario para resolver URLs relativas /api/uploads/...
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

/**
 * Resuelve la URL de una foto:
 * - urlDrive relativa (/api/uploads/...) → se prefija con el host del backend
 * - urlDrive absoluta (https://...) → se usa directamente
 * - url, preview → fallbacks
 */
function getFotoSrc(foto) {
  if (!foto) return null;
  if (foto.urlDrive) {
    // URL relativa del backend local (ej: /api/uploads/foto.jpg)
    if (foto.urlDrive.startsWith('/')) return `${BACKEND_URL}${foto.urlDrive}`;
    return foto.urlDrive;
  }
  if (foto.url) {
    if (foto.url.startsWith('/')) return `${BACKEND_URL}${foto.url}`;
    return foto.url;
  }
  if (foto.preview) return foto.preview;
  return null;
}


export default function PhotoSlider({ fotos = [], onAddPhotos, onDeletePhoto }) {
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx(i => (i - 1 + fotos.length) % fotos.length);
  const next = () => setIdx(i => (i + 1) % fotos.length);

  const fotoActual = fotos[idx];
  const src = getFotoSrc(fotoActual);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#1A3A5C,#4A6FA5)', position: 'relative', height: '100%' }}>
      {/* Imagen principal */}
      {src ? (
        <img
          src={src}
          alt={fotoActual?.nombre || `Foto ${idx + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : fotos.length === 0 ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: '4rem' }}>🏠</span>
          {onAddPhotos && (
            <button
              onClick={onAddPhotos}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, color: 'white', padding: '8px 18px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              + Añadir fotos o PDF
            </button>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2A4A6C' }}>
          <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Sin preview</span>
        </div>
      )}

      {/* Gradiente inferior */}
      {fotos.length > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', pointerEvents: 'none' }} />
      )}

      {/* Contador */}
      {fotos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: '0.75rem', padding: '2px 10px', borderRadius: 20, fontWeight: 600, pointerEvents: 'none' }}>
          {idx + 1} / {fotos.length}
        </div>
      )}

      {/* Dots */}
      {fotos.length > 1 && fotos.length <= 12 && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {fotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 4, background: i === idx ? 'white' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }}
            />
          ))}
        </div>
      )}

      {/* Flechas */}
      {fotos.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Botones top-right */}
      {fotos.length > 0 && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
          {onDeletePhoto && fotoActual?.id && (
            <button
              onClick={() => onDeletePhoto(fotoActual.id)}
              style={{ background: 'rgba(220, 38, 38, 0.65)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
          {onAddPhotos && (
            <button
              onClick={onAddPhotos}
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}
            >
              <ImagePlus size={13} /> Añadir fotos
            </button>
          )}
        </div>
      )}

      {/* Thumbnails */}
      {fotos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 4, padding: '0 8px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {fotos.map((f, i) => {
            const thumbSrc = getFotoSrc(f);
            return (
              <button
                key={f.id || i}
                onClick={() => setIdx(i)}
                style={{ flexShrink: 0, width: 48, height: 36, borderRadius: 5, overflow: 'hidden', border: i === idx ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, background: '#1A3A5C', transition: 'border 0.15s' }}
              >
                {thumbSrc
                  ? <img src={thumbSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🖼</div>
                }
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
