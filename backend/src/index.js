const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const { noResourceFoundHandler, globalExceptionHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware cơ bản
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);

// Tuyến đường kiểm tra sức khỏe hệ thống
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend Server is running' });
});

app.use(noResourceFoundHandler);

app.use(globalExceptionHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});