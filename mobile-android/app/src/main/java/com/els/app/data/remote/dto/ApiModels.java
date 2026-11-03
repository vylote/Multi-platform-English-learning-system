package com.els.app.data.remote.dto;

import com.google.gson.annotations.SerializedName;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Toàn bộ DTO mới gom trong 1 file cho gọn.
 * Tên field JSON khớp đúng với backend (xem các file *.model.js và *.service.js).
 */
public class ApiModels {

    private ApiModels() { }

    // =====================================================================
    // REQUEST
    // =====================================================================

    @Data
    @AllArgsConstructor
    public static class OnboardingRequest {
        @SerializedName("experience_level") private String experienceLevel; // BEGINNER | EXPERIENCED
        @SerializedName("learning_purpose") private String learningPurpose; // COMMUNICATION | CAREER | TRAVEL | HOBBY | null
    }

    @Data
    @AllArgsConstructor
    public static class FlashcardUpdateRequest {
        private String status; // LEARNING | MASTERED
        @SerializedName("timezone_offset") private int timezoneOffset;
    }

    @Data
    @AllArgsConstructor
    public static class Answer {
        @SerializedName("question_id") private long questionId;
        @SerializedName("selected_option") private String selectedOption; // "A" | "B" | "C" | "D"
    }

    @Data
    @AllArgsConstructor
    public static class SubmitExamRequest {
        @SerializedName("session_id") private long sessionId;
        private List<Answer> answers;
        @SerializedName("timezone_offset") private int timezoneOffset;
    }

    @Data
    @AllArgsConstructor
    public static class CancelExamRequest {
        @SerializedName("session_id") private long sessionId;
    }

    @Data
    @AllArgsConstructor
    public static class PronResult {
        private String word;
        @SerializedName("isCorrect") private boolean correct;
    }

    @Data
    @AllArgsConstructor
    public static class LessonCompleteRequest {
        @SerializedName("question_ids") private List<Long> questionIds;
        @SerializedName("quiz_answers") private List<Answer> quizAnswers;
        @SerializedName("pronunciation_results") private List<PronResult> pronunciationResults;
        @SerializedName("timezone_offset") private int timezoneOffset;
    }

    // =====================================================================
    // RESPONSE
    // =====================================================================

    @Data
    public static class StreakStatus {
        private int currentStreak;
        private boolean completedToday;
    }

    @Data
    public static class StreakDay {
        private String date;       // "2026-11-02"
        private boolean completed;
    }

    @Data
    public static class WordDto {
        private Long id;
        private String word;
        private String pronunciation;
        @SerializedName("part_of_speech") private String partOfSpeech;
        @SerializedName("meaning_vi") private String meaningVi;
        @SerializedName("isExternal") private boolean external;
    }

    @Data
    public static class FlashcardDto {
        private long id;
        @SerializedName("word_id") private long wordId;
        @SerializedName("topic_id") private Long topicId;
        private String status; // NEW | LEARNING | MASTERED
        private WordDto word;
    }

    @Data
    public static class FlashcardUpdateResult {
        private FlashcardDto flashcard;
        private StreakStatus streak; // != null khi vừa hoàn thành bộ từ hằng ngày
    }

    @Data
    public static class PathTopic {
        private long id;
        private String title;
        private int orderIndex;
        private String difficulty;
        private int totalWords;
        private int masteredWords;
        private Double bestExamScore;
        private Double bestLessonScore;
        private int masteryPercent;
        @SerializedName("isUnlocked") private boolean unlocked;
        @SerializedName("isCurrent") private boolean current;
    }

    @Data
    public static class LearningPath {
        private String tier;
        private boolean needsPlacement;
        private List<PathTopic> path;
    }

    @Data
    public static class ExamDto {
        private long id;
        @SerializedName("topic_id") private Long topicId;
        private String title;
        private int duration; // phút
        @SerializedName("question_count") private int questionCount;
        @SerializedName("exam_type") private String examType;
    }

    @Data
    public static class PageDto<T> {
        private int currentPage;
        private int pageSize;
        private int totalPages;
        private int totalElements;
        @SerializedName("isLast") private boolean last;
        private List<T> data;
    }

    @Data
    public static class QuestionDto {
        private long id;
        @SerializedName("question_text") private String questionText;
        @SerializedName("option_a") private String optionA;
        @SerializedName("option_b") private String optionB;
        @SerializedName("option_c") private String optionC;
        @SerializedName("option_d") private String optionD;
    }

    @Data
    public static class ExamStartResult {
        @SerializedName("session_id") private long sessionId;
        @SerializedName("started_at") private String startedAt;
        private int duration;
        private PageDto<QuestionDto> questions;
    }

    @Data
    public static class ReviewItem {
        @SerializedName("question_id") private long questionId;
        @SerializedName("question_text") private String questionText;
        @SerializedName("correct_option") private String correctOption;
        @SerializedName("selected_option") private String selectedOption;
        @SerializedName("is_correct") private boolean correct;
    }

    @Data
    public static class ExamResult {
        private double score; // thang 10
        @SerializedName("correct_count") private int correctCount;
        @SerializedName("total_questions") private int totalQuestions;
        @SerializedName("time_spent") private int timeSpent; // giây
        @SerializedName("tier_assigned") private String tierAssigned; // chỉ có khi thi đầu vào
        private List<ReviewItem> review;
    }

    @Data
    public static class ExamHistoryItem {
        private long id;
        @SerializedName("exam_id") private long examId;
        @SerializedName("exam_title") private String examTitle;
        private double score;
        @SerializedName("time_spent") private int timeSpent;
        @SerializedName("submitted_at") private String submittedAt;
    }

    @Data
    public static class LessonWord {
        private long wordId;
        private String word;
        private String pronunciation;
        private String meaningVi;
    }

    @Data
    public static class LessonQuestion {
        private long id;
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
    }

    @Data
    public static class PronWord {
        private String word;
        private String pronunciation;
    }

    @Data
    public static class LessonDto {
        private List<LessonWord> vocabulary;
        private List<LessonQuestion> questions;
        private List<PronWord> pronunciationWords;
    }

    @Data
    public static class LessonResult {
        private double quizScore;          // 0-100
        private double pronunciationScore; // 0-100
        private double combinedScore;      // 0-100
    }

    // =====================================================================
    // CHỦ ĐỀ (GET /topics, GET /admin/topics)
    // =====================================================================

    @Data
    public static class TopicDto {
        private long id;
        private String title;
        private String description;
        private String difficulty;                       // chỉ có ở /admin/topics
        @SerializedName("order_index") private Integer orderIndex;
    }

    // =====================================================================
    // ADMIN
    // =====================================================================

    @Data
    public static class Pagination {
        private int total;
        private int page;
        private int limit;
        private int totalPages;
    }

    @Data
    public static class AdminUserItem {
        private long id;
        private String username;
        private String email;
        private String tier;
        @SerializedName("experience_level") private String experienceLevel;
        @SerializedName("learning_purpose") private String learningPurpose;
        @SerializedName("created_at") private String createdAt;
        @SerializedName("role_id") private long roleId;
        @SerializedName("role_code") private String roleCode;
        @SerializedName("role_name") private String roleName;
    }

    @Data
    public static class AdminUserPage {
        private List<AdminUserItem> users;
        private Pagination pagination;
    }

    @Data
    public static class UserStats {
        private int totalUsers;
        private int totalStudents;
        private int totalAdmins;
        private int newUsersWeek;
    }

    @Data
    public static class RoleDto {
        private long id;
        private String code;
        private String name;
        private String description;
    }

    @Data
    @AllArgsConstructor
    public static class UpdateUserRoleRequest {
        @SerializedName("role_id") private long roleId;
    }

    @Data
    public static class PermissionDto {
        private long id;
        private String code;
        private String name;
        private String description;
        private String groupKey;
        private String groupName;
    }

    @Data
    public static class RolePermissionData {
        private List<RoleDto> roles;
        private List<PermissionDto> permissions;
        private java.util.Map<String, List<Long>> rolePermissions; // roleId -> danh sách permissionId
    }

    @Data
    @AllArgsConstructor
    public static class UpdateRolePermissionsRequest {
        private List<Long> permissionIds;
    }

    @Data
    public static class AdminExamItem {
        private long id;
        @SerializedName("topic_id") private Long topicId;
        private String title;
        private int duration;
        @SerializedName("exam_type") private String examType;
        @SerializedName("created_at") private String createdAt;
        @SerializedName("topic_title") private String topicTitle;
        @SerializedName("topic_difficulty") private String topicDifficulty;
        @SerializedName("question_count") private int questionCount;
    }

    @Data
    public static class AdminExamPage {
        private List<AdminExamItem> exams;
        private Pagination pagination;
    }

    @Data
    public static class AdminQuestion {
        private long id;
        @SerializedName("question_text") private String questionText;
        @SerializedName("option_a") private String optionA;
        @SerializedName("option_b") private String optionB;
        @SerializedName("option_c") private String optionC;
        @SerializedName("option_d") private String optionD;
        @SerializedName("correct_option") private String correctOption;
    }

    @Data
    public static class AdminExamDetail {
        private long id;
        private String title;
        private int duration;
        @SerializedName("exam_type") private String examType;
        @SerializedName("topic_title") private String topicTitle;
        @SerializedName("question_count") private int questionCount;
        private List<AdminQuestion> questions;
    }

    @Data
    @AllArgsConstructor
    public static class GenerateExamRequest {
        private String examType;   // TOPIC | PLACEMENT
        private Long topicId;      // null khi PLACEMENT (Gson bỏ qua field null)
        private String title;      // null/"" -> backend tự đặt tên
        private int count;         // 4..50
        private int duration;      // 5..180 phút
        private String method;     // AUTO | AI | DATABASE
    }

    @Data
    public static class GeneratedExam {
        private long id;
        private String title;
    }

    @Data
    public static class SettingItem {
        private String key;
        private String rawValue;
        private String dataType;
        private String groupName;
        private String label;
        private String description;
    }

    @Data
    public static class SettingsData {
        private List<SettingItem> settings;
    }

    @Data
    @AllArgsConstructor
    public static class UpdateSettingsRequest {
        private java.util.Map<String, String> settings;
    }
}
