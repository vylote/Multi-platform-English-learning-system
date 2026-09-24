-- =========================================================
-- DAILY_COMMUNICATION: giao tiếp đời sống hằng ngày
-- =========================================================
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'DAILY_COMMUNICATION', id FROM topics
WHERE title IN (
  'Family & Relationships',
  'Home & Daily Life',
  'Emotions & Personality',
  'Communication & Media',
  'Feelings & Senses',
  'Health & Medicine'
);

-- =========================================================
-- CAREER: công việc & sự nghiệp
-- =========================================================
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'CAREER', id FROM topics
WHERE title IN (
  'Business & Finance',
  'Work & Professions',
  'Communication & Media',
  'Technology & IT',
  'Education & Science',
  'Industry & Manufacturing'
);

-- =========================================================
-- TRAVEL: du lịch
-- =========================================================
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'TRAVEL', id FROM topics
WHERE title IN (
  'Travel & Transport',
  'Food & Drink',
  'Geography & Places',
  'Weather & Atmosphere',
  'Shopping & Fashion',
  'Buildings & Infrastructure'
);

-- =========================================================
-- HOBBY: sở thích cá nhân
-- =========================================================
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'HOBBY', id FROM topics
WHERE title IN (
  'Sports & Entertainment',
  'Arts & Literature',
  'Nature & Environment',
  'History & Culture',
  'Colors & Shapes',
  'Philosophy & Thinking'
);