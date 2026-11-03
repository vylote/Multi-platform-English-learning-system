-- ==============================================================================
-- TẠO TÀI KHOẢN QUẢN TRỊ VIÊN MẶC ĐỊNH (DEFAULT ADMIN ACCOUNT)
-- ==============================================================================
-- Username: admin
-- Email: admin@anhlingo.com
-- Mật khẩu mặc định: admin123
-- Hash bcrypt tương ứng: $2b$10$QUibhNeWZ94CPoKt4jqpeuw5dwkNrqXeFPI/JWyo7ePY2.L62qKIK

INSERT INTO users (username, email, password_hash, role_id)
SELECT 
  'admin',
  'admin@anhlingo.com',
  '$2b$10$QUibhNeWZ94CPoKt4jqpeuw5dwkNrqXeFPI/JWyo7ePY2.L62qKIK',
  r.id
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT (username) DO UPDATE 
SET 
  role_id = EXCLUDED.role_id,
  password_hash = EXCLUDED.password_hash;
