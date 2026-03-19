import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

const apiUrl = '/api/todos';
const categoryOptions = ['일반', '공부', '운동', '일상'];
const priorityOptions = ['low', 'medium', 'high'];

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
};

const diffDays = (d) => {
  if (!d) return null;
  const now = new Date();
  const due = new Date(d);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
};

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('일반');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState('일반');
  const [editingDueDate, setEditingDueDate] = useState('');
  const [editingPriority, setEditingPriority] = useState('medium');

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState('createdAt');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saveLocal = (items) => {
    localStorage.setItem('todo-app-data', JSON.stringify(items));
  };

  const loadTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(apiUrl);
      setTodos(data);
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem('todo-app-data') || '[]');
      setTodos(stored);
      setError('서버 연결 실패. 로컬 데이터를 불러왔습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('todo-app-theme');
    if (storedTheme) setDarkMode(storedTheme === 'dark');
    loadTodos();
  }, []);

  useEffect(() => {
    saveLocal(todos);
  }, [todos]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
    localStorage.setItem('todo-app-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleAdd = async (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('제목을 입력해주세요.');
      return;
    }

    try {
      const { data } = await axios.post(apiUrl, {
        title: trimmed,
        category,
        dueDate: dueDate || undefined,
        priority,
      });
      setTodos((prev) => [data, ...prev]);
      setTitle('');
      setCategory('일반');
      setDueDate('');
      setPriority('medium');
      setError('');
    } catch (err) {
      setError('할 일 추가 중 오류가 발생했습니다.');
    }
  };

  const handleToggle = async (todo) => {
    try {
      const { data } = await axios.put(`${apiUrl}/${todo._id}`, {
        completed: !todo.completed,
      });
      setTodos((prev) => prev.map((item) => (item._id === todo._id ? data : item)));
    } catch (err) {
      setError('완료 상태 업데이트 중 오류 발생');
    }
  };

  const handleDelete = async (_id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${apiUrl}/${_id}`);
      setTodos((prev) => prev.filter((item) => item._id !== _id));
    } catch (err) {
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditingTitle(todo.title);
    setEditingCategory(todo.category || '일반');
    setEditingDueDate(todo.dueDate ? formatDate(todo.dueDate) : '');
    setEditingPriority(todo.priority || 'medium');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingCategory('일반');
    setEditingDueDate('');
    setEditingPriority('medium');
  };

  const saveEdit = async () => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setError('수정할 제목을 입력해주세요.');
      return;
    }

    try {
      const { data } = await axios.put(`${apiUrl}/${editingId}`, {
        title: trimmed,
        category: editingCategory,
        dueDate: editingDueDate || undefined,
        priority: editingPriority,
      });
      setTodos((prev) => prev.map((item) => (item._id === editingId ? data : item)));
      cancelEdit();
    } catch (err) {
      setError('수정 중 오류가 발생했습니다.');
    }
  };

  const filteredTodos = useMemo(() => {
    let items = [...todos];

    if (filterCategory !== 'all') {
      items = items.filter((item) => item.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      items = items.filter((item) => (filterStatus === 'done' ? item.completed : !item.completed));
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(q));
    }

    if (sortKey === 'dueDate') {
      items.sort((a, b) => (a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000)) - (b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000)));
    } else if (sortKey === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    } else {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return items;
  }, [todos, filterCategory, filterStatus, search, sortKey]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const remaining = totalCount - completedCount;

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header-row">
        <h1>Todo 리스트</h1>
        <button className="dark-toggle" onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? '라이트 모드' : '다크 모드'}
        </button>
      </div>

      <div className="stat-row">
        <div>전체 {totalCount}개</div>
        <div>완료 {completedCount}개</div>
        <div>남음 {remaining}개</div>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={handleAdd} className="todo-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새 할 일 입력" aria-label="새 할 일 입력" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {priorityOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button type="submit">추가</button>
      </form>

      <div className="filter-row">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">전체 카테고리</option>
          {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">전체 상태</option>
          <option value="done">완료</option>
          <option value="todo">진행 중</option>
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="createdAt">생성순</option>
          <option value="dueDate">마감 임박순</option>
          <option value="priority">중요도순</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색" />
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>로딩 중...</p>
      ) : filteredTodos.length === 0 ? (
        <p>조건에 맞는 할 일이 없습니다.</p>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => {
            const due = todo.dueDate ? new Date(todo.dueDate) : null;
            const days = due ? diffDays(due) : null;
            const highlight = days !== null && days <= 2 && !todo.completed;

            return (
              <li key={todo._id} className={`${todo.completed ? 'completed' : ''} ${highlight ? 'due-soon' : ''}`}>
                <div className="todo-top">
                  <label>
                    <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo)} />
                    {editingId === todo._id ? (
                      <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="edit-input" />
                    ) : (
                      <strong>{todo.title}</strong>
                    )}
                  </label>

                  {editingId === todo._id ? (
                    <>
                      <button onClick={saveEdit}>저장</button>
                      <button onClick={cancelEdit}>취소</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(todo)}>수정</button>
                      <button onClick={() => handleDelete(todo._id)}>삭제</button>
                    </>
                  )}
                </div>

                <div className="meta-row">
                  <span className="badge">{todo.category || '일반'}</span>
                  <span className={`badge priority-${todo.priority || 'medium'}`}>{todo.priority || 'medium'}</span>
                  <span>{todo.dueDate ? `마감 ${formatDate(todo.dueDate)} (${days}일)` : '마감 없음'}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default App;
