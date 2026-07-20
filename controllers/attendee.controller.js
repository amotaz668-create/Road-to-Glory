
const mongoose = require("mongoose");
const crypto = require("crypto"); 
const Event = require("../models/event.model");
const Reservation = require("../models/reservation.model");
const Ticket = require("../models/ticket.model");
const User = require("../models/user.model");
const Feedback = require("../models/feedback.model");

const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const eventStatus = require("../utils/eventStatus");
const attendanceStatus = require("../utils/attendanceStatus");


const generateUniqueCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

exports.getAvailableEvents = async (req, res, next) => {
  try {
    const events = await Event.find({
      isApproved: true,
      status: eventStatus.PUBLISHED, 
    }).populate("organizerId", "fullName email");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Available events retrieved successfully",
      total: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      userId: req.currentUser.id,
    })
      .populate(
        "eventId",
        "title location startDateTime endDateTime status"
      )
      .sort("-createdAt");

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Reservations retrieved successfully",
      total: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyTickets = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      userId: req.currentUser.id,
    }).select("_id");

    const reservationIds = reservations.map((r) => r._id);

    const tickets = await Ticket.find({
      reservationId: { $in: reservationIds },
    }).populate({
      path: "reservationId",
      populate: {
        path: "eventId",
        select: "title location startDateTime",
      },
    });

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Tickets retrieved successfully",
      total: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

exports.reserveEvent = async (req, res, next) => {
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = req.params;
    let { ticketCount } = req.body;


    ticketCount = ticketCount ? parseInt(ticketCount) : 1;
    if (ticketCount <= 0) {
      return next(appError.create("Ticket count must be at least 1", 400, httpStatusText.ERROR));
    }

    const event = await Event.findById(eventId).session(session);

    if (!event) {
      return next(appError.create("Event not found", 404, httpStatusText.ERROR));
    }

    if (!event.isApproved || event.status !== eventStatus.PUBLISHED) {
      return next(appError.create("Event is not available for reservation", 400, httpStatusText.ERROR));
    }

    const totalReserved = await Reservation.aggregate([
      { $match: { eventId: event._id, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$ticketCount" } } }
    ]).session(session);

    const currentReserved = totalReserved.length > 0 ? totalReserved[0].total : 0;

    if (currentReserved + ticketCount > event.capacity) {
      return next(appError.create("Sorry, this event is fully booked or does not have enough capacity", 400, httpStatusText.ERROR));
    }

    const existingReservation = await Reservation.findOne({
      eventId,
      userId: req.currentUser.id,
      status: { $ne: "cancelled" },
    }).session(session);

    if (existingReservation) {
      return next(appError.create("You already reserved this event", 400, httpStatusText.ERROR));
    }

    
    const totalAmount = (event.ticketPrice || 0) * ticketCount;

 
    const [reservation] = await Reservation.create([{
      userId: req.currentUser.id,
      eventId,
      ticketCount,
      totalAmount, 
      attendanceStatus: attendanceStatus.PENDING,
    }], { session });

  
    const ticketsData = [];
    for (let i = 0; i < ticketCount; i++) {
      ticketsData.push({
        reservationId: reservation._id,
        ticketCode: generateUniqueCode(),
        status: "valid"
      });
    }
    
    const createdTickets = await Ticket.insertMany(ticketsData, { session });

    
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "Reservation and tickets created successfully",
      data: {
        reservation,
        tickets: createdTickets
      },
    });
  } catch (error) {
   
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId).session(session);

    if (!reservation) {
      return next(appError.create("Reservation not found", 404, httpStatusText.ERROR));
    }

    if (reservation.userId.toString() !== req.currentUser.id.toString()) {
      return next(appError.create("You are not allowed to cancel this reservation", 403, httpStatusText.ERROR));
    }

    reservation.status = "cancelled";
    reservation.cancelledAt = new Date();
    await reservation.save({ session });

    
    await Ticket.updateMany(
      { reservationId: reservation._id },
      { status: "cancelled" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Reservation and related tickets cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const { ticketId, rating, comment } = req.body;

    const ticket = await Ticket.findById(ticketId).populate("reservationId");
    if (!ticket || ticket.reservationId.userId.toString() !== req.currentUser.id.toString()) {
      return next(appError.create("Ticket not found or does not belong to you", 404, httpStatusText.ERROR));
    }

    if (ticket.reservationId.attendanceStatus !== attendanceStatus.ATTENDED) {
      return next(appError.create("You can only submit feedback after attending the event", 400, httpStatusText.ERROR));
    }

    const existingFeedback = await Feedback.findOne({ ticketId });
    if (existingFeedback) {
      return next(appError.create("Feedback for this ticket already exists", 400, httpStatusText.ERROR));
    }

    const feedback = await Feedback.create({
      ticketId,
      rating,
      comment
    });

    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};
