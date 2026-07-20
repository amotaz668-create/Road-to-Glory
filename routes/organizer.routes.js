const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const organizerController = require("../controllers/organizer.controller");
const router = express.Router();
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/userRole");

router.use(
  verifyToken,
  allowedTo(userRoles.ORGANIZER, userRoles.ADMIN),
);

router.route("/performance").get(organizerController.getEventPerformance);

router.route("/tickets/validate").post(organizerController.validateTicketEntry);

router
  .route("/events")
  .post(organizerController.createEvent)
  .get(organizerController.getAssignedEvents);

router
  .route("/events/:eventId")
  .get(organizerController.getAssignedEventById)
  .patch(organizerController.patchAssignedEvent)
  .delete(organizerController.deleteAssignedEvent);

router.route("/events").get(organizerController.getAssignedEvents);

router
  .route("/events/:eventId")
  .get(organizerController.getAssignedEventById)
  .patch(organizerController.patchAssignedEvent);

router
  .route("/:eventId")
  .get(organizerController.getRegistrationsForEvent)
  .patch(organizerController.patchRegistrationForEvent);

router
  .route("/")
  .get(organizerController.getAllAttendees)
  .patch(organizerController.patchAttendeeReservation);

module.exports = router;
