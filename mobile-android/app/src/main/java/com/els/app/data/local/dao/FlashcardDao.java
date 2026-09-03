package com.els.app.data.local.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.els.app.data.local.entity.FlashcardEntity;
import java.util.List;

@Dao
public interface FlashcardDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertFlashcards(List<FlashcardEntity> flashcards);

    @Query("SELECT * FROM flashcards WHERE userId = :userId")
    List<FlashcardEntity> getFlashcardsByUserId(long userId);

    @Query("UPDATE flashcards SET status = :status, last_reviewed = :lastReviewed WHERE id = :id")
    void updateFlashcardStatus(long id, String status, String lastReviewed);

    @Query("DELETE FROM flashcards WHERE id = :id")
    void deleteFlashcard(long id);
}
