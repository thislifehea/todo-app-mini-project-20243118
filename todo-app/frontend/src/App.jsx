import { useEffect, useMemo, useState } from 'react';
import { FaMoon, FaSun, FaTrashAlt, FaEdit, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import './App.css';

const apiUrl = '/api/todos';
const categoryOptions = ['일반', '공부', '운동', '일상'];
const priorityOptions = ['low', 'medium', 'high'];

const formatDate = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');
const diffDays = (date) => {
  if (!date) return null;
  const now = new Date();
  const due = new Date(date);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
};

function TodoForm({ onAdd, category, setCategory, title, setTitle, dueDate, setDueDate, priority, setPriority }) {
  return (
    <form onSubmit={onAdd} className="todo-form card">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="새 할 일 입력" />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {categoryOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        {priorityOptions.map((p) => (<option key={p} value={p}>{p}</option>))}
      </select>
      <button type="submit" className="primary">추가</button>
    </form>
  );
}

function FilterBar({ filterCategory, setFilterCategory, filterStatus, setFilterStatus, sortKey, setSortKey, search, setSearch }) {
  return (
    <div className="filter-row card">
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
  );
}

function Dashboard({ totalCount, completedCount, remaining }) {
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  return (
    <div className="dashboard card">
      <div className="dash-item">전체 <strong>{totalCount}</strong></div>
      <div className="dash-item">완료 <strong>{completedCount}</strong></div>
      <div className="dash-item">남음 <strong>{remaining}</strong></div>
      <div className="progress-wrap"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function TodoCard({ todo, isEditing, editingValues, onToggle, onDelete, onStartEdit, onCancelEdit, onSaveEdit, onChangeEditing }) {
  if (!todo) return null;
  const days = diffDays(todo.dueDate);
  const dueText = todo.dueDate ? `${formatDate(todo.dueDate)} (${days}일)` : '마감 없음';

  return (
    <article className={`todo-card ${todo.completed ? 'completed' : ''} ${days !== null && days <= 2 && !todo.completed ? 'due-soon' : ''}`}>
      <div className="todo-main">
        <label className="todo-title">
          <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo)} />
          {isEditing ? (
            <input value={editingValues.title} onChange={(e) => onChangeEditing('title', e.target.value)} />
          ) : (
            <span>{todo.title}</span>
          )}
        </label>
        <div className="tag-wrap">
          <span className="tag">{todo.category || '일반'}</span>
          <span className={`tag priority-${todo.priority || 'medium'}`}>{todo.priority || 'medium'}</span>
        </div>
      </div>
      <div className="todo-meta">{dueText}</div>
      <div className="todo-actions">
        {isEditing ? (
          <>
            <button onClick={onSaveEdit}><FaCheck /> 저장</button>
            <button onClick={onCancelEdit}>취소</button>
          </>
        ) : (
          <>
            <button onClick={() => onStartEdit(todo)}><FaEdit /> 수정</button>
            <button onClick={() => onDelete(todo._id)}><FaTrashAlt /> 삭제</button>
          </>
        )}
      </div>
    </article>
  );
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('일반');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState('createdAt');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValues, setEditingValues] = useState({ title: '', category: '일반', dueDate: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('todo-app-theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');
    loadTodos();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('todo-app-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('todo-app-data', JSON.stringify(todos));
  }, [todos]);

  const loadTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(apiUrl);
      setTodos(data);
    } catch (err) {
      const localData = JSON.parse(localStorage.getItem('todo-app-data') || '[]');
      setTodos(localData);
      setError('서버 연결 실패, 로컬 데이터로 로드했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('제목을 입력해주세요');
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
      setTitle(''); setCategory('일반'); setDueDate(''); setPriority('medium'); setError('');
    } catch {
      setError('할 일 추가 오류');
    }
  };

  const updateTodo = async (id, payload) => {
    try {
      const { data } = await axios.put(`${apiUrl}/${id}`, payload);
      setTodos((prev) => prev.map((t) => (t._id === id ? data : t)));
    } catch {
      setError('수정 실패');
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${apiUrl}/${id}`);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch {
      setError('삭제 실패');
    }
  };

  const filteredTodos = useMemo(() => {
    let items = [...todos];
    if (filterCategory !== 'all') items = items.filter((t) => t.category === filterCategory);
    if (filterStatus !== 'all') items = items.filter((t) => (filterStatus === 'done' ? t.completed : !t.completed));
    if (search.trim()) items = items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    if (sortKey === 'dueDate') items.sort((a, b) => (a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000)) - (b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000)));
    if (sortKey === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
    }
    if (sortKey === 'createdAt') items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return items;
  }, [todos, filterCategory, filterStatus, sortKey, search]);

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="app-container">
      <div className="header-row">
        <h1>Todo 리스트</h1>
        <button className="dark-toggle" onClick={() => setDarkMode((p) => !p)}>{darkMode ? <FaSun /> : <FaMoon />} {darkMode ? '라이트' : '다크'}</button>
      </div>
      <Dashboard totalCount={totalCount} completedCount={completedCount} remaining={totalCount - completedCount} />
      <TodoForm onAdd={handleAdd} category={category} setCategory={setCategory} title={title} setTitle={setTitle} dueDate={dueDate} setDueDate={setDueDate} priority={priority} setPriority={setPriority} />
      <FilterBar filterCategory={filterCategory} setFilterCategory={setFilterCategory} filterStatus={filterStatus} setFilterStatus={setFilterStatus} sortKey={sortKey} setSortKey={setSortKey} search={search} setSearch={setSearch} />
      {error && <p className="error">{error}</p>}
      {loading ? <p>로딩 중...</p> : filteredTodos.length === 0 ? <p className="empty">조건에 맞는 할 일이 없습니다.</p> : <div className="todo-grid">{filteredTodos.map((todo) => (<TodoCard key={todo._id} todo={todo} isEditing={editingId === todo._id} editingValues={editingValues} onToggle={() => updateTodo(todo._id, { completed: !todo.completed })} onDelete={deleteTodo} onStartEdit={(t) => { setEditingId(t._id); setEditingValues({ title: t.title, category: t.category || '일반', dueDate: formatDate(t.dueDate), priority: t.priority || 'medium' }); }} onCancelEdit={() => setEditingId(null)} onSaveEdit={() => { updateTodo(editingId, { title: editingValues.title, category: editingValues.category, dueDate: editingValues.dueDate || undefined, priority: editingValues.priority }); setEditingId(null); }} onChangeEditing={(name, value) => setEditingValues((prev) => ({ ...prev, [name]: value }))} />))}</div>}
    </div>
  );
}

export default App;
