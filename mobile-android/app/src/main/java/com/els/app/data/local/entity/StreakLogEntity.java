package com.els.app.data.local.entity;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Ignore;
import androidx.room.Index;
import androidx.room.PrimaryKey;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Tương ứng bảng "streak_logs".
 */
@Entity(
        tableName = "streak_logs",
        indices = {@Index(value = {"userId", "activity_date"}, unique = true)},
        foreignKeys = @ForeignKey(entity = UserEntity.class, parentColumns = "id",
                childColumns = "userId", onDelete = ForeignKey.CASCADE)
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StreakLogEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @ColumnInfo(name = "userId")
    long userId;

    @ColumnInfo(name = "activity_date")
    String activityDate;

    @ColumnInfo(name = "timezone_offset")
    int timezoneOffset;
}
