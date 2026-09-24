class User {
  constructor({ id, username, email, password_hash, role, tier, experience_level, learning_purpose, created_at }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password_hash = password_hash;
    this.role = role || 'STUDENT';
    this.tier = tier || null; // <--- Thêm mới
    this.experience_level = experience_level || null; // <--- Thêm mới
    this.learning_purpose = learning_purpose || null; // <--- Thêm mới
    this.created_at = created_at;
  }

  // Phương thức loại bỏ mật khẩu băm khi phản hồi về Client
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      tier: this.tier, // <--- Thêm mới
      experience_level: this.experience_level, // <--- Thêm mới
      learning_purpose: this.learning_purpose, // <--- Thêm mới
      created_at: this.created_at,
    };
  }
}

module.exports = User;