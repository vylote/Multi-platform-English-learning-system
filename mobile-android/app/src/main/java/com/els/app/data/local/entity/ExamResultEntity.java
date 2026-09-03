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

@Entity(
        tableName = "exam_results",
        indices = {@Index("userId"), @Index("examId")},
        foreignKeys = {
                @ForeignKey(entity = UserEntity.class, parentColumns = "id",
                        childColumns = "userId", onDelete = ForeignKey.CASCADE),
                @ForeignKey(entity = ExamEntity.class, parentColumns = "id",
                        childColumns = "examId", onDelete = ForeignKey.CASCADE)
        }
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamResultEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @ColumnInfo(name = "userId")
    long userId;

    @ColumnInfo(name = "examId")
    long examId;

    // NUMERIC(5,2) ở Postgres -> double ở tầng mobile
    @ColumnInfo(name = "score")
    double score;

    // Thời gian làm bài thực tế (giây) - phục vụ chống gian lận
    @ColumnInfo(name = "time_spent")
    int timeSpent;

    @ColumnInfo(name = "submitted_at")
    String submittedAt;
}
