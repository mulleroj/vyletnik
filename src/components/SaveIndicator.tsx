import { useEffect, useState } from 'react';
import { IconSave } from './Icons';

type Props = { tick: number };

/**
 * Krátká vizuální zpětná vazba po uložení do IndexedDB.
 * `tick` se zvyšuje při každém uložení.
 */
export function SaveIndicator({ tick }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (tick === 0) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 1800);
    return () => window.clearTimeout(t);
  }, [tick]);

  if (!show) return null;
  return (
    <div className="save-toast" role="status" aria-live="polite">
      <span className="save-toast__icon" aria-hidden>
        <IconSave size={18} />
      </span>
      <span className="save-toast__text">Uloženo lokálně</span>
    </div>
  );
}