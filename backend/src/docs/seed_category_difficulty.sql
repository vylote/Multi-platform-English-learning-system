UPDATE topics 
SET difficulty = 'BEGINNER' 
WHERE title IN (
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
    'Weather & Atmosphere'
);

UPDATE topics 
SET difficulty = 'INTERMEDIATE' 
WHERE title IN (
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
    'Buildings & Infrastructure'
);

UPDATE topics 
SET difficulty = 'ADVANCED' 
WHERE title IN (
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
    'Disasters & Emergencies'
);

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE difficulty
          WHEN 'BEGINNER' THEN 1
          WHEN 'INTERMEDIATE' THEN 2
          WHEN 'ADVANCED' THEN 3
        END,
        id
    ) AS rn
  FROM topics
)
UPDATE topics t
SET order_index = r.rn
FROM ranked r
WHERE t.id = r.id;