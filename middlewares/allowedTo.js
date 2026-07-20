const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");

const allowedTo = (...roles) => {
  return (req, res, next) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      const error = appError.create(
        "You do not have permission to perform this action",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    next();
  };
};

module.exports = allowedTo;
