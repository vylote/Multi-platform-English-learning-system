package com.els.app.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.PrimaryKey;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity(tableName = "idioms")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class IdiomEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @NonNull
    @ColumnInfo(name = "idiom")
    String idiom;

    @NonNull
    @ColumnInfo(name = "meaning")
    String meaning;

    @ColumnInfo(name = "example")
    String example;
}
