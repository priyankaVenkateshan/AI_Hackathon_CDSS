import { useState, useEffect } from 'react';
import { isMockMode } from '../../api/config';
import { getResources } from '../../api/client';
import '../Settings/AdminShared.css';

const mockResources = {
  ots: [
    { id: 'OT-1', name: 'OT Room 1 (Main)', status: 'in-use', nextFree: '2026-03-05 14:00' },
    { id: 'OT-2', name: 'OT Room 2 (Minor)', status: 'available', nextFree: null },
    { id: 'OT-3', name: 'Cardiac OT', status: 'maintenance', nextFree: '2026-03-06 08:00' },
  ],
  equipment: [
    { id: 'EQ-1', name: 'C-Arm Fluoroscopy', status: 'in-use', location: 'OT-1' },
    { id: 'EQ-2', name: 'Surgical Robot (Da Vinci)', status: 'available', location: 'OT-2' },
    { id: 'EQ-3', name: 'Laser Lithotripsy', status: 'available', location: '—' },
  ],
};

export default function AdminResources() {
  const [data, setData] = useState(isMockMode() ? mockResources : { ots: [], equipment: [] });
  const [loading, setLoading] = useState(!isMockMode());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isMockMode()) return;
    let cancelled = false;
    setLoading(true);
    getResources()
      .then((d) => {
        if (cancelled) return;
        setData({
          ots: d?.ots ?? d?.operation_theaters ?? [],
          equipment: d?.equipment ?? d?.equipments ?? [],
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load resources');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && !isMockMode()) {
    return <div className="admin-page page-enter"><p>Loading resources…</p></div>;
  }
  if (error) {
    return <div className="admin-page page-enter"><p className="admin-error">{error}</p><button className="btn btn--primary" onClick={() => window.location.reload()}>Retry</button></div>;
  }

  const ots = data?.ots || [];
  const equipment = data?.equipment || [];

  return (
    <div className="admin-page page-enter">
      <h1 className="admin-page__title">🛠️ Resources</h1>
      <p className="admin-page__desc">OT and equipment availability. Resolve conflicts from Analytics.</p>
      <div className="admin-cards">
        <div className="admin-card">
          <h2 className="admin-card__title">Operation Theaters</h2>
          <ul className="admin-list">
            {ots.map((r) => (
              <li key={r.id} className="admin-list__row">
                <span>{r.name || r.id}</span>
                <span className={`admin-badge admin-badge--${(r.status || 'available').replace('-', '')}`}>{r.status || 'available'}</span>
                {r.nextFree && <span className="admin-muted" style={{ fontSize: 'var(--text-xs)' }}>Free: {r.nextFree}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-card">
          <h2 className="admin-card__title">Equipment</h2>
          <ul className="admin-list">
            {equipment.map((r) => (
              <li key={r.id} className="admin-list__row">
                <span>{r.name || r.id}</span>
                <span className={`admin-badge admin-badge--${(r.status || 'available').replace('-', '')}`}>{r.status || 'available'}</span>
                {r.location && <span className="admin-muted">@{r.location}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
