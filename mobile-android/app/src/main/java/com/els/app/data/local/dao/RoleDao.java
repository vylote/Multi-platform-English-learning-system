package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.els.app.data.local.entity.RoleEntity;

@Dao
public interface RoleDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    long insertRole(RoleEntity role);

    @Query("SELECT * FROM roles WHERE code = :code LIMIT 1")
    RoleEntity findByCode(String code);

    @Query("SELECT * FROM roles WHERE id = :id LIMIT 1")
    RoleEntity findById(long id);

    @Query("DELETE FROM roles")
    void deleteAll();
}