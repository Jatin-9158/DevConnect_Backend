const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();
const USER_SAFE_DATA = "firstName lastName photoURL gender age about skills";

// ✅ GET: Received Connection Requests
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const receivedRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested"
    }).populate("fromUserId", USER_SAFE_DATA);

    const requestSenders = receivedRequests.map((item) => ({
      fromUser: item.fromUserId,      
      requestId: item._id.toString()  
    }));
    

    return res.status(200).json({
      message: "Request Received Fetched Successfully",
      data: requestSenders
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

// ✅ GET: Connections
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [
        { toUserId: loggedInUser._id },
        { fromUserId: loggedInUser._id }
      ]
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const userConnections = connections.map((item) =>
      item.fromUserId._id.toString() === loggedInUser._id.toString()
        ? item.toUserId
        : item.fromUserId
    );

    return res.status(200).json({
      message: "All Connections Fetched Successfully",
      data: userConnections
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

// ✅ GET: User Feed (People you can connect with)
userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit; // Max 50
    const skip = (page - 1) * limit;

    const loggedInUser = req.user;

    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select("fromUserId toUserId");

    const excludedUserIds = new Set([
      ...connections.map((conn) => conn.fromUserId.toString()),
      ...connections.map((conn) => conn.toUserId.toString()),
      loggedInUser._id.toString(),
    ]);
    

    const users = await User.find({ _id: { $nin: [...excludedUserIds] } })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      message: "Users Fetched Successfully",
      data: users
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

module.exports = userRouter;
