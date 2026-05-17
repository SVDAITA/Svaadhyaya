const ANIM_ID = "mandala-keyframes";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIM_ID)) return;
  const style = document.createElement("style");
  style.id = ANIM_ID;
  style.textContent = `
    @keyframes mandala-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
    @keyframes mandala-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
  `;
  document.head.appendChild(style);
}

// boost: multiply all element opacities (use >1 in dark mode for visibility).
// Each MandalaSVG uses color-scoped gradient IDs so multiple instances don't conflict.
export default function MandalaSVG({ size = 64, color = "#A65D2E", boost = 1 }) {
  injectKeyframes();

  const c = 50;
  const op = (base) => Math.min(1, base * boost);

  // Unique gradient IDs per color instance
  const gid = `mg${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  const ring = (count, radius, shape) =>
    Array.from({ length: count }).map((_, i) => {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      const x = c + radius * Math.sin(rad);
      const y = c - radius * Math.cos(rad);
      return shape(x, y, angle, i);
    });

  const spin = (dur, dir = "cw") => ({
    animation: `mandala-${dir} ${dur}s linear infinite`,
    transformOrigin: "50px 50px",
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        {/* Radial glow behind lotus — softens "hollow ring" negative space */}
        <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity={op(0.30)} />
          <stop offset="50%"  stopColor={color} stopOpacity={op(0.10)} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {/* Outer diffusion — fills perimeter space, removes "floating in void" look */}
        <radialGradient id={`${gid}-outer`} cx="50%" cy="50%" r="50%">
          <stop offset="55%"  stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity={op(0.06)} />
        </radialGradient>
      </defs>

      {/* Outer diffusion layer — reduces harsh empty perimeter */}
      <circle cx="50" cy="50" r="48" fill={`url(#${gid}-outer)`} />

      {/* ── Ring 1: 16 outer spike tips (pulled in vs original) ── */}
      <g style={spin(60, "cw")}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path
            key={i}
            d="M50,50 L49.1,37 Q50,28 50.9,37 Z"
            fill={color}
            opacity={op(0.30)}
            transform={`rotate(${(i * 360) / 16}, 50, 50)`}
          />
        ))}
      </g>

      {/* ── Ring 2: 8 wide outer lotus petals ── */}
      <g style={spin(40, "ccw")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d="M50,50 Q44,37 50,27 Q56,37 50,50"
            fill={color}
            opacity={op(0.28)}
            transform={`rotate(${(i * 360) / 8}, 50, 50)`}
          />
        ))}
      </g>

      {/* outer dotted ring (static) */}
      <g opacity={op(0.30)}>
        {ring(24, 42, (x, y, _a, i) => (
          <circle key={i} cx={x} cy={y} r="0.8" fill={color} />
        ))}
      </g>

      {/* outer bounding circle */}
      <circle cx="50" cy="50" r="43" fill="none" stroke={color} strokeWidth="0.5" opacity={op(0.18)} />

      {/* ── Ring 3: 8 stroke teardrop petals ── */}
      <g style={spin(28, "cw")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d="M50,50 Q44.5,36 50,26 Q55.5,36 50,50"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            opacity={op(0.42)}
            transform={`rotate(${(i * 360) / 8}, 50, 50)`}
          />
        ))}
      </g>

      {/* mid circle */}
      <circle cx="50" cy="50" r="24" fill="none" stroke={color} strokeWidth="0.5" opacity={op(0.22)} />

      {/* ── CENTRAL GLOW DISC — fills the hollow middle zone ── */}
      <circle cx="50" cy="50" r="26" fill={`url(#${gid}-glow)`} />

      {/* ── LOTUS CENTER: 8 wide petals — dominant visual weight ── */}
      {/* These are the "lotus morphed" center elements, reaching from hub to r≈28 */}
      <g style={spin(22, "cw")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d="M50,50 Q42,38 50,22 Q58,38 50,50"
            fill={color}
            opacity={op(0.68)}
            transform={`rotate(${(i * 360) / 8}, 50, 50)`}
          />
        ))}
      </g>

      {/* ── Inner accent ring: 16 narrow petals between lotus petals ── */}
      <g style={spin(15, "cw")}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path
            key={i}
            d="M50,50 L49.4,39 Q50,34 50.6,39 Z"
            fill={color}
            opacity={op(0.48)}
            transform={`rotate(${(i * 360) / 16}, 50, 50)`}
          />
        ))}
      </g>

      {/* inner dotted ring */}
      <g opacity={op(0.38)}>
        {ring(12, 16, (x, y, _a, i) => (
          <circle key={i} cx={x} cy={y} r="1.0" fill={color} />
        ))}
      </g>

      {/* inner circle */}
      <circle cx="50" cy="50" r="12" fill="none" stroke={color} strokeWidth="0.7" opacity={op(0.45)} />

      {/* ── 6 orbit dots ── */}
      <g style={spin(38, "cw")}>
        {ring(6, 7.5, (x, y, _a, i) => (
          <circle key={i} cx={x} cy={y} r="1.8" fill={color} opacity={op(0.72)} />
        ))}
      </g>

      {/* ── Center 8-petal star ── */}
      <g style={spin(50, "ccw")}>
        {Array.from({ length: 8 }).map((_, i) => (
          <path
            key={i}
            d="M50,50 L49.4,44.5 Q50,41 50.6,44.5 Z"
            fill={color}
            opacity={op(0.88)}
            transform={`rotate(${(i * 360) / 8}, 50, 50)`}
          />
        ))}
      </g>

      {/* Center hub glow ring */}
      <circle cx="50" cy="50" r="6" fill={color} opacity={op(0.22)} />

      {/* Center hub */}
      <circle cx="50" cy="50" r="4.8" fill={color} opacity={op(0.90)} />

      {/* Subtle off-center highlight — softer, not glaring */}
      <circle cx="49.2" cy="48.8" r="1.6" fill="white" opacity={op(0.48)} />
    </svg>
  );
}
