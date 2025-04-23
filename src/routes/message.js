// routes/messages.js
const express = require("express");
const Message = require("../models/message");
const msgRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const mongoose = require('mongoose');
msgRouter.get('/last-message/:userId', userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user._id;

    const senderId = new mongoose.Types.ObjectId(loggedInUserId);
    const targetUserId = new mongoose.Types.ObjectId(userId);

    const lastMessage = await Message.findOne({
      $or: [
        { senderId, targetUserId },
        { senderId: targetUserId, targetUserId: senderId },
      ],
    })
      .sort({ timestamp: -1 })
      .select('content senderId targetUserId timestamp type');

    if (!lastMessage) {
      return res.status(200).json({ message: 'Create a new conversation to engage with new connections.         ' });
    }

    return res.status(200).json({
      message: lastMessage.content,
      type:lastMessage.type,
    });
  } catch (err) {
   
    return res.status(500).json({ message: 'Internal server error' });
  }
});

msgRouter.get("/:userId/:targetUserId",  userAuth,async (req,res) => {
  const { userId, targetUserId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, targetUserId },
        { senderId: targetUserId, targetUserId: userId },
      ],
    })
      .sort({ timestamp: 1 }) 
      .lean();
    res.status(200).json({ data: messages });
  } catch (error) {
   
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});


module.exports = msgRouter;
