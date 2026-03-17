import { useEffect } from 'react';
import { X, Calendar, Briefcase, BookOpen, ArrowRight } from 'lucide-react';

const MALE_AVATAR = (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect width="100" height="100" fill="#1a1d28" />
    <circle cx="50" cy="38" r="20" fill="#2a2d3e" />
    <path d="M10 100 Q10 68 50 68 Q90 68 90 100" fill="#2a2d3e" />
    <circle cx="50" cy="38" r="16" fill="#3a3d5e" />
    <circle cx="44" cy="36" r="2.5" fill="#6366f1" />
    <circle cx="56" cy="36" r="2.5" fill="#6366f1" />
    <path d="M44 46 Q50 51 56 46" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const FEMALE_AVATAR = (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect width="100" height="100" fill="#1a1d28" />
    <circle cx="50" cy="38" r="20" fill="#2a2d3e" />
    <path d="M10 100 Q10 68 50 68 Q90 68 90 100" fill="#2a2d3e" />
    <circle cx="50" cy="38" r="16" fill="#3a3d5e" />
    <path d="M34 32 Q50 22 66 32 Q66 24 50 22 Q34 24 34 32" fill="#6366f1" opacity="0.6" />
    <circle cx="44" cy="38" r="2.5" fill="#a855f7" />
    <circle cx="56" cy="38" r="2.5" fill="#a855f7" />
    <path d="M44 48 Q50 53 56 48" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function GraduateModal({ graduate, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!graduate) return null;

  const showPhoto = graduate.photoConsent && graduate.photo;
  const defaultAvatar = graduate.gender === 'Женский' ? FEMALE_AVATAR : MALE_AVATAR;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={14} />
        </button>

        <div className="modal-header">
          <div className="modal-photo-wrap">
            {showPhoto ? (
              <img
                src={graduate.photo}
                alt={graduate.name}
                className="modal-photo"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="modal-photo modal-photo-default"
              style={{ display: showPhoto ? 'none' : 'flex' }}
            >
              {defaultAvatar}
            </div>
          </div>
          <div className="modal-title-block">
            <h2 className="modal-name">{graduate.name}</h2>
            <span className="modal-group-badge">{graduate.group}</span>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-info-grid">
            <div className="modal-info-item">
              <span className="modal-info-label">
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Год выпуска
              </span>
              <span className="modal-info-value">{graduate.graduationYear}</span>
            </div>
            {graduate.job && (
              <div className="modal-info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="modal-info-label">
                  <Briefcase size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Место работы
                </span>
                <span className="modal-info-value">{graduate.job}</span>
              </div>
            )}
          </div>

          {graduate.facts && graduate.facts.length > 0 && (
            <div className="modal-facts">
              <h3 className="modal-facts-title">
                <BookOpen size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#6366f1' }} />
                Прочее
              </h3>
              <ul className="modal-facts-list">
                {graduate.facts.map((fact, i) => (
                  <li key={i} className="modal-facts-item">
                    <ArrowRight size={13} className="modal-facts-arrow" />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
