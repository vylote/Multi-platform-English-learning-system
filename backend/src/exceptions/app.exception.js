class AppException extends Error {
  constructor(errorCode, customMessage = null) {
    super(customMessage || errorCode.message);
    this.errorCode = errorCode;
    
    // Giữ nguyên stack trace của Node.js
    Error.captureStackTrace(this, this.constructor);
  }

  getErrorCode() {
    return this.errorCode;
  }
}

module.exports = AppException;