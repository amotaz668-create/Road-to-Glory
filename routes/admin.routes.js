const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const adminLogger = require("../middlewares/adminLogger");
const userRoles = require("../utils/userRole");

const { ADMIN_ACTIONS } = require("../utils/adminActions");

router.use(verifyToken, allowedTo(userRoles.ADMIN));  
router
  .route("/users")
  .get(adminLogger(ADMIN_ACTIONS.GET_USERS), adminController.getAllUsers)
  .patch(
    adminLogger(ADMIN_ACTIONS.CHANGE_USER_STATUS),
    adminController.changeUserStatus,
  );

router.get("/organizers/pending", adminController.getPendingOrganizers);

router.patch(
  "/organizers/approve/:organizerId",
  adminLogger(ADMIN_ACTIONS.APPROVE_ORGANIZER),
  adminController.approveOrganizer,
);

router.patch(
  "/events/override/:eventId",
  adminLogger(ADMIN_ACTIONS.OVERRIDE_EVENT),
  adminController.overrideEvent,
);

router.get(
  "/analytics",
  adminLogger(ADMIN_ACTIONS.VIEW_ANALYTICS),
  adminController.getPlatformAnalytics,
);

module.exports = router;
