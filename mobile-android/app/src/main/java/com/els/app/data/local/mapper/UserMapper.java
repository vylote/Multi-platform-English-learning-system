package com.els.app.data.local.mapper;

import com.els.app.data.local.dao.RoleDao;
import com.els.app.data.local.entity.RoleEntity;
import com.els.app.data.local.entity.UserEntity;
import com.els.app.data.remote.dto.response.UserResponse;

import java.util.Locale;

public class UserMapper {

    public static UserEntity toEntity(
            UserResponse dto,
            RoleDao roleDao
    ) {

        if (dto == null) {
            throw new IllegalArgumentException(
                    "Thông tin người dùng không hợp lệ"
            );
        }

        if (roleDao == null) {
            throw new IllegalArgumentException(
                    "RoleDao không được để trống"
            );
        }

        // Lấy role từ API
        String roleCode = dto.getRole();

        if (roleCode == null || roleCode.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Tài khoản chưa có thông tin vai trò"
            );
        }

        roleCode = roleCode.trim().toUpperCase(Locale.ROOT);

        // Chỉ chấp nhận các vai trò hợp lệ
        if (!roleCode.equals("ADMIN")
                && !roleCode.equals("STUDENT")) {

            throw new IllegalArgumentException(
                    "Vai trò không hợp lệ: " + roleCode
            );
        }

        // Tìm role trong SQLite
        RoleEntity role = roleDao.findByCode(roleCode);

        // Nếu chưa tồn tại thì tạo mới
        if (role == null) {

            String roleName;

            if (roleCode.equals("ADMIN")) {
                roleName = "Quản trị viên";
            } else {
                roleName = "Học viên";
            }

            RoleEntity newRole = RoleEntity.builder()
                    .code(roleCode)
                    .name(roleName)
                    .description("Vai trò " + roleName)
                    .createdAt(dto.getCreatedAt())
                    .build();

            roleDao.insertRole(newRole);

            // Truy vấn lại để lấy ID thật
            role = roleDao.findByCode(roleCode);
        }

        // Kiểm tra khóa ngoại trước khi lưu user
        if (role == null || role.getId() <= 0) {
            throw new IllegalStateException(
                    "Không thể tạo hoặc tìm thấy role: " + roleCode
            );
        }

        // Kiểm tra dữ liệu người dùng
        if (dto.getUsername() == null
                || dto.getEmail() == null) {

            throw new IllegalArgumentException(
                    "Username hoặc email không hợp lệ"
            );
        }

        // Tạo UserEntity với roleId hợp lệ
        return UserEntity.builder()
                .id(dto.getId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .roleId(role.getId())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}