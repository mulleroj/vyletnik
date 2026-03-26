import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeNavLink } from '../components/HomeNavLink';
import { useTripContext } from '../context/TripContext';
import { getProfile, saveProfile } from '../db/session';
import { TechTripHeader } from '../components/TechTripHeader';

/**
 * Úvodní obrazovka výletu – jméno, skupina, vstup.
 */
export function WelcomePage() {
  const { trip } = useTripContext();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    void getProfile().then((p) => {
      if (p && p.tripId === trip.id) {
        setName(p.studentName);
        setGroup(p.groupName);
        setExisting(true);
      }
    });
  }, [trip.id]);

  const enter = async () => {
    if (!name.trim()) return;
    await saveProfile({
      studentName: name.trim(),
      groupName: group.trim(),
      tripId: trip.id,
      tripTitle: trip.title,
    });
    navigate(`/trip/${trip.id}/menu`);
  };

  return (
    <div className="page page--welcome">
      <TechTripHeader kicker="SESSION" title={trip.title} description={trip.description} />

      {trip.instructions && (
        <div className="card card--panel card--accent-edge">
          <h2 className="card__title">Instrukce</h2>
          <p className="card__text">{trip.instructions}</p>
        </div>
      )}

      <div className="card card--panel">
        <h2 className="card__title card__title--row">
          <span className="card__title-mark card__title-mark--input" aria-hidden />
          Identifikace
        </h2>
        <label className="field">
          <span className="field__label">Jméno nebo přezdívka</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="field">
          <span className="field__label">Skupina / tým (volitelné)</span>
          <input className="input" value={group} onChange={(e) => setGroup(e.target.value)} />
        </label>
        <div className="btn-row btn-row--stack">
          <button type="button" className="btn btn--accent btn--large" onClick={() => void enter()} disabled={!name.trim()}>
            {existing ? 'Pokračovat do výletu' : 'Vstoupit do aplikace'}
          </button>
          {existing && (
            <p className="hint">V tomto zařízení už máš rozpracovaná data – pokračuj stejným jménem.</p>
          )}
        </div>
      </div>

      <div className="page-footer-nav">
        <Link to={`/trip/${trip.id}/menu`}>Přeskočit na přehled</Link>
        <HomeNavLink>Jiný výlet</HomeNavLink>
      </div>
    </div>
  );
}
