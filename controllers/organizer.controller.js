const mongoose = require("mongoose");
const Event = require("../models/event.model");
const Reservation = require("../models/reservation.model");
const Ticket = require("../models/ticket.model");
const User = require("../models/user.model");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const userRoles = require("../utils/userRole");
const attendanceStatus = require("../utils/attendanceStatus");
const eventStatus = require("../utils/eventStatus");

const getCurrentUserId = (user) => user?.id || user?._id;

const isEventOwnedByOrganizer = async (currentUser, eventId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return false;
  }

  const event = await Event.findById(eventId).select("organizerId");
  if (!event) {
    return false;
  }

  return (
    currentUser.role === userRoles.ADMIN ||
    event.organizerId.equals(currentUser.id || currentUser._id)
  );
};

exports.getAssignedEvents = async (req, res, next) => {
  try {
    const filter =
      req.currentUser.role === userRoles.ADMIN
        ? {}
        : { organizerId: getCurrentUserId(req.currentUser) };

    const events = await Event.find(filter).sort("-createdAt");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Assigned events retrieved successfully",
      total: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssignedEventById = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      const error = appError.create(
        "Event not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!(await isEventOwnedByOrganizer(req.currentUser, eventId))) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Event retrieved successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

exports.patchAssignedEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!(await isEventOwnedByOrganizer(req.currentUser, eventId))) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "eventType",
      "location",
      "startDateTime",
      "endDateTime",
      "capacity",
      "status",
      "isApproved",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.status &&
      !Object.values(eventStatus).includes(updates.status)
    ) {
      const error = appError.create(
        "Invalid event status",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const event = await Event.findByIdAndUpdate(eventId, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateTicketEntry = async (req, res, next) => {
  try {
    const { ticketCode, eventId } = req.body;

    if (!ticketCode) {
      const error = appError.create(
        "ticketCode is required",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const ticket = await Ticket.findOne({ ticketCode }).populate({
      path: "reservationId",
      populate: {
        path: "eventId",
        select: "title organizerId",
      },
    });

    if (!ticket) {
      const error = appError.create(
        "Ticket not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const reservation = ticket.reservationId;
    if (!reservation || !reservation.eventId) {
      const error = appError.create(
        "Ticket is not linked to a valid reservation",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const reservationEventId =
      reservation.eventId._id?.toString() || reservation.eventId.toString();

    if (eventId && reservationEventId !== eventId) {
      const error = appError.create(
        "Ticket does not belong to the provided event",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!(await isEventOwnedByOrganizer(req.currentUser, reservationEventId))) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (ticket.status === "used") {
      const error = appError.create(
        "Ticket has already been used",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (ticket.status === "cancelled") {
      const error = appError.create(
        "Ticket is cancelled",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    ticket.status = "used";
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = getCurrentUserId(req.currentUser);
    await ticket.save();

    reservation.attendanceStatus = attendanceStatus.ATTENDED;
    await reservation.save();

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Ticket validated successfully",
      data: {
        ticket,
        reservation,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getEventPerformance = async (req, res, next) => {
  try {
    const { eventId } = req.query;

    if (eventId && !(await isEventOwnedByOrganizer(req.currentUser, eventId))) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const events = eventId
      ? [await Event.findById(eventId)]
      : await Event.find({
          organizerId: getCurrentUserId(req.currentUser),
        }).sort("-createdAt");

    if (!events.length || !events[0]) {
      const error = appError.create(
        "No events found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const performance = await Promise.all(
      events.filter(Boolean).map(async (event) => {
        const reservations = await Reservation.find({ eventId: event._id });
        const tickets = await Ticket.find({
          reservationId: {
            $in: reservations.map((reservation) => reservation._id),
          },
        });

        const confirmedReservations = reservations.filter(
          (reservation) => reservation.status === "confirmed",
        ).length;
        const paidReservations = reservations.filter(
          (reservation) => reservation.paymentStatus === "paid",
        ).length;
        const attendedReservations = reservations.filter(
          (reservation) =>
            reservation.attendanceStatus === attendanceStatus.ATTENDED,
        ).length;
        const checkedInTickets = tickets.filter(
          (ticket) => ticket.status === "used",
        ).length;
        const capacity = event.capacity || 0;
        const occupancy = capacity
          ? Math.round((reservations.length / capacity) * 100)
          : 0;

        return {
          eventId: event._id,
          title: event.title,
          status: event.status,
          capacity,
          totalReservations: reservations.length,
          confirmedReservations,
          paidReservations,
          attendedReservations,
          checkedInTickets,
          occupancy,
        };
      }),
    );

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Event performance retrieved successfully",
      total: performance.length,
      data: eventId ? performance[0] : performance,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRegistrationsForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      const error = appError.create(
        "Event not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!(await isEventOwnedByOrganizer(req.currentUser, eventId))) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const registrations = await Reservation.find({ eventId })
      .populate("userId", "fullName email status")
      .populate("eventId", "title startDateTime endDateTime")
      .sort("-createdAt");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Event registrations retrieved successfully",
      total: registrations.length,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

exports.patchRegistrationForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const {
      reservationId,
      userId,
      status,
      paymentStatus,
      attendanceStatus: attendance,
    } = req.body;

    if (!reservationId && !userId) {
      const error = appError.create(
        "reservationId or userId is required",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!(await isEventOwnedByOrganizer(req.currentUser, eventId))) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const reservation = reservationId
      ? await Reservation.findById(reservationId)
      : await Reservation.findOne({ eventId, userId });

    if (!reservation) {
      const error = appError.create(
        "Reservation not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (reservation.eventId.toString() !== eventId.toString()) {
      const error = appError.create(
        "Reservation does not belong to this event",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (status) reservation.status = status;
    if (paymentStatus) reservation.paymentStatus = paymentStatus;
    if (attendance) {
      if (!Object.values(attendanceStatus).includes(attendance)) {
        const error = appError.create(
          "Invalid attendance status",
          400,
          httpStatusText.ERROR,
        );
        return next(error);
      }
      reservation.attendanceStatus = attendance;
    }

    await reservation.save();

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Reservation updated successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAttendees = async (req, res, next) => {
  try {
    const attendees = await User.find({ role: userRoles.ATTENDEE }).select(
      "fullName email status createdAt",
    );

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Attendee list retrieved successfully",
      total: attendees.length,
      data: attendees,
    });
  } catch (error) {
    next(error);
  }
};

exports.patchAttendeeReservation = async (req, res, next) => {
  try {
    const {
      reservationId,
      eventId,
      userId,
      status,
      paymentStatus,
      attendanceStatus: attendance,
    } = req.body;

    if (!reservationId && !(eventId && userId)) {
      const error = appError.create(
        "reservationId or eventId and userId are required",
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const reservation = reservationId
      ? await Reservation.findById(reservationId)
      : await Reservation.findOne({ eventId, userId });

    if (!reservation) {
      const error = appError.create(
        "Reservation not found",
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (
      !(await isEventOwnedByOrganizer(req.currentUser, reservation.eventId))
    ) {
      const error = appError.create(
        "You are not assigned to this event",
        403,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (status) reservation.status = status;
    if (paymentStatus) reservation.paymentStatus = paymentStatus;
    if (attendance) {
      if (!Object.values(attendanceStatus).includes(attendance)) {
        const error = appError.create(
          "Invalid attendance status",
          400,
          httpStatusText.ERROR,
        );
        return next(error);
      }
      reservation.attendanceStatus = attendance;
    }

    await reservation.save();

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Reservation updated successfully",
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};


exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      eventType,
      location,
      startDateTime,
      endDateTime,
      capacity,
    } = req.body;

    const event = await Event.create({
      organizerId: getCurrentUserId(req.currentUser),
      title,
      description,
      category,
      eventType,
      location,
      startDateTime,
      endDateTime,
      capacity,
      status: eventStatus.DRAFT,
      isApproved: false,
    });

    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteAssignedEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!(await isEventOwnedByOrganizer(req.currentUser, eventId))) {
      return next(
        appError.create(
          "You are not assigned to this event",
          403,
          httpStatusText.ERROR,
        ),
      );
    }

    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return next(
        appError.create("Event not found", 404, httpStatusText.ERROR),
      );
    }

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};