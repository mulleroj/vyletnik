# Výletník (PWA)

Offline-first webová aplikace pro školní výlety a terénní aktivity: stanoviště, úkoly, ukládání do zařízení a hromadné odeslání výsledků.

## Struktura projektu

| Cesta | Účel |
|--------|------|
| `public/trips/` | JSON definice výletů + `index.json` se seznamem |
| `src/types/` | Typy výletu, úkolů a odpovědí (rozšířitelné o gamifikaci) |
| `src/db/` | Dexie / IndexedDB – odpovědi, fotky, profil žáka |
| `src/services/` | Načtení výletů, sestavení exportu, mailto/PDF/JSON, webhook |
| `src/components/` | Úkoly (`TaskField`), ukazatele uložení, progress bar |
| `src/pages/` | Úvod, menu, stanoviště, souhrn, QR, admin JSON |
| `src/context/TripContext.tsx` | Kontext načteného výletu pro vnořené routy |
| `src/styles/global.css` | Vzhled pro mobil a čitelnost venku |
| `vite.config.ts` | PWA (manifest, service worker), `base: './'` pro statické hostování |

## Doporučený tech stack

- **Vite + React + TypeScript** – rychlé sestavení, modulární komponenty.
- **React Router (HashRouter)** – funguje na GitHub Pages bez přepisů URL na serveru (`#/trip/...`).
- **vite-plugin-pwa + Workbox** – PWA, instalace, cache statických souborů.
- **Dexie (IndexedDB)** – odpovědi a binární fotky; přežije zavření prohlížeče i restart zařízení.
- **jsPDF** – export PDF; **QRCode** – generování QR pro sdílení odkazu.

## Spuštění lokálně

```bash
npm install
npm run dev
```

Otevři v prohlížeči uvedenou adresu (např. `http://localhost:5173`). Příklad výletu: `#/trip/revize-arealu-rs-bajtlich`.

## Build

```bash
npm run build
```

Výstup ve složce `dist/`.

## Nasazení online

### Netlify

1. Propoj repozitář s Netlify (nebo nahraj `dist`).
2. Build command: `npm run build`, publish directory: `dist`.
3. Volitelně nastav env proměnnou `VITE_SUBMIT_WEBHOOK_URL` pro POST exportu (viz `.env.example`).

Soubor `netlify.toml` v kořeni projektu obsahuje stejné nastavení.

### GitHub Pages

1. V `vite.config.ts` je `base: './'` – vhodné pro nasazení z kořene `gh-pages` nebo z podadresáře projektu.
2. Po `npm run build` nahraj obsah `dist/` do větve `gh-pages` nebo použij GitHub Action (build artefakt → Pages).
3. Hash routing (`#/`) nevyžaduje na serveru fallback na `index.html` u jednostránkové aplikace.

### Odkaz pro žáky / QR

Formát: `https://TVA-DOMENA/cesta/#/trip/{id-vyletu}`  
Stránka `#/qr/{id-vyletu}` zobrazí QR s aktuální adresou.

## Obsah výletů bez změny kódu

1. Přidej `public/trips/muj-vylet.json` podle schématu v některém existujícím souboru ve `public/trips/` (např. `hydroenergetika-prehrada-chribska.json`).
2. Zapiš výlet do `public/trips/index.json` (`id`, `title`, `path`).
3. Znovu sestav a nasaď.

Nebo použij vestavenou stránku **Úprava obsahu (JSON)** (`#/admin`) – uprav JSON a stáhni soubor; ten pak ulož do `public/trips/`.

## Export a backend (budoucí)

- **mailto** – otevře e-mailový klient s textovým souhrnem (pole `teacherEmail` ve výletu).
- **PDF / JSON** – stažení souboru; JSON obsahuje i fotky jako data URL (může být velký).
- **Webhook** – pokud je nastaveno `VITE_SUBMIT_WEBHOOK_URL`, tlačítko odešle stejný JSON na POST (vyžaduje CORS na cílovém serveru).

## Licence

Projekt vznikl jako šablona pro vzdělávací použití; upravuj dle potřeby.
