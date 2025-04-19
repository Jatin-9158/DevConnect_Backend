const mongoose = require("mongoose");
const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const requestRouter = express.Router();

// Route to send connection request with 'interested' or 'ignored' status
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status.toLowerCase();
    const allowedStatus = ["ignored", "interested"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status type: " + status });
    }

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "You cannot send a connection request to yourself." });
    }

    const isValidUser = await User.findById(toUserId);
    if (!isValidUser) {
      return res.status(404).json({ message: "No such user exists." });
    }

    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    });

    if (existingConnectionRequest) {
      return res.status(409).json({ message: "Connection request already exists." });
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status
    });

    const savedRequest = await connectionRequest.save();
    return res.status(201).json({
      message: `${req.user.firstName} marked ${isValidUser.firstName} as '${status}' successfully.`,
      data: savedRequest
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong." });
  }
});

// Route to review the connection request (accepted or rejected)
requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const reviewStatus = req.params.status.toLowerCase();
    const requestId = req.params.requestId;
    const ALLOWED_UPDATES = ["accepted", "rejected"];

    if (!ALLOWED_UPDATES.includes(reviewStatus)) {
      return res.status(400).json({ message: "Invalid review status type. Must be 'accepted' or 'rejected'." });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID." });
    }

    const connectionRequest = await ConnectionRequest.findById(requestId);

    if (
      !connectionRequest ||
      connectionRequest.toUserId.toString() !== req.user._id.toString() ||
      connectionRequest.status !== "interested"
    ) {
      return res.status(404).json({ message: "Connection request not found or already reviewed." });
    }

    connectionRequest.status = reviewStatus;


    const updatedRequest = await connectionRequest.save();

    return res.status(200).json({
      message: `Connection request ${reviewStatus} successfully.`,
      data: updatedRequest
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong." });
  }
});

module.exports = requestRouter;
