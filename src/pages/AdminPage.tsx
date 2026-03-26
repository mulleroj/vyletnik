import { useState } from 'react';
import { HomeNavLink } from '../components/HomeNavLink';
import { TripBuilder } from '../components/admin/TripBuilder';

const SAMPLE = `{
  "id": "muj-vylet",
  "title": "Můj výlet",
  "instructions": "Instrukce pro žáky.",
  "stations": [
    {
      "id": "s1",
      "title": "Stanoviště 1",
      "tasks": [
        { "id": "a1", "title": "Otázka", "type": "text" }
      ]
    }
  ]
}`;

type Tab = 'guide' | 'json';

/**
 * Administrace: vizuální průvodce nebo ruční JSON.
 */
export function AdminPage() {
  const [tab, setTab] = useState<Tab>('guide');
  const [json, setJson] = useState(SAMPLE);
  const [err, setErr] = useState<string | null>(null);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);
  const [builderMsg, setBuilderMsg] = useState<string | null>(null);

  const validateAndDownload = () => {
    setErr(null);
    setLoadMsg(null);
    try {
      const data = JSON.parse(json) as { id?: string };
      if (!data.id) throw new Error('Pole "id" je povinné.');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${data.id}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setLoadMsg('Soubor stažen. Zkopíruj ho do public/trips/ v projektu.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Neplatný JSON');
    }
  };

  const loadExampleTrip = async () => {
    setErr(null);
    setLoadMsg(null);
    try {
      const url = `${import.meta.env.BASE_URL}trips/revize-arealu-rs-bajtlich.json`.replace(/\/+/g, '/');
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Chyba ${res.status}`);
      const text = await res.text();
      setJson(text);
      setLoadMsg('Načten ukázkový výlet.');
    } catch {
      setErr('Ukázkový soubor se nepodařilo načíst.');
    }
  };

  return (
    <div className="page">
      <nav className="breadcrumb">
        <HomeNavLink>Úvod</HomeNavLink>
      </nav>
      <header className="page-head page-head--spaced">
        <p className="eyebrow eyebrow--tech">Konfigurace</p>
        <h1 className="page-head__title">Editor výletů</h1>
        <p className="page-head__desc">
          Nejjednodušší je zadání ve Wordu podle šablony a vložení do chatu v Cursoru – viz žlutý box níže. Průvodce a JSON jsou volitelné.
        </p>
      </header>

      <div className="card card--panel admin-simple-path">
        <h2 className="card__title">Nejjednodušší postup (Word → asistent)</h2>
        <ol className="admin-help__steps">
          <li>
            Stáhni si šablonu:{' '}
            <a href={`${import.meta.env.BASE_URL}sablona-vylet.txt`.replace(/\/+/g, '/')} download>
              sablona-vylet.txt
            </a>{' '}
            (nebo ji otevři v projektu ve složce <code>public/</code>).
          </li>
          <li>
            Soubor otevři ve Wordu, vyplň názvy výletu, stanoviště a úkoly podle návodu v šabloně – žádný JSON nepotřebuješ.
          </li>
          <li>
            Ve Wordu označ vše (<kbd>Ctrl</kbd>+<kbd>A</kbd>), zkopíruj a vlož do <strong>chatu v Cursoru</strong> (u této aplikace) a napiš třeba:{' '}
            <em>„Z tohoto zadání prosím vytvoř výlet do aplikace Výletník.“</em>
          </li>
          <li>
            Asistent (já) ti připraví soubor JSON v projektu nebo ti řekne, kam ho uložit. Nemusíš nic nastavovat v editoru níže.
          </li>
        </ol>
        <p className="hint admin-simple-path__note">
          Word soubor samotný sem nahrát nejde – stačí zkopírovaný text. <strong>Šablona není povinná:</strong> můžeš vložit i holé zadání úkolu (z e-mailu, poznámek, libovolného dokumentu) a asistent z něj výlet sestaví. Pokud chceš upravovat přímo v prohlížeči, použij záložku Průvodce.
        </p>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Režim editoru">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'guide'}
          className={`admin-tabs__btn ${tab === 'guide' ? 'is-active' : ''}`}
          onClick={() => setTab('guide')}
        >
          Průvodce
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'json'}
          className={`admin-tabs__btn ${tab === 'json' ? 'is-active' : ''}`}
          onClick={() => setTab('json')}
        >
          JSON
        </button>
      </div>

      {tab === 'guide' && (
        <>
          {builderMsg && <p className="form-msg admin-builder-msg">{builderMsg}</p>}
          <TripBuilder
            onMessage={(m) => {
              setBuilderMsg(m);
              if (m && !m.includes('chyb')) setErr(null);
            }}
          />
        </>
      )}

      {tab === 'json' && (
        <>
          <div className="card card--panel admin-help">
            <h2 className="card__title">Ruční úprava JSON</h2>
            <ol className="admin-help__steps">
              <li>
                Úkoly přidávej do pole <code>"tasks"</code> u stanoviště – objekt s <code>id</code>, <code>title</code>,{' '}
                <code>type</code>.
              </li>
              <li>
                U typu <code>choice</code> doplň <code>options</code>: pole textů.
              </li>
              <li>
                Po stažení soubor ulož do <code>public/trips/</code> a u nového výletu uprav <code>index.json</code>.
              </li>
            </ol>
            <div className="btn-row admin-help__actions">
              <button type="button" className="btn btn--secondary" onClick={() => void loadExampleTrip()}>
                Načíst ukázkový výlet do editoru
              </button>
            </div>
          </div>

          <div className="card card--panel">
            <h2 className="card__title">Typy úkolů (pole type)</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>type</th>
                    <th>Význam</th>
                    <th>Poznámka</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>text</code>
                    </td>
                    <td>Krátká odpověď</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>
                      <code>choice</code>
                    </td>
                    <td>Výběr</td>
                    <td>
                      pole <code>options</code>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>checkbox</code>
                    </td>
                    <td>Ano/ne</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>
                      <code>photo</code>
                    </td>
                    <td>Foto</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>
                      <code>reflection</code>
                    </td>
                    <td>Reflexe</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card--panel">
            <label className="field">
              <span className="field__label">Obsah výletu (JSON)</span>
              <textarea className="input input--code" rows={18} value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
            </label>
            {err && <p className="text-error">{err}</p>}
            {loadMsg && <p className="form-msg">{loadMsg}</p>}
            <button type="button" className="btn btn--accent btn--large" onClick={validateAndDownload}>
              Stáhnout JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
