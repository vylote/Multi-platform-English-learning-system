package com.els.app.data.local.entity;

import androidx.annotation.NonNull;
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
        tableName = "exams",
        indices = {@Index("topicId")},
        foreignKeys = @ForeignKey(entity = TopicEntity.class, parentColumns = "id",
                childColumns = "topicId", onDelete = ForeignKey.CASCADE)
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @ColumnInfo(name = "topicId")
    long topicId;

    @NonNull
    @ColumnInfo(name = "title")
    String title;

    // Thời lượng làm bài (phút)
    @ColumnInfo(name = "duration")
    int duration;

    @ColumnInfo(name = "created_at")
    String createdAt;
}
