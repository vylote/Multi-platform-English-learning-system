package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.els.app.data.local.entity.PermissionEntity;
import com.els.app.data.local.entity.RolePermissionCrossRef;
import java.util.List;

@Dao
public interface PermissionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertPermissions(List<PermissionEntity> permissions);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertRolePermissions(List<RolePermissionCrossRef> rolePermissions);

    // Lấy tất cả mã quyền của một vai trò cụ thể để thực hiện phân quyền offline
    @Query("SELECT p.code FROM permissions p " +
            "JOIN role_permissions rp ON p.id = rp.permissionId " +
            "WHERE rp.roleId = :roleId")
    List<String> getPermissionCodesByRoleId(long roleId);
}
