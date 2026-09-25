const topicLessonService = require("../services/topic-lesson.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class LessonController {
  async getTopicLesson(req, res, next) {
    try {
      const { topicId } = req.params;
      const lesson = await topicLessonService.getLesson(topicId);
      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message("Lấy bài luyện tập kết hợp thành công")
          .result(lesson)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  async completeLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const { topicId } = req.params;
      const { question_ids, quiz_answers, pronunciation_results } = req.body || {};

      if (!Array.isArray(question_ids) || !Array.isArray(quiz_answers) || !Array.isArray(pronunciation_results)) {
        throw new AppException(ErrorCode.INVALID_DATA, "Thiếu dữ liệu hoàn thành bài luyện tập");
      }

      const result = await topicLessonService.completeLesson({
        userId,
        topicId,
        questionIds: question_ids,
        quizAnswers: quiz_answers,
        pronunciationResults: pronunciation_results,
      });

      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message("Hoàn thành bài luyện tập")
          .result(result)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LessonController();