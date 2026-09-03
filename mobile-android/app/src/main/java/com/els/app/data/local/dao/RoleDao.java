package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.els.app.data.local.entity.RoleEntity;
import java.util.List;

@Dao
public interface RoleDao {
    @Query("SELECT * FROM roles WHERE code = :code LIMIT 1")
    RoleEntity findByCode(String code);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<RoleEntity> roles);

    @Query("SELECT COUNT(*) FROM roles")
    int count();
}