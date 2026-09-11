const jwt = require("jsonwebtoken");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");
const redisClient = require("../config/redis");

const SESSION_KEY_PREFIX = "session:";

// Middleware này là ASYNC (có gọi Redis) -> Express KHÔNG tự bắt lỗi async,
// bắt buộc phải try/catch + next(error) thủ công (khác với bản sync trước đó).
module.exports = async (req, res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(
      new AppException(
        ErrorCode.UNAUTHENTICATED,
        "Không tìm thấy Token xác thực. Truy cập bị từ chối.",
      ),
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sid) {
      // Token cũ (được tạo trước khi có sessionId) -> không hợp lệ với thiết kế mới, bắt đăng nhập lại
      return next(new AppException(ErrorCode.UNAUTHENTICATED, "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."));
    }

    // Kiểm tra ĐÚNG phiên này (userId + sessionId), không còn ảnh hưởng bởi các phiên khác
    const storedToken = await redisClient.get(`${SESSION_KEY_PREFIX}${decoded.id}:${decoded.sid}`);

    if (!storedToken || storedToken !== token) {
      console.log("token from cookies", token)
      return next(
        new AppException(
          ErrorCode.UNAUTHENTICATED,
          "Phiên đăng nhập đã hết hạn hoặc đã bị thu hồi. Vui lòng đăng nhập lại.",
        ),
      );
    }

    req.user = decoded;
    next();
  } catch (err) {
    // err.name = 'JsonWebTokenError' hoặc 'TokenExpiredError'
    // -> globalExceptionHandler đã có sẵn nhánh bắt riêng 2 loại lỗi này
    next(err);
  }
};