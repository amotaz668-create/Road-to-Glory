const mongoose = require('mongoose');
const { ADMIN_ACTIONS_LIST } = require("../utils/adminActions");

const adminLoggerSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ADMIN_ACTIONS_LIST
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null
    },
  details: {
    type: String,
    required: true
    },
    ipAddress: {
        type: String,
        required: true
    }
} , { timestamps: true });

module.exports = mongoose.model('AdminLogger', adminLoggerSchema);