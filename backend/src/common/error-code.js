const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const ErrorCode = Object.freeze({
  // Hệ thống & Không xác định
  UNCATEGORIZED_EXCEPTION: { code: 9999, message: 'Uncategorized error', statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
  SYSTEM_ERROR: { code: 1016, message: 'Lỗi hệ thống khi xử lý dữ liệu', statusCode: HttpStatus.INTERNAL_SERVER_ERROR },
  INVALID_DATA: { code: 1021, message: 'Dữ liệu không hợp lệ hoặc thiếu thông tin bắt buộc', statusCode: HttpStatus.BAD_REQUEST },

  // Tài nguyên & Thực thể
  RESOURCE_EXISTED: { code: 1001, message: 'Resource already existed', statusCode: HttpStatus.CONFLICT },
  RESOURCE_NOT_FOUND: { code: 1002, message: 'Resource not found', statusCode: HttpStatus.NOT_FOUND },

  // Xác thực & Phân quyền (Auth & Security)
  UNAUTHENTICATED: { code: 1013, message: 'Unauthenticated', statusCode: HttpStatus.UNAUTHORIZED },
  UNAUTHORIZED: { code: 1009, message: "You don't have permission to do that", statusCode: HttpStatus.FORBIDDEN },

  // Nghiệp vụ học tiếng Anh
  WORD_NOT_FOUND: { code: 2001, message: 'Không tìm thấy từ vựng trong từ điển', statusCode: HttpStatus.NOT_FOUND },
  EXAM_NOT_FOUND: { code: 2002, message: 'Đề thi không tồn tại', statusCode: HttpStatus.NOT_FOUND },
  EXAM_EXPIRED: { code: 2003, message: 'Thời gian làm bài thi đã hết', statusCode: HttpStatus.BAD_REQUEST },
});

module.exports = { ErrorCode, HttpStatus };