const express = require("express");
const attendeeController = require("../controllers/attendee.controller");
const verifyToken = require("../middlewares/verifyToken");
const allowedTo = require("../middlewares/allowedTo");
const userRoles = require("../utils/userRole");

const router = express.Router();


router.get("/events", attendeeController.getAvailableEvents);


router.use(verifyToken, allowedTo(userRoles.ATTENDEE));



router.post("/events/:eventId/reserve", attendeeController.reserveEvent);  
router.get("/reservations", attendeeController.getMyReservations);
router.get("/tickets", attendeeController.getMyTickets);
router.delete("/reservations/:reservationId", attendeeController.cancelReservation); // تعديل للجمع
router.post("/feedback", attendeeController.submitFeedback);

module.exports = router;