const mongoose = require("mongoose");
const attendanceStatus = require("../utils/attendanceStatus");

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
    ticketCount: {
      type: Number,
      default: 1,
    },
    ticketPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    attendanceStatus: {
      type: String,
      enum: Object.values(attendanceStatus),
      default: attendanceStatus.PENDING,
    },
    ConfirmedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Reservation", reservationSchema);
