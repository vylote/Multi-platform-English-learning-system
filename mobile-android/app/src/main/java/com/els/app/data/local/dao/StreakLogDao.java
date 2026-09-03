package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.els.app.data.local.entity.StreakLogEntity;
import java.util.List;

@Dao
public interface StreakLogDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertStreakLog(StreakLogEntity log);

    @Query("SELECT * FROM streak_logs WHERE userId = :userId ORDER BY activity_date DESC")
    List<StreakLogEntity> getStreakLogsByUserId(long userId);
}
