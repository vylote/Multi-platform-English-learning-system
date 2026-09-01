const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Đã kết nối thành công tới cơ sở dữ liệu PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi kết nối PostgreSQL:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};