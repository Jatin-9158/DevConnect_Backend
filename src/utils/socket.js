const crypto = require("crypto");
const Message = require('../models/message');

const getSecretRoomId = (userId, targetUserId) => {
  if (!userId || !targetUserId) {
    throw new Error("userId and targetUserId are required");
  }
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:5173", 
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinChat", ({ userId, targetUserId }) => {
      try {
        if (!userId || !targetUserId) {
          socket.emit("error", { message: "Invalid user IDs" });
          return;
        }
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.join(roomId);
        console.log(`User ${userId} joined room: ${roomId}`);
      } catch (error) {
        console.error("Error joining room:", error.message);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });


    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, newMessage, type, timestamp }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
    
        const messageData = {
          senderId: userId,
          targetUserId,
          content: newMessage,
          type: type || "text",
          timestamp: timestamp || new Date().toISOString(),
          firstName,
          lastName,
        };
    
        const savedMessage = new Message(messageData);
        await savedMessage.save();
    
        console.log("Message saved to DB:", savedMessage);
    

        io.to(roomId).emit("receiveMessage", messageData);
    
      } catch (error) {
        console.error("Error sending message:", error.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });


    socket.on("typing", ({ targetUserId, userId }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.to(roomId).emit("typing", { userId });
      } catch (error) {
        console.error("Error handling typing event:", error.message);
      }
    });

    // Handle stop typing
    socket.on("stopTyping", ({ targetUserId, userId }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.to(roomId).emit("stopTyping", { userId });
      } catch (error) {
        console.error("Error handling stopTyping event:", error.message);
      }
    });


    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
  
    });

    // Handle socket errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  return io; // Return the io instance for potential further use
};

module.exports = initializeSocket;