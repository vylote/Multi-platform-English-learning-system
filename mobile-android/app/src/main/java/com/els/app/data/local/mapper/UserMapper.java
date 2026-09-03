package com.els.app.data.local.mapper;

import com.els.app.data.local.dao.RoleDao;
import com.els.app.data.local.entity.RoleEntity;
import com.els.app.data.local.entity.UserEntity;
import com.els.app.data.remote.dto.response.UserResponse;

public class UserMapper {
    public static UserEntity toEntity(UserResponse dto, RoleDao roleDao) {
        RoleEntity role = roleDao.findByCode(dto.getRole());
        long roleId = (role != null) ? role.getId() : 0L;

        return UserEntity.builder()
                .id(dto.getId())
                .username(dto.getUsername())
                .email(dto.getEmail())
                .roleId(roleId)
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
