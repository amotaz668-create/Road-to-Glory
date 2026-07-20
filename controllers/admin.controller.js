const User = require("../models/user.model");
const Event = require("../models/event.model");
const Reservation = require("../models/reservation.model");
const Ticket = require("../models/ticket.model");
const userRoles = require("../utils/userRole");

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const users = await User.find()
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments();

    return res.status(200).json({
      status: "success",
      results: users.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
      data: { users },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const changeUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid status value" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    return res.status(200).json({
      status: "success",
      message: "User status updated successfully",
      data: { user },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getPendingOrganizers = async (req, res) => {
  try {
    const pendingOrganizers = await User.find({
      role: userRoles.ORGANIZER,
      status: "pending",
    }).select("-password");
    return res.status(200).json({
      status: "success",
      results: pendingOrganizers.length,
      data: { organizers: pendingOrganizers },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const approveOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findById(organizerId);

    if (!organizer) {
      return res.status(404).json({
        status: "error",
        message: "Organizer not found",
      });
    }

    // Check that the user is actually an organizer
    if (organizer.role !== userRoles.ORGANIZER) {
      return res.status(400).json({
        status: "error",
        message: "User is not an organizer",
      });
    }

    // Check if already approved
    if (organizer.status === "active") {
      return res.status(400).json({
        status: "error",
        message: "Organizer is already approved",
      });
    }

    organizer.status = "active";
    await organizer.save();

    organizer.password = undefined;

    return res.status(200).json({
      status: "success",
      message: "Organizer approved successfully",
      data: { organizer },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const overrideEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findByIdAndUpdate(eventId, updates, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    }
    if (updates.status === "cancelled") {
      await Reservation.updateMany(
        { eventId: event._id },
        { status: "cancelled" },
      );
    }
    return res.status(200).json({
      status: "success",
      message: "Event updated successfully",
      data: { event },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const eventStats = await Event.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const bookingStats = await Reservation.aggregate([
      {
        $group: {
          _id: null,
          totalReservations: { $sum: 1 },
          confirmedReservations: {
            $sum: {
              $cond: {
                if: { $eq: ["$status", "confirmed"] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]);

    const attendanceStats = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          actualAttendance: {
            $sum: {
              $cond: [{ $eq: ["$status", "used"] }, 1, 0],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        usersOverview: userStats,
        eventsOverview: eventStats,
        bookingsOverview: bookingStats[0] || {
          totalReservations: 0,
          confirmedReservations: 0,
        },
        attendanceOverview: attendanceStats[0] || {
          totalTickets: 0,
          actualAttendance: 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = {
  getAllUsers,
  changeUserStatus,
  getPendingOrganizers,
  approveOrganizer,
  overrideEvent,
  getPlatformAnalytics,
};
