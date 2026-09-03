package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.els.app.data.local.entity.UserEntity;

@Dao
public interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertUser(UserEntity user);

    @Query("SELECT * FROM users LIMIT 1")
    UserEntity getActiveUser();

    @Query("SELECT * FROM users WHERE id = :id LIMIT 1")
    UserEntity getUserById(long id);

    @Query("DELETE FROM users")
    void clearUserData();
}