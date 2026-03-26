type BarProps = { completed: number; total: number; label?: string };

/**
 * Horizontální progress – segmentovaný „panelový“ vzhled.
 */
export function ProgressBar({ completed, total, label }: BarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const segments = 12;
  const filled = total > 0 ? Math.round((completed / total) * segments) : 0;

  return (
    <div className="progress-bar-wrap">
      {label && <div className="progress-bar-wrap__label">{label}</div>}
      <div className="progress-bar progress-bar--segments" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
        {Array.from({ length: segments }).map((_, i) => (
          <span key={i} className={`progress-bar__seg ${i < filled ? 'is-on' : ''}`} />
        ))}
      </div>
      <div className="progress-bar-wrap__meta">
        <span className="progress-bar-wrap__value">
          {completed} / {total}
        </span>
        <span className="progress-bar-wrap__pct">{pct}%</span>
      </div>
    </div>
  );
}

type RingProps = { value: number; max: number; size?: number };

/**
 * Kompaktní kruhový ukazatel (technický „gauge“).
 */
export function ProgressRing({ value, max, size = 52 }: RingProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 48 48" className="progress-ring__svg">
        <circle className="progress-ring__track" cx="24" cy="24" r={r} fill="none" strokeWidth="4" strokeLinecap="round" />
        <circle
          className="progress-ring__fill"
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className="progress-ring__label">{pct}</span>
    </div>
  );
}
