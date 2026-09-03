package com.els.app.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.Index;
import androidx.room.PrimaryKey;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity(tableName = "words", indices = {@Index("word")})
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WordEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @NonNull
    @ColumnInfo(name = "word")
    String word;

    @ColumnInfo(name = "pronunciation")
    String pronunciation;

    @ColumnInfo(name = "part_of_speech")
    String partOfSpeech;

    @NonNull
    @ColumnInfo(name = "definition")
    String definition;

    @ColumnInfo(name = "example_sentence")
    String exampleSentence;
}
