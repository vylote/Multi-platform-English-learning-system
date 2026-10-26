const adminExamService = require("../services/admin-exam.service");
const ApiResponse = require("../common/api-response");

class AdminExamController {
  // GET /api/v1/admin/topics
  async getTopics(req, res, next) {
    try {
      const topics = await adminExamService.getTopics();
      return res
        .status(200)
        .json(ApiResponse.success(topics, "Lấy danh mục chủ đề thành công."));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/exams
  async getExams(req, res, next) {
    try {
      const { page, limit, search, topicId, examType } = req.query;
      const data = await adminExamService.getExams({
        page,
        limit,
        search,
        topicId,
        examType,
      });

      return res
        .status(200)
        .json(ApiResponse.success(data, "Lấy danh sách đề thi thành công."));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/exams/:id
  async getExamDetail(req, res, next) {
    try {
      const exam = await adminExamService.getExamDetail(req.params.id);
      return res
        .status(200)
        .json(ApiResponse.success(exam, "Lấy chi tiết đề thi và câu hỏi thành công."));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/exams/generate
  async generateExam(req, res, next) {
    try {
      const { topicId, count, duration, title, method, examType } = req.body;
      const createdExam = await adminExamService.generateExam({
        topicId,
        count,
        duration,
        title,
        method,
        examType,
      });

      return res
        .status(201)
        .json(ApiResponse.success(createdExam, "Sinh đề thi thành công!"));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/admin/exams/:id
  async deleteExam(req, res, next) {
    try {
      const deleted = await adminExamService.deleteExam(req.params.id);
      return res
        .status(200)
        .json(ApiResponse.success(deleted, "Xóa đề thi thành công."));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminExamController();
