import React from 'react'

export function Avatar({ charIdx, size = 'md', className = '', glow = false }) {
  const isVega = charIdx === 0
  const isRaven = charIdx === 1
  const isCipher = charIdx === 2

  // Dimensions
  const dim = size === 'huge' ? 140 : size === 'lg' ? 72 : size === 'sm' ? 36 : 56

  return (
    <div
      className={`avatar-box avatar-${size} ${glow ? 'glow' : ''} ${className}`}
      style={{ width: `${dim}px`, height: `${dim * 1.18}px` }}
      aria-label={isVega ? 'Vega portrait' : isRaven ? 'Raven portrait' : 'Cipher portrait'}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="avatar-svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id={`bg-${charIdx}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isVega && (
              <>
                <stop offset="0%" stopColor="#0b2028" />
                <stop offset="100%" stopColor="#133644" />
              </>
            )}
            {isRaven && (
              <>
                <stop offset="0%" stopColor="#241115" />
                <stop offset="100%" stopColor="#3d1b22" />
              </>
            )}
            {isCipher && (
              <>
                <stop offset="0%" stopColor="#251c0a" />
                <stop offset="100%" stopColor="#3d2e11" />
              </>
            )}
          </linearGradient>

          <linearGradient id={`accent-${charIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isVega ? '#6fd3e8' : isRaven ? '#e8707e' : '#e6b84f'} />
            <stop offset="100%" stopColor={isVega ? '#1a7589' : isRaven ? '#912a36' : '#8e6b1d'} />
          </linearGradient>
        </defs>

        {/* Background Frame */}
        <rect width="100" height="120" rx="4" fill={`url(#bg-${charIdx})`} />

        {/* Ambient Grid / Scanning Lines */}
        <path
          d="M0 20 H100 M0 40 H100 M0 60 H100 M0 80 H100 M0 100 H100"
          stroke={isVega ? 'rgba(111,211,232,0.08)' : isRaven ? 'rgba(232,112,126,0.08)' : 'rgba(230,184,79,0.08)'}
          strokeWidth="1"
        />

        {/* --- VEGA: Cryptanalyst --- */}
        {isVega && (
          <g className="art-vega">
            {/* Tech Binary stream backdrop */}
            <text x="6" y="24" fill="rgba(111,211,232,0.22)" fontSize="8" fontFamily="monospace">01101001</text>
            <text x="6" y="38" fill="rgba(111,211,232,0.18)" fontSize="8" fontFamily="monospace">10110010</text>
            <text x="56" y="30" fill="rgba(111,211,232,0.2)" fontSize="8" fontFamily="monospace">ENCR_77</text>

            {/* Shoulders & Turtleneck */}
            <path d="M14 120 C14 96 32 88 50 88 C68 88 86 96 86 120 Z" fill="#0d1b22" />
            <path d="M38 88 C38 82 42 78 50 78 C58 78 62 82 62 88 Z" fill="#182c37" stroke="#6fd3e8" strokeWidth="1" />

            {/* Head & Neck */}
            <rect x="44" y="68" width="12" height="14" fill="#a4b4bb" />
            <path d="M32 50 C32 30 68 30 68 50 C68 66 58 72 50 72 C42 72 32 66 32 50 Z" fill="#b9cbd3" />

            {/* Hair - Sharp geometric cut */}
            <path d="M28 44 C28 26 72 24 72 44 C72 50 70 56 68 60 C66 40 60 34 50 34 C38 34 32 46 28 44 Z" fill="#091419" />
            <path d="M28 44 L32 62 L36 50 Z" fill="#091419" />

            {/* Headset wire */}
            <path d="M30 48 Q26 72 42 78" stroke="#6fd3e8" strokeWidth="1.5" fill="none" opacity="0.8" />
            <circle cx="30" cy="48" r="4" fill="#6fd3e8" />

            {/* Cyber Glasses / HUD */}
            <rect x="35" y="44" width="13" height="7" rx="1.5" fill="#6fd3e8" fillOpacity="0.85" />
            <rect x="52" y="44" width="13" height="7" rx="1.5" fill="#6fd3e8" fillOpacity="0.85" />
            <line x1="48" y1="47" x2="52" y2="47" stroke="#6fd3e8" strokeWidth="2" />
            <line x1="37" y1="47.5" x2="45" y2="47.5" stroke="#ffffff" strokeWidth="1" />

            {/* Glint & Lips */}
            <path d="M46 62 Q50 63 54 62" stroke="#607682" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {/* --- RAVEN: Field Operative --- */}
        {isRaven && (
          <g className="art-raven">
            {/* Fog / Rain backdrop */}
            <line x1="12" y1="10" x2="6" y2="34" stroke="rgba(232,112,126,0.2)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="88" y1="18" x2="82" y2="46" stroke="rgba(232,112,126,0.18)" strokeWidth="1" strokeDasharray="4 3" />

            {/* Heavy Trench Coat & Upright Collars */}
            <path d="M8 120 C8 92 28 84 50 84 C72 84 92 92 92 120 Z" fill="#1a0c0f" />
            {/* Turned up collar left & right */}
            <polygon points="26,84 38,62 48,84" fill="#2d1419" stroke="#e8707e" strokeWidth="0.8" />
            <polygon points="74,84 62,62 52,84" fill="#2d1419" stroke="#e8707e" strokeWidth="0.8" />
            <path d="M46 84 L50 120 L54 84 Z" fill="#3f1922" />

            {/* Face in shadow */}
            <path d="M34 50 C34 32 66 32 66 50 C66 66 58 72 50 72 C42 72 34 66 34 50 Z" fill="#614347" />

            {/* Deep Shadow Fedora */}
            {/* Fedora Crown */}
            <path d="M30 38 C32 20 68 20 70 38 Z" fill="#15080b" />
            <path d="M42 22 L50 26 L58 22" stroke="#e8707e" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
            {/* Hat Band */}
            <path d="M28 36 Q50 38 72 36 L72 39 Q50 41 28 39 Z" fill="#e8707e" />
            {/* Angled Wide Brim */}
            <path d="M18 40 Q50 43 82 36 Q84 41 50 45 Q16 43 18 40 Z" fill="#0c0406" />

            {/* Shadow cast over eyes */}
            <path d="M28 42 Q50 46 72 40 L72 54 Q50 58 28 54 Z" fill="rgba(12,4,6,0.7)" />

            {/* Sharp Eyes glowing in the shadow */}
            <line x1="39" y1="50" x2="45" y2="50" stroke="#ff8594" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="55" y1="50" x2="61" y2="50" stroke="#ff8594" strokeWidth="1.8" strokeLinecap="round" />

            {/* Stubble / Jawline */}
            <path d="M47 64 H53" stroke="#e8707e" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
          </g>
        )}

        {/* --- CIPHER: Station Liaison --- */}
        {isCipher && (
          <g className="art-cipher">
            {/* Architectural / Embassy emblem backdrop */}
            <circle cx="50" cy="30" r="18" stroke="rgba(230,184,79,0.14)" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M50 16 L50 44 M36 30 L64 30" stroke="rgba(230,184,79,0.12)" strokeWidth="0.8" />

            {/* Suit Shoulders & Lapels */}
            <path d="M12 120 C12 90 30 82 50 82 C70 82 88 90 88 120 Z" fill="#19150c" />
            {/* White shirt & tie */}
            <polygon points="42,82 58,82 50,104" fill="#dfd6c0" />
            <polygon points="48,86 52,86 51,114 49,114" fill="#992015" />
            {/* Suit Lapels */}
            <polygon points="30,82 46,108 40,120 18,120" fill="#292011" stroke="#e6b84f" strokeWidth="0.7" />
            <polygon points="70,82 54,108 60,120 82,120" fill="#292011" stroke="#e6b84f" strokeWidth="0.7" />
            {/* Gold Lapel Pin */}
            <circle cx="34" cy="94" r="2" fill="#e6b84f" />

            {/* Head & Neck */}
            <rect x="45" y="70" width="10" height="14" fill="#c4aa82" />
            <path d="M33 48 C33 28 67 28 67 48 C67 65 59 71 50 71 C41 71 33 65 33 48 Z" fill="#d8c09a" />

            {/* Slicked-back neat diplomatic hair */}
            <path d="M31 44 C31 24 69 22 69 44 C69 47 67 52 66 54 C63 32 58 26 50 26 C40 26 34 34 31 44 Z" fill="#2b1f0a" />

            {/* Gold Wireframe Round Glasses */}
            <circle cx="42" cy="48" r="6" stroke="#e6b84f" strokeWidth="1.4" fill="rgba(255,255,255,0.12)" />
            <circle cx="58" cy="48" r="6" stroke="#e6b84f" strokeWidth="1.4" fill="rgba(255,255,255,0.12)" />
            <line x1="48" y1="48" x2="52" y2="48" stroke="#e6b84f" strokeWidth="1.4" />
            <circle cx="42" cy="48" r="1.5" fill="#2b1f0a" />
            <circle cx="58" cy="48" r="1.5" fill="#2b1f0a" />

            {/* Knowing Diplomat Smile */}
            <path d="M45 61 Q51 64 57 60" stroke="#523d1d" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* Outer Photo Vignette & Border */}
        <rect
          x="1"
          y="1"
          width="98"
          height="118"
          rx="3"
          stroke={isVega ? '#6fd3e8' : isRaven ? '#e8707e' : '#e6b84f'}
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* Stamp Initial in Corner */}
        <g opacity="0.6">
          <circle cx="86" cy="14" r="8" fill="rgba(0,0,0,0.5)" />
          <text
            x="86"
            y="18"
            fill={isVega ? '#6fd3e8' : isRaven ? '#e8707e' : '#e6b84f'}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            {isVega ? 'V' : isRaven ? 'R' : 'C'}
          </text>
        </g>
      </svg>
    </div>
  )
}
