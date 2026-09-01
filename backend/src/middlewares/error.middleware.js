const AppException = require('../exceptions/app.exception');
const { ErrorCode } = require('../common/error-code');
const ApiResponse = require('../common/api-response');

// Express Error Handling Middleware bắt buộc đủ 4 tham số: (err, req, res, next)
const globalExceptionHandler = (err, req, res, next) => {
  // 1. Bắt AppException (Tương đương @ExceptionHandler(AppException.class))
  if (err instanceof AppException) {
    const errorCode = err.getErrorCode();

    return res.status(errorCode.statusCode).json(
      ApiResponse.builder()
        .code(errorCode.code)
        .message(err.message || errorCode.message)
        .build()
    );
  }

  // 2. Bắt lỗi JWT Token (Xác thực không hợp lệ / Hết hạn)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const errorCode = ErrorCode.UNAUTHENTICATED;

    return res.status(errorCode.statusCode).json(
      ApiResponse.builder()
        .code(errorCode.code)
        .message(errorCode.message)
        .build()
    );
  }

  // 3. Bắt lỗi ngoại lệ không xác định (Tương đương @ExceptionHandler(Exception.class))
  console.error('🔥 BẮT ĐƯỢC THỦ PHẠM GÂY LỖI 9999: ', err);
  const errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

  return res.status(errorCode.statusCode).json(
    ApiResponse.builder()
      .code(errorCode.code)
      .message(errorCode.message)
      .build()
  );
};

// Bắt lỗi đường dẫn không tồn tại 404 (Tương đương NoResourceFoundException)
const noResourceFoundHandler = (req, res, next) => {
  return res.status(404).json(
    ApiResponse.builder()
      .code(404)
      .message('Không tìm thấy đường dẫn hoặc tài nguyên (404)')
      .build()
  );
};

module.exports = { globalExceptionHandler, noResourceFoundHandler };