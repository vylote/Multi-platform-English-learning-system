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
        tableName = "users",
        indices = {
                @Index(value = "username", unique = true),
                @Index(value = "email", unique = true),
                @Index("roleId")
        },
        foreignKeys = @ForeignKey(
                entity = RoleEntity.class,
                parentColumns = "id",
                childColumns = "roleId",
                onDelete = ForeignKey.CASCADE
        )
)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @Ignore)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserEntity {

    @PrimaryKey(autoGenerate = true)
    long id;

    @NonNull
    @ColumnInfo(name = "username")
    String username;

    @NonNull
    @ColumnInfo(name = "email")
    String email;

    @ColumnInfo(name = "roleId")
    long roleId;

    @ColumnInfo(name = "created_at")
    String createdAt;
}
