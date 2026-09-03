class User {
  constructor({ id, username, email, password_hash, role, created_at }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password_hash = password_hash;
    this.role = role || 'STUDENT';
    this.created_at = created_at;
  }

  // Phương thức loại bỏ mật khẩu băm khi phản hồi về Client
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      created_at: this.created_at,
    };
  }
}

module.exports = User;