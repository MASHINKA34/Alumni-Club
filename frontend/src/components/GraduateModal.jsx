import { useEffect } from 'react';

export default function GraduateModal({ graduate, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!graduate) return null;

  const genderIcon = graduate.gender === 'Женский' ? '♀️' : '♂️';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <img
            src={graduate.photo}
            alt={graduate.name}
            className="modal-photo"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(graduate.name)}&background=6366f1&color=fff&size=300`;
            }}
          />
          <div className="modal-title-block">
            <h2 className="modal-name">{graduate.name}</h2>
            <span className="modal-group-badge">{graduate.group}</span>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-info-grid">
            <div className="modal-info-item">
              <span className="modal-info-label">📅 Годы обучения</span>
              <span className="modal-info-value">{graduate.years}</span>
            </div>
            <div className="modal-info-item">
              <span className="modal-info-label">{genderIcon} Пол</span>
              <span className="modal-info-value">{graduate.gender}</span>
            </div>
            <div className="modal-info-item" style={{ gridColumn: '1 / -1' }}>
              <span className="modal-info-label">💼 Текущее место работы</span>
              <span className="modal-info-value">{graduate.job}</span>
            </div>
          </div>

          <div className="modal-facts">
            <h3 className="modal-facts-title">⚡ Интересные факты</h3>
            <ul className="modal-facts-list">
              {graduate.facts.map((fact, i) => (
                <li key={i} className="modal-facts-item">
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
