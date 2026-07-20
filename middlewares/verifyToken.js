const jwt = require("jsonwebtoken");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const verifyToken = (req, res, next) => {
  const authHeader =
    req.headers["Authorization"] || req.headers["authorization"];

  if (!authHeader) {
    const error = appError.create(
      "Token is Required",
      401,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    const error = appError.create(
      "Token is Required",
      401,
      httpStatusText.ERROR,
    );
    return next(error);
  }

  try {
    const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.currentUser = currentUser;
    next();
  } catch (err) {
    const error = appError.create("Invalid Token", 401, httpStatusText.ERROR);
    return next(error);
  }
};
module.exports = verifyToken;
