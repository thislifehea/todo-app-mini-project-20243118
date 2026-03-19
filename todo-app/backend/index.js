require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

console.log('MONGODB_URI value:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => {
    console.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  });

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

const Todo = mongoose.model('Todo', todoSchema);

app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: '할 일 목록 로드 실패', error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: '제목을 입력해야 합니다.' });
    }
    const todo = new Todo({ title: title.trim() });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Todo 생성 실패', error: error.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title } = req.body;

    const update = {};
    if (typeof completed === 'boolean') update.completed = completed;
    if (typeof title === 'string') update.title = title.trim();

    const todo = await Todo.findByIdAndUpdate(id, update, { new: true });
    if (!todo) return res.status(404).json({ message: 'Todo를 찾을 수 없습니다.' });
    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Todo 수정 실패', error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndDelete(id);
    if (!todo) return res.status(404).json({ message: 'Todo를 찾을 수 없습니다.' });
    res.status(200).json({ message: '삭제 완료' });
  } catch (error) {
    res.status(500).json({ message: 'Todo 삭제 실패', error: error.message });
  }
});

// Vercel 대응 (서버리스)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
}

module.exports = app;
