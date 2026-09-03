const { createClient } = require('redis');

async function testRedisConnection() {
  // Dựa vào ảnh cấu hình của bạn, host là localhost và port là 6379
  const client = createClient({
    url: 'redis://localhost:6379'
  });

  client.on('error', (err) => console.log('❌ Lỗi kết nối Redis Client', err));

  try {
    console.log('⏳ Đang thử kết nối tới Redis...');
    await client.connect();
    console.log('✅ KẾT NỐI THÀNH CÔNG!');

    // Test 1: Lưu thử 1 key vào Redis với thời gian sống (TTL) 10 giây
    console.log('\n⏳ Thử ghi dữ liệu...');
    await client.set('test_key', 'Hello from Node.js', { EX: 10 });
    console.log('✅ Ghi thành công: test_key = "Hello from Node.js" (Tự xóa sau 10s)');

    // Test 2: Đọc key vừa lưu
    console.log('\n⏳ Thử đọc dữ liệu...');
    const value = await client.get('test_key');
    console.log(`✅ Đọc thành công: test_key = "${value}"`);

    // Test 3: Xóa thủ công key
    console.log('\n⏳ Thử xóa dữ liệu...');
    await client.del('test_key');
    const checkDeleted = await client.get('test_key');
    console.log(`✅ Kiểm tra lại sau khi xóa: test_key = ${checkDeleted === null ? 'null (Đã xóa thành công)' : checkDeleted}`);

  } catch (error) {
    console.error('❌ Test thất bại do lỗi:', error);
  } finally {
    await client.disconnect();
    console.log('\n⚠️ Đã đóng kết nối Redis!');
  }
}

testRedisConnection();