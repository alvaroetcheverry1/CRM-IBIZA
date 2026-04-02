import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react';

export default function PhotoSlider({ fotos = [], onAddPhotos, onDeletePhoto }) {
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx(i => (i - 1 + fotos.length) % fotos.length);
  const next = () => setIdx(i => (i + 1) % fotos.length);

  const fotoActual = fotos[idx];

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg,#1A3A5C,#4A6FA5)', position: 'relative', height: 300 }}>
      {/* Imagen principal */}
      {fotoActual?.urlDrive ? (
        <img
          src={fotoActual.urlDrive}
          alt={fotoActual.nombre || `Foto ${idx + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : fotos.length === 0 ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🏠</div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2A4A6C' }}>
          <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>Sin preview</span>
        </div>
      )}

      {/* Gradiente inferior */}
      {fotos.length > 0 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
      )}

      {/* Contador */}
      {fotos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: '0.75rem', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
          {idx + 1} / {fotos.length}
        </div>
      )}

      {/* Dots */}
      {fotos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
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

      {/* Botón añadir fotos */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
        {onDeletePhoto && fotos.length > 0 && (
          <button
            onClick={() => onDeletePhoto(fotoActual.id)}
            style={{ background: 'rgba(220, 38, 38, 0.65)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}
          >
            <Trash2 size={13} />
          </button>
        )}
        <button
          onClick={onAddPhotos}
          style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: 'white', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}
        >
          <ImagePlus size={13} /> Añadir fotos
        </button>
      </div>

      {/* Thumbnails */}
      {fotos.length > 1 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 4, padding: '0 8px 8px', overflowX: 'auto' }}>
          {fotos.map((f, i) => (
            <button
              key={f.id || i}
              onClick={() => setIdx(i)}
              style={{ flexShrink: 0, width: 48, height: 36, borderRadius: 5, overflow: 'hidden', border: i === idx ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, background: '#1A3A5C', transition: 'border 0.15s' }}
            >
              {f.urlDrive
                ? <img src={f.urlDrive} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🖼</div>
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
