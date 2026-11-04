import React from 'react';

/* ─── CONSTELACIÓN SWARM TECNOLÓGICA MINIMALISTA (Dorado & Cobrizo) ───
   Geometría de alta precisión, nodos sinápticos, marcadores de telemetría
   y enlaces vectoriales en oro champán y cobre cálido.
──────────────────────────────────────────────────────────────────────── */

export function SynnerLogoConstellation({ size = 160, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <radialGradient id="cst-gold" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF9EE" />
          <stop offset="30%" stopColor="#FAD89E" />
          <stop offset="65%" stopColor="#DF9F48" />
          <stop offset="90%" stopColor="#9C5914" />
          <stop offset="100%" stopColor="#5E2C04" />
        </radialGradient>

        <radialGradient id="cst-copper" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE8D1" />
          <stop offset="30%" stopColor="#E59247" />
          <stop offset="65%" stopColor="#B85816" />
          <stop offset="92%" stopColor="#6E2B05" />
          <stop offset="100%" stopColor="#3B1201" />
        </radialGradient>

        <linearGradient id="cst-link" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAD89E" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#D4883B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#823608" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="cst-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAD89E" />
          <stop offset="50%" stopColor="#C87224" />
          <stop offset="100%" stopColor="#783307" />
        </linearGradient>

        <linearGradient id="cst-tech" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE2B8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#B85816" stopOpacity="0.3" />
        </linearGradient>

        <filter id="cst-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#DF9F48" floodOpacity="0.4" />
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      <g filter="url(#cst-glow)">
        {/* ══ TELEMETRÍA TECNOLÓGICA SUTIL (Aerospace / Cyber Reticle) ══ */}
        {/* Marcadores de cuadrante exterior (12 marcas horarias sutiles) */}
        <circle cx="120" cy="120" r="82" stroke="url(#cst-tech)" strokeWidth="1" strokeDasharray="2 12" opacity="0.45" />
        <circle cx="120" cy="120" r="90" stroke="url(#cst-tech)" strokeWidth="0.8" strokeDasharray="1 19" opacity="0.35" />

        {/* ══ RETÍCULA HEXAGONAL DEL ENJAMBRE ══ */}
        <polygon
          points="120,52 179,86 179,154 120,188 61,154 61,86"
          stroke="url(#cst-ring)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.45"
          fill="none"
        />

        {/* ══ ENLACES RADIALES DE CIRCUITO / LÁSER ══ */}
        <line x1="120" y1="120" x2="120" y2="52" stroke="url(#cst-link)" strokeWidth="1.8" />
        <line x1="120" y1="120" x2="179" y2="86" stroke="url(#cst-link)" strokeWidth="1.8" />
        <line x1="120" y1="120" x2="179" y2="154" stroke="url(#cst-link)" strokeWidth="1.8" strokeDasharray="5 3" />
        <line x1="120" y1="120" x2="120" y2="188" stroke="url(#cst-link)" strokeWidth="1.8" />
        <line x1="120" y1="120" x2="61" y2="154" stroke="url(#cst-link)" strokeWidth="1.8" />
        <line x1="120" y1="120" x2="61" y2="86" stroke="url(#cst-link)" strokeWidth="1.8" strokeDasharray="5 3" />

        {/* Anillos orbitales concéntricos */}
        <circle cx="120" cy="120" r="68" stroke="url(#cst-ring)" strokeWidth="2" strokeDasharray="8 6" opacity="0.75" />
        <circle cx="120" cy="120" r="42" stroke="url(#cst-ring)" strokeWidth="1.2" opacity="0.4" />
        <circle cx="120" cy="120" r="32" stroke="url(#cst-tech)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />

        {/* ══ 6 NODOS PRINCIPALES DE ENJAMBRE ══ */}
        {/* 1. Nodo Superior 90° (Oro) */}
        <circle cx="120" cy="52" r="10" fill="url(#cst-gold)" />
        <circle cx="120" cy="52" r="3" fill="#FFFFFF" opacity="0.9" />

        {/* 2. Nodo Superior Derecho 30° (Cobre) */}
        <circle cx="179" cy="86" r="11.5" fill="url(#cst-copper)" />
        <circle cx="179" cy="86" r="4" fill="#FFE2C2" opacity="0.8" />

        {/* 3. Nodo Inferior Derecho 330° (Oro con halo tecnológico) */}
        <circle cx="179" cy="154" r="9.5" fill="url(#cst-gold)" />
        <circle cx="179" cy="154" r="14" stroke="url(#cst-ring)" strokeWidth="1.2" opacity="0.7" fill="none" />
        <circle cx="179" cy="154" r="2.5" fill="#FFFFFF" opacity="0.85" />

        {/* 4. Nodo Inferior 270° (Cobre) */}
        <circle cx="120" cy="188" r="10.5" fill="url(#cst-copper)" />
        <circle cx="120" cy="188" r="3.5" fill="#FFE2C2" opacity="0.8" />

        {/* 5. Nodo Inferior Izquierdo 210° (Oro) */}
        <circle cx="61" cy="154" r="9.5" fill="url(#cst-gold)" />
        <circle cx="61" cy="154" r="3" fill="#FFFFFF" opacity="0.9" />

        {/* 6. Nodo Superior Izquierdo 150° (Cobre con halo tecnológico) */}
        <circle cx="61" cy="86" r="11.5" fill="url(#cst-copper)" />
        <circle cx="61" cy="86" r="16" stroke="url(#cst-ring)" strokeWidth="1.2" opacity="0.7" fill="none" />
        <circle cx="61" cy="86" r="3.5" fill="#FFE2C2" opacity="0.8" />

        {/* ══ MICRO-NODOS DE PROCESAMIENTO / SWARM DRONES ══ */}
        <circle cx="152" cy="66" r="3" fill="#FAD89E" opacity="0.85" />
        <circle cx="188" cy="120" r="3" fill="#E59247" opacity="0.85" />
        <circle cx="152" cy="174" r="2.5" fill="#FAD89E" opacity="0.8" />
        <circle cx="88" cy="174" r="3" fill="#E59247" opacity="0.85" />
        <circle cx="52" cy="120" r="3" fill="#FAD89E" opacity="0.85" />
        <circle cx="88" cy="66" r="2.5" fill="#E59247" opacity="0.8" />

        {/* Micro retículos cardinales (+) */}
        <path d="M 120 30 L 120 36 M 117 33 L 123 33" stroke="url(#cst-tech)" strokeWidth="1" opacity="0.7" />
        <path d="M 206 120 L 212 120 M 209 117 L 209 123" stroke="url(#cst-tech)" strokeWidth="1" opacity="0.7" />
        <path d="M 120 204 L 120 210 M 117 207 L 123 207" stroke="url(#cst-tech)" strokeWidth="1" opacity="0.7" />
        <path d="M 28 120 L 34 120 M 31 117 L 31 123" stroke="url(#cst-tech)" strokeWidth="1" opacity="0.7" />

        {/* ══ NÚCLEO CENTRAL INTELIGENTE / CPU QUANTUM CORE ══ */}
        <circle cx="120" cy="120" r="24" fill="url(#cst-gold)" />
        <circle cx="120" cy="120" r="28" stroke="url(#cst-ring)" strokeWidth="1.5" opacity="0.85" fill="none" />
        <circle cx="120" cy="120" r="30" stroke="url(#cst-tech)" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.6" fill="none" />
        <ellipse cx="112" cy="110" rx="9" ry="5" fill="#FFFFFF" opacity="0.9" transform="rotate(-30 112 110)" />
        <circle cx="110" cy="108" r="2.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

export const SynnerLogo = SynnerLogoConstellation;
