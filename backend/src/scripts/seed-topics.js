require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const DIFFICULTY_MAP = {
  BEGINNER: [
    'Food & Drink',
    'Travel & Transport',
    'Family & Relationships',
    'Sports & Entertainment',
    'Actions & States',
    'Shopping & Fashion',
    'Home & Daily Life',
    'Time & Seasons',
    'Numbers & Measurement',
    'Colors & Shapes',
    'Feelings & Senses',
    'Weather & Atmosphere',
  ],
  INTERMEDIATE: [
    'Business & Finance',
    'Health & Medicine',
    'Education & Science',
    'Nature & Environment',
    'Emotions & Personality',
    'Communication & Media',
    'Arts & Literature',
    'History & Culture',
    'Geography & Places',
    'Work & Professions',
    'Materials & Substances',
    'Buildings & Infrastructure',
  ],
  ADVANCED: [
    'Technology & IT',
    'Law & Society',
    'Philosophy & Thinking',
    'Abstract Concepts',
    'Politics & Government',
    'Military & Warfare',
    'Agriculture & Farming',
    'Industry & Manufacturing',
    'Energy & Resources',
    'Religion & Spirituality',
    'Crime & Justice',
    'Disasters & Emergencies',
  ],
};

const GOAL_PRIORITY_MAP = {
  DAILY_COMMUNICATION: [
    'Family & Relationships',
    'Home & Daily Life',
    'Emotions & Personality',
    'Communication & Media',
    'Feelings & Senses',
    'Health & Medicine',
  ],
  CAREER: [
    'Business & Finance',
    'Work & Professions',
    'Communication & Media',
    'Technology & IT',
    'Education & Science',
    'Industry & Manufacturing',
  ],
  TRAVEL: [
    'Travel & Transport',
    'Food & Drink',
    'Geography & Places',
    'Weather & Atmosphere',
    'Shopping & Fashion',
    'Buildings & Infrastructure',
  ],
  HOBBY: [
    'Sports & Entertainment',
    'Arts & Literature',
    'Nature & Environment',
    'History & Culture',
    'Colors & Shapes',
    'Philosophy & Thinking',
  ],
};

async function seedTopics() {
  const client = await pool.connect();
  try {
    console.log('🚀 Bắt đầu quá trình seed topics vào cơ sở dữ liệu...');

    // 1. Đọc file config
    const configPath = path.join(__dirname, 'topic_config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Không tìm thấy file topic_config.json tại: ${configPath}`);
    }
    const topicSeeds = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const topicTitles = Object.keys(topicSeeds);
    console.log(`📄 Tìm thấy ${topicTitles.length} topics trong topic_config.json`);

    await client.query('BEGIN');

    // 2. Chèn hoặc cập nhật topics
    let insertedCount = 0;
    let updatedCount = 0;

    for (const [title, description] of Object.entries(topicSeeds)) {
      const checkRes = await client.query(
        'SELECT id FROM topics WHERE LOWER(title) = LOWER($1)',
        [title]
      );

      if (checkRes.rows.length > 0) {
        await client.query(
          'UPDATE topics SET description = $1 WHERE id = $2',
          [description, checkRes.rows[0].id]
        );
        updatedCount++;
      } else {
        await client.query(
          'INSERT INTO topics (title, description) VALUES ($1, $2)',
          [title, description]
        );
        insertedCount++;
      }
    }
    console.log(`✅ Hoàn thành chèn mới: ${insertedCount}, cập nhật mô tả: ${updatedCount} topics.`);

    // 3. Cập nhật difficulty cho từng nhóm
    for (const [diff, titles] of Object.entries(DIFFICULTY_MAP)) {
      const updateRes = await client.query(
        'UPDATE topics SET difficulty = $1 WHERE title = ANY($2::text[])',
        [diff, titles]
      );
      console.log(`  - Gán độ khó ${diff}: ${updateRes.rowCount} topics`);
    }

    // 4. Đánh số order_index theo thứ tự độ khó (BEGINNER: 1-12, INTERMEDIATE: 13-24, ADVANCED: 25-36)
    await client.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            ORDER BY
              CASE difficulty
                WHEN 'BEGINNER' THEN 1
                WHEN 'INTERMEDIATE' THEN 2
                WHEN 'ADVANCED' THEN 3
                ELSE 4
              END,
              id
          ) AS rn
        FROM topics
      )
      UPDATE topics t
      SET order_index = r.rn
      FROM ranked r
      WHERE t.id = r.id;
    `);
    console.log('✅ Đã cập nhật xong order_index (1 -> 36) theo lộ trình chuẩn.');

    // 5. Seed bảng topic_goal_priority
    let totalGoalLinks = 0;
    for (const [goal, titles] of Object.entries(GOAL_PRIORITY_MAP)) {
      // Lấy id của các topics theo title
      const topicIdsRes = await client.query(
        'SELECT id FROM topics WHERE title = ANY($1::text[])',
        [titles]
      );

      for (const row of topicIdsRes.rows) {
        await client.query(
          `INSERT INTO topic_goal_priority (goal, topic_id)
           VALUES ($1, $2)
           ON CONFLICT (goal, topic_id) DO NOTHING`,
          [goal, row.id]
        );
        totalGoalLinks++;
      }
    }
    console.log(`✅ Đã thiết lập ${totalGoalLinks} liên kết mục tiêu học tập (topic_goal_priority).`);

    await client.query('COMMIT');

    // 6. Kiểm tra lại dữ liệu vừa seed
    const summary = await client.query(`
      SELECT difficulty, COUNT(*) as count 
      FROM topics 
      GROUP BY difficulty 
      ORDER BY 
        CASE difficulty
          WHEN 'BEGINNER' THEN 1
          WHEN 'INTERMEDIATE' THEN 2
          WHEN 'ADVANCED' THEN 3
        END;
    `);

    console.log('\n📊 TỔNG KẾT DỮ LIỆU TOPICS TRONG DATABASE:');
    summary.rows.forEach((r) => {
      console.log(`   - Trình độ ${r.difficulty}: ${r.count} chủ đề`);
    });

    const sample = await client.query(`
      SELECT id, order_index, title, difficulty 
      FROM topics 
      ORDER BY order_index ASC 
      LIMIT 5;
    `);
    console.log('\n🌟 5 chủ đề đầu tiên trong Lộ trình:');
    sample.rows.forEach((r) => {
      console.log(`   [#${r.order_index}] ID: ${r.id} | ${r.title} (${r.difficulty})`);
    });

    console.log('\n🎉 SEED TOPICS THÀNH CÔNG VÀ SẴN SÀNG SỬ DỤNG!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi seed topics:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTopics();
