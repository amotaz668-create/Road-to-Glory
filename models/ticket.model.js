const mongoose = require("mongoose");
const ticketStatus = require("../utils/ticketStatus");

const ticketSchema = new mongoose.Schema({
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation",
    required: true,
  },

  ticketCode: {
    type: String,
    required: true,
    unique: true,
  },

  qrCodeUrl: {
    type: String,
  },

  status: {
    type: String,
    enum: Object.values(ticketStatus),
    default: ticketStatus.ACTIVE,
  },

  checkedInAt: {
    type: Date,
  },

  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);