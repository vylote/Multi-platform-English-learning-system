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
        tableName = "flashcards",
        indices = {
                @Index(value = {"userId", "wordId"}, unique = true),
                @Index("topicId")
        },
        foreignKeys = {
                @ForeignKey(entity = UserEntity.class, parentColumns = "id",
                        childColumns = "userId", onDelete = ForeignKey.CASCADE),
                @ForeignKey(entity = WordEntity.class, parentColumns = "id",
                        childColumns = "wordId", onDelete = ForeignKey.CASCADE),
                @ForeignKey(entity = TopicEntity.class, parentColumns = "id",
                        childColumns = "topicId", onDelete = ForeignKey.CASCADE)
        }
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FlashcardEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @ColumnInfo(name = "userId")
    long userId;

    @ColumnInfo(name = "wordId")
    long wordId;

    @ColumnInfo(name = "topicId")
    long topicId;

    // Giá trị hợp lệ: NEW | LEARNING | MASTERED.
    // Room không có annotation CHECK constraint -> validate ở tầng Repository/Mapper.
    @Builder.Default
    @ColumnInfo(name = "status")
    String status = "NEW";

    @ColumnInfo(name = "last_reviewed")
    String lastReviewed;
}
