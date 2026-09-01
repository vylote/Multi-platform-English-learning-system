class ApiResponse {
  constructor({ code = '1000', message = 'Success', result = null }) {
    this.code = code;
    this.message = message;
    this.result = result;
  }

  // Builder tĩnh mô phỏng ApiResponse.builder()...build()
  static builder() {
    let _code = '1000';
    let _message = 'Success';
    let _result = null;

    return {
      code(c) {
        _code = String(c);
        return this;
      },
      message(m) {
        _message = m;
        return this;
      },
      result(r) {
        _result = r;
        return this;
      },
      build() {
        return new ApiResponse({ code: _code, message: _message, result: _result });
      },
    };
  }

  // Helper nhanh khi thành công
  static success(result = null, message = 'Success') {
    return ApiResponse.builder()
      .code('1000')
      .message(message)
      .result(result)
      .build();
  }
}

module.exports = ApiResponse;