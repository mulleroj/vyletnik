import { ProgressRing } from './ProgressBar';
import { HomeNavLink } from './HomeNavLink';

type Props = {
  /** Krátký řádek nad nadpisem (např. ID výletu) */
  kicker?: string;
  title: string;
  description?: string;
  /** Volitelně globální postup vpravo nahoře */
  progress?: { done: number; total: number };
};

/**
 * Horní technický panel – název, popis, volitelný kruhový postup.
 * Ikona blesku vlevo = návrat na úvodní stránku.
 */
export function TechTripHeader({ kicker, title, description, progress }: Props) {
  return (
    <header className="tech-header">
      <div className="tech-header__grid">
        <div className="tech-header__brand">
          <HomeNavLink className="tech-header__logo" iconSize={20} />
          <div>
            {kicker && <p className="tech-header__kicker">{kicker}</p>}
            <h1 className="tech-header__title">{title}</h1>
            {description && <p className="tech-header__desc">{description}</p>}
          </div>
        </div>
        {progress && progress.total > 0 && (
          <div className="tech-header__gauge">
            <span className="tech-header__gauge-label">Postup</span>
            <ProgressRing value={progress.done} max={progress.total} size={56} />
          </div>
        )}
      </div>
      <div className="tech-header__rule" aria-hidden />
    </header>
  );
}
