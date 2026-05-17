import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import GraduateCard from '../components/GraduateCard';
import GraduateModal from '../components/GraduateModal';

export default function GraduatesPage() {
  const { graduates, groups, loading } = useApp();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const filterGroup = searchParams.get('group');
  const filterRole = searchParams.get('role'); // 'teacher'

  const matchesSearch = (g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.group || '').toLowerCase().includes(q);
  };

  const isTeacher = (g) => g.roles?.includes('teacher');
  const isStudent = (g) => !g.roles || g.roles.includes('student');

  const teachers = graduates.filter((g) => isTeacher(g) && matchesSearch(g));
  const filtered = graduates.filter(matchesSearch);

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state"><p>Загрузка...</p></div>
      </div>
    );
  }

  const title = filterRole === 'teacher'
    ? 'Преподаватели'
    : filterGroup ? `Группа ${filterGroup}` : 'Выпускники';
  const subtitle = filterRole === 'teacher'
    ? 'Преподаватели университета'
    : filterGroup ? `Выпускники группы ${filterGroup}` : 'Все выпускники нашего университета';

  // Какие секции рисуем
  let sections = [];
  if (filterRole === 'teacher') {
    sections = [{ key: 'teachers', label: 'Преподаватели', icon: true, items: teachers }];
  } else if (filterGroup) {
    sections = [{
      key: filterGroup,
      label: filterGroup,
      items: filtered.filter((g) => isStudent(g) && g.group === filterGroup),
    }];
  } else {
    if (teachers.length > 0) {
      sections.push({ key: 'teachers', label: 'Преподаватели', icon: true, items: teachers });
    }
    for (const group of groups) {
      const items = filtered.filter((g) => isStudent(g) && g.group === group);
      if (items.length > 0) sections.push({ key: group, label: group, items });
    }
  }

  const totalShown = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>

        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Поиск по имени или группе..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {sections.map((section) => (
        section.items.length === 0 ? null : (
          <section key={section.key} className="group-section">
            <div className="group-header">
              <h2 className="group-title">
                {section.icon && <BookOpen size={17} style={{ verticalAlign: '-3px', marginRight: 6, color: 'var(--accent)' }} />}
                {section.label}
              </h2>
              <span className="group-count">{section.items.length} чел.</span>
            </div>
            <div className="graduates-grid">
              {section.items.map((grad) => (
                <GraduateCard key={grad.id} graduate={grad} onClick={setSelected} />
              ))}
            </div>
          </section>
        )
      ))}

      {totalShown === 0 && (
        <div className="empty-state">
          <SearchX size={48} strokeWidth={1.5} />
          <p>Выпускники не найдены</p>
        </div>
      )}

      {selected && (
        <GraduateModal graduate={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
