package com.els.app.data.local.database;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.els.app.data.local.entity.RoleEntity;
import com.els.app.data.local.entity.PermissionEntity;
import com.els.app.data.local.entity.RolePermissionCrossRef;
import com.els.app.data.local.entity.UserEntity;
import com.els.app.data.local.entity.WordEntity;
import com.els.app.data.local.entity.IdiomEntity;
import com.els.app.data.local.entity.TopicEntity;
import com.els.app.data.local.entity.FlashcardEntity;
import com.els.app.data.local.entity.StreakLogEntity;
import com.els.app.data.local.entity.ExamEntity;
import com.els.app.data.local.entity.QuestionEntity;
import com.els.app.data.local.entity.ExamResultEntity;

import com.els.app.data.local.dao.UserDao;
import com.els.app.data.local.dao.PermissionDao;
import com.els.app.data.local.dao.WordDao;
import com.els.app.data.local.dao.FlashcardDao;
import com.els.app.data.local.dao.StreakLogDao;
import com.els.app.data.local.dao.RoleDao;

@Database(
        entities = {
                RoleEntity.class,
                PermissionEntity.class,
                RolePermissionCrossRef.class,
                UserEntity.class,
                WordEntity.class,
                IdiomEntity.class,
                TopicEntity.class,
                FlashcardEntity.class,
                StreakLogEntity.class,
                ExamEntity.class,
                QuestionEntity.class,
                ExamResultEntity.class
        },
        version = 1,
        exportSchema = false
)
public abstract class AppDatabase extends RoomDatabase {

        private static volatile AppDatabase INSTANCE;

        public abstract UserDao userDao();

        public abstract PermissionDao permissionDao();

        public abstract WordDao wordDao();

        public abstract FlashcardDao flashcardDao();

        public abstract StreakLogDao streakLogDao();

        public abstract RoleDao roleDao();

        public static synchronized AppDatabase getDatabase(Context context) {

                if (INSTANCE == null) {
                        INSTANCE = Room.databaseBuilder(
                                        context.getApplicationContext(),
                                        AppDatabase.class,
                                        "els_db"
                                )
                                .fallbackToDestructiveMigration()
                                .build();
                }

                return INSTANCE;
        }
}