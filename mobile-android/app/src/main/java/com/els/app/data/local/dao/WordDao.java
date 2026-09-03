package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.els.app.data.local.entity.WordEntity;
import java.util.List;

@Dao
public interface WordDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertWords(List<WordEntity> words);

    // Hỗ trợ tra từ offline bằng gợi ý tìm kiếm theo tiền tố
    @Query("SELECT * FROM words WHERE word LIKE :searchQuery || '%' ORDER BY word ASC LIMIT 50")
    List<WordEntity> searchWords(String searchQuery);

    @Query("SELECT * FROM words WHERE id = :id LIMIT 1")
    WordEntity getWordById(long id);
}