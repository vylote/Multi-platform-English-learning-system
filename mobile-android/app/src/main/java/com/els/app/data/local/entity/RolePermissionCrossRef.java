package com.els.app.data.local.entity;

import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Ignore;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity(
        tableName = "role_permissions",
        primaryKeys = {"roleId", "permissionId"},
        foreignKeys = {
                @ForeignKey(entity = RoleEntity.class, parentColumns = "id",
                        childColumns = "roleId", onDelete = ForeignKey.CASCADE),
                @ForeignKey(entity = PermissionEntity.class, parentColumns = "id",
                        childColumns = "permissionId", onDelete = ForeignKey.CASCADE)
        }
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RolePermissionCrossRef {
    long roleId;
    long permissionId;
}
