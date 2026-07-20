const mongoose = require("mongoose");   

const feedbackSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 200
  }
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
