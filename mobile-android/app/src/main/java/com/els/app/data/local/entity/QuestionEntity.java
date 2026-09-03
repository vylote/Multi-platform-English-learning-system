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
        tableName = "questions",
        indices = {@Index("examId")},
        foreignKeys = @ForeignKey(entity = ExamEntity.class, parentColumns = "id",
                childColumns = "examId", onDelete = ForeignKey.CASCADE)
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuestionEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @ColumnInfo(name = "examId")
    long examId;

    @NonNull
    @ColumnInfo(name = "question_text")
    String questionText;

    @NonNull
    @ColumnInfo(name = "option_a")
    String optionA;

    @NonNull
    @ColumnInfo(name = "option_b")
    String optionB;

    @NonNull
    @ColumnInfo(name = "option_c")
    String optionC;

    @NonNull
    @ColumnInfo(name = "option_d")
    String optionD;

    // Giá trị: 'A' | 'B' | 'C' | 'D'
    @ColumnInfo(name = "correct_option")
    char correctOption;
}
