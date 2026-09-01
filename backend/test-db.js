require('dotenv').config();
const { Pool } = require('pg');
const { createClient } = require('redis');

async function testConnections() {
  console.log('==============================================');
  console.log('🔍 ĐANG KIỂM TRA KẾT NỐI TỚI CÁC DỊCH VỤ DOCKER...');
  console.log('==============================================\n');

  let pgSuccess = false;
  let redisSuccess = false;

  // 1. KIỂM TRA POSTGRESQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const resTime = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ [PostgreSQL] Kết nối THÀNH CÔNG!');
    console.log(`   - Database: ${resTime.rows[0].db_name}`);
    console.log(`   - Server Time: ${resTime.rows[0].current_time}`);

    // Kiểm tra danh sách bảng đã tạo từ schema.sql
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tableRes.rows.map(r => r.table_name);
    console.log(`   - Số lượng bảng hiện có: ${tables.length}/9 bảng`);
    if (tables.length > 0) {
      console.log(`   - Danh sách bảng: [ ${tables.join(', ')} ]`);
    } else {
      console.log('   ⚠️ Chưa có bảng nào. Hãy nạp file schema.sql vào database!');
    }

    client.release();
    pgSuccess = true;
  } catch (err) {
    console.error('❌ [PostgreSQL] Kết nối THẤT BẠI!');
    console.error(`   Lỗi: ${err.message}`);
  } finally {
    await pool.end();
  }

  console.log('\n----------------------------------------------\n');

  // 2. KIỂM TRA REDIS
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => {
    // Tránh in unhandled error nếu kết nối hỏng
  });

  try {
    await redisClient.connect();
    // Thử ghi và đọc 1 key kiểm tra
    await redisClient.set('test_key', 'Docker Redis Running OK!', { EX: 10 });
    const val = await redisClient.get('test_key');

    console.log('✅ [Redis] Kết nối THÀNH CÔNG!');
    console.log(`   - Ping/Pong test: PONG`);
    console.log(`   - Thử nghiệm Write/Read: "${val}"`);
    redisSuccess = true;
  } catch (err) {
    console.error('❌ [Redis] Kết nối THẤT BẠI!');
    console.error(`   Lỗi: ${err.message}`);
  } finally {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  }

  console.log('\n==============================================');
  if (pgSuccess && redisSuccess) {
    console.log('🎉 TẤT CẢ DỊCH VỤ SẴN SÀNG ĐỂ PHÁT TRIỂN TIẾP!');
  } else {
    console.log('⚠️ CẦN KIỂM TRA LẠI DOCKER HOẶC FILE .ENV!');
  }
  console.log('==============================================');
}

testConnections();