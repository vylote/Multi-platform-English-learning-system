const jwt = require("jsonwebtoken");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

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
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};
