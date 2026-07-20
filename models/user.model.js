const mongoose = require("mongoose");
const userRoles = require("../utils/userRole");
const validator = require("validator");
const userStatus = require("../utils/userStatus");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Please provide your full name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  },
  role: {
    type: String,
    enum: Object.values(userRoles),
    default: userRoles.ATTENDEE,
  },
  isVerified: {
    type: Boolean,
    default: false
    },

    status: {
        type: String,
        enum: Object.values(userStatus),
        default: userStatus.ACTIVE
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;



