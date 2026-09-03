const { createClient } = require('redis');

// Khởi tạo client kết nối với Redis thông qua URL lưu trong biến môi trường
const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('connect', () => {
    console.log('✅ KẾT NỐI REDIS THÀNH CÔNG!');
});

redisClient.on('error', (err) => {
    console.error('❌ LỖI KẾT NỐI REDIS:', err);
});

redisClient.on('ready', () => {
    console.log('🚀 Redis Client đã sẵn sàng nhận lệnh!');
});

redisClient.on('end', () => {
    console.log('⚠️ Redis Client đã ngắt kết nối!');
});

// Tự động kích hoạt kết nối (Sử dụng IIFE để dùng async/await)
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Không thể khởi động Redis:', error);
    }
})();

module.exports = redisClient;