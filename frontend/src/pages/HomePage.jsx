import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { groups } from '../data/graduates';
import GraduateCard from '../components/GraduateCard';
import GraduateModal from '../components/GraduateModal';

export default function HomePage() {
  const { graduates } = useApp();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const filterGroup = searchParams.get('group');

  const filtered = useMemo(() => {
    return graduates.filter((g) => {
      const matchGroup = filterGroup ? g.group === filterGroup : true;
      const matchSearch = search
        ? g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.group.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchGroup && matchSearch;
    });
  }, [graduates, filterGroup, search]);

  const groupsToShow = filterGroup ? [filterGroup] : groups;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {filterGroup ? `Группа ${filterGroup}` : 'Клуб Выпускников'}
          </h1>
          <p className="page-subtitle">
            {filterGroup
              ? `Выпускники группы ${filterGroup}`
              : 'Все выпускники нашего университета'}
          </p>
        </div>
      </div>

      <div className="search-center">
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            placeholder="Поиск по имени или группе..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {groupsToShow.map((group) => {
        const groupGrads = filtered.filter((g) => g.group === group);
        if (groupGrads.length === 0) return null;
        return (
          <section key={group} className="group-section">
            <div className="group-header">
              <h2 className="group-title">{group}</h2>
              <span className="group-count">{groupGrads.length} чел.</span>
            </div>
            <div className="graduates-grid">
              {groupGrads.map((grad) => (
                <GraduateCard
                  key={grad.id}
                  graduate={grad}
                  onClick={setSelected}
                />
              ))}
            </div>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔎</span>
          <p>Выпускники не найдены</p>
        </div>
      )}

      {selected && (
        <GraduateModal graduate={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
