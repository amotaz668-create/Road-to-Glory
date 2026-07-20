const AdminLogger = require("../models/adminLogger.model");

const adminLogger = (actionType) => {
  return async (req, res, next) => {
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await AdminLogger.create({
            adminId: req.user?._id,
            action: actionType,
            targetId:
              req.params.eventId ||
              req.body.userId ||
              req.body.organizerId ||
              null,
            details: `Admin performed ${actionType} on endpoint ${req.originalUrl}`,
            ipAddress: req.ip || req.socket?.remoteAddress,
          });
        } catch (error) {
          console.error("Error logging admin action:", error);
        }
      }
    });

    next();
  };
};

module.exports = adminLogger;