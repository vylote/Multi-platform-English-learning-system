const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const roleRoutes = require('./routes/role.routes');
const dictionaryRoutes = require('./routes/dictionary.routes')
const flashcardRoutes = require('./routes/flashcard.routes')

const { noResourceFoundHandler, globalExceptionHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT;

// QUAN TRỌNG: withCredentials ở FE chỉ hoạt động nếu:
// 1. origin là domain CỤ THỂ (không được dùng '*')
// 2. credentials: true được bật ở đây
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser()); // Bắt buộc để đọc req.cookies (access_token) trong auth.middleware.js

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend Server is running' });
});


app.use('/api/v1/auth', authRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use('/api/v1/words', dictionaryRoutes);    
app.use('/api/v1/flashcards', flashcardRoutes); 

app.use(noResourceFoundHandler);
app.use(globalExceptionHandler);

// Khởi chạy lắng nghe cổng
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});