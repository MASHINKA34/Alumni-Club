export default function GraduateCard({ graduate, onClick }) {
  return (
    <div className="graduate-card" onClick={() => onClick(graduate)}>
      <div className="graduate-card-photo-wrap">
        <img
          src={graduate.photo}
          alt={graduate.name}
          className="graduate-card-photo"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(graduate.name)}&background=6366f1&color=fff&size=300`;
          }}
        />
        <div className="graduate-card-overlay">
          <span>Подробнее</span>
        </div>
      </div>
      <div className="graduate-card-info">
        <p className="graduate-card-name">{graduate.name}</p>
        <p className="graduate-card-meta">{graduate.years}</p>
      </div>
    </div>
  );
}
