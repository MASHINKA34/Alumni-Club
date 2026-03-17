const MALE_AVATAR_URL = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#1a1d28"/><circle cx="50" cy="38" r="20" fill="#2a2d3e"/><path d="M10 100 Q10 68 50 68 Q90 68 90 100" fill="#2a2d3e"/><circle cx="50" cy="38" r="16" fill="#3a3d5e"/><circle cx="44" cy="36" r="2.5" fill="#6366f1"/><circle cx="56" cy="36" r="2.5" fill="#6366f1"/></svg>`)}`;

const FEMALE_AVATAR_URL = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#1a1d28"/><circle cx="50" cy="38" r="20" fill="#2a2d3e"/><path d="M10 100 Q10 68 50 68 Q90 68 90 100" fill="#2a2d3e"/><circle cx="50" cy="38" r="16" fill="#3a3d5e"/><path d="M34 32 Q50 22 66 32 Q66 24 50 22 Q34 24 34 32" fill="#a855f7" opacity="0.6"/><circle cx="44" cy="38" r="2.5" fill="#a855f7"/><circle cx="56" cy="38" r="2.5" fill="#a855f7"/></svg>`)}`;

export default function GraduateCard({ graduate, onClick }) {
  const showPhoto = graduate.photoConsent && graduate.photo;
  const defaultAvatar = graduate.gender === 'Женский' ? FEMALE_AVATAR_URL : MALE_AVATAR_URL;

  return (
    <div className="graduate-card" onClick={() => onClick(graduate)}>
      <div className="graduate-card-photo-wrap">
        <img
          src={showPhoto ? graduate.photo : defaultAvatar}
          alt={graduate.name}
          className="graduate-card-photo"
          onError={(e) => {
            e.target.src = defaultAvatar;
          }}
        />
        <div className="graduate-card-overlay">
          <span>Подробнее</span>
        </div>
      </div>
      <div className="graduate-card-info">
        <p className="graduate-card-name">{graduate.name}</p>
        <p className="graduate-card-meta">{graduate.graduationYear} г.</p>
      </div>
    </div>
  );
}
