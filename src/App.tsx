import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TripLayout } from './TripLayout';
import { HomePage } from './pages/HomePage';
import { WelcomePage } from './pages/WelcomePage';
import { MenuPage } from './pages/MenuPage';
import { StationPage } from './pages/StationPage';
import { SummaryPage } from './pages/SummaryPage';
import { QRPage } from './pages/QRPage';
import { AdminPage } from './pages/AdminPage';

/**
 * Hash routing (#/…) – spolehlivé na GitHub Pages bez konfigurace serveru.
 */
export function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/qr/:tripId" element={<QRPage />} />
          <Route path="/trip/:tripId" element={<TripLayout />}>
            <Route index element={<WelcomePage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="station/:stationId" element={<StationPage />} />
            <Route path="summary" element={<SummaryPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
