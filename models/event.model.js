const mongoose = require("mongoose");
const eventStatus = require("../utils/eventStatus");

const eventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    category: {
  type: String,
},

    eventType: {
      type: String,
    },

    location: {
      type: String,
    },

    startDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      required: true,
    },

    capacity: {
      type: Number,
    },

    status: {
      type: String,
      enum: Object.values(eventStatus),
      default: eventStatus.DRAFT,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);