package com.els.app.data.remote.api;

import com.els.app.data.remote.dto.ApiModels.*;
import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.data.remote.dto.response.UserResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

/** Tất cả endpoint nghiệp vụ mà frontend-web đang dùng (prefix /api/v1 nằm trong BASE_URL). */
public interface LearningApiService {

    // ---------- Onboarding ----------
    @POST("onboarding/complete-info")
    Call<ApiResponse<UserResponse>> completeOnboarding(@Body OnboardingRequest body);

    // ---------- Lộ trình ----------
    @GET("learning-path")
    Call<ApiResponse<LearningPath>> getLearningPath();

    // ---------- Streak ----------
    @GET("streaks/status")
    Call<ApiResponse<StreakStatus>> getStreakStatus(@Query("timezone_offset") int timezoneOffset);

    @GET("streaks/week")
    Call<ApiResponse<List<StreakDay>>> getStreakWeek(@Query("timezone_offset") int timezoneOffset);

    // ---------- Flashcard ----------
    @GET("flashcards/daily")
    Call<ApiResponse<List<FlashcardDto>>> getDailyFlashcards();

    @GET("flashcards/practice/{topicId}")
    Call<ApiResponse<List<FlashcardDto>>> getPracticeFlashcards(@Path("topicId") long topicId);

    @PUT("flashcards/{id}")
    Call<ApiResponse<FlashcardUpdateResult>> updateFlashcard(@Path("id") long id,
                                                             @Body FlashcardUpdateRequest body);

    // ---------- Chủ đề (cho màn chọn chủ đề thi / ôn tập) ----------
    @GET("topics")
    Call<ApiResponse<List<TopicDto>>> getTopics();

    // ---------- Từ điển (không cần đăng nhập) ----------
    @GET("words/search")
    Call<ApiResponse<List<WordDto>>> searchWords(@Query("q") String query);

    // ---------- Bài học theo chủ đề ----------
    @GET("lessons/topics/{topicId}")
    Call<ApiResponse<LessonDto>> getLesson(@Path("topicId") long topicId);

    @POST("lessons/topics/{topicId}/complete")
    Call<ApiResponse<LessonResult>> completeLesson(@Path("topicId") long topicId,
                                                   @Body LessonCompleteRequest body);

    // ---------- Đề thi ----------
    @GET("exams")
    Call<ApiResponse<PageDto<ExamDto>>> getExams(@Query("topic_id") Long topicId,
                                                 @Query("page") int page,
                                                 @Query("pageSize") int pageSize);

    @GET("exams/placement-exam")
    Call<ApiResponse<ExamDto>> getPlacementExam();

    @GET("exams/history")
    Call<ApiResponse<List<ExamHistoryItem>>> getExamHistory();

    @POST("exams/{id}/start")
    Call<ApiResponse<ExamStartResult>> startExam(@Path("id") long examId,
                                                 @Query("page") int page,
                                                 @Query("pageSize") int pageSize);

    @POST("exams/{id}/submit")
    Call<ApiResponse<ExamResult>> submitExam(@Path("id") long examId,
                                             @Body SubmitExamRequest body);

    @POST("exams/{id}/cancel")
    Call<ApiResponse<Object>> cancelExam(@Path("id") long examId,
                                         @Body CancelExamRequest body);
}
