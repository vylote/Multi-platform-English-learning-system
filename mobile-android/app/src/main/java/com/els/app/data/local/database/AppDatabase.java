package com.els.app.data.local.database;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import com.els.app.data.local.entity.*;
import com.els.app.data.local.dao.*;

@Database(
        entities = {
                RoleEntity.class, PermissionEntity.class, RolePermissionCrossRef.class,
                UserEntity.class, WordEntity.class, IdiomEntity.class, TopicEntity.class,
                FlashcardEntity.class, StreakLogEntity.class, ExamEntity.class,
                QuestionEntity.class, ExamResultEntity.class
        },
        version = 1,
        exportSchema = false
        //TODO: production thì true
)
public abstract class AppDatabase extends RoomDatabase {

        public abstract UserDao userDao();
        public abstract PermissionDao permissionDao();
        public abstract WordDao wordDao();
        public abstract FlashcardDao flashcardDao();
        public abstract StreakLogDao streakLogDao();

        public abstract RoleDao roleDao();

        private static AppDatabase INSTANCE;

        public static synchronized AppDatabase getDatabase(final Context context) {
                if (INSTANCE == null) {
                        INSTANCE = Room.databaseBuilder(
                                        context.getApplicationContext(),
                                        AppDatabase.class,
                                        "els_db"
                                )
                                .fallbackToDestructiveMigration(true)
                                .build();
                }
                return INSTANCE;
        }
}