import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = '/api/todos';

  const loadTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(apiUrl);
      setTodos(data);
    } catch (err) {
      setError('할 일 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      const { data } = await axios.post(apiUrl, { title: title.trim() });
      setTodos((prev) => [data, ...prev]);
      setTitle('');
    } catch (err) {
      setError('할 일 추가 중 오류가 발생했습니다.');
    }
  };

  const handleToggle = async ({ _id, completed }) => {
    try {
      const { data } = await axios.put(`${apiUrl}/${_id}`, { completed: !completed });
      setTodos((prev) => prev.map((item) => (item._id === _id ? data : item)));
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
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEdit = async () => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setError('수정할 제목을 입력해주세요.');
      return;
    }

    try {
      const { data } = await axios.put(`${apiUrl}/${editingId}`, { title: trimmed });
      setTodos((prev) => prev.map((item) => (item._id === editingId ? data : item)));
      cancelEdit();
    } catch (err) {
      setError('수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="app-container">
      <h1>Todo 리스트</h1>
      <form onSubmit={handleAdd} className="todo-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 할 일 입력"
          aria-label="새 할 일 입력"
        />
        <button type="submit">추가</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>로딩 중...</p>
      ) : todos.length === 0 ? (
        <p>등록된 할 일이 없습니다.</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo._id} className={todo.completed ? 'completed' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                />
                {editingId === todo._id ? (
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="edit-input"
                    aria-label="할 일 수정"
                  />
                ) : (
                  todo.title
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
