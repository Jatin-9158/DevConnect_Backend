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
      origin: "http://13.60.96.174", 
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {


    socket.on("joinChat", ({ userId, targetUserId }) => {
      try {
        if (!userId || !targetUserId) {
          socket.emit("error", { message: "Invalid user IDs" });
          return;
        }
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.join(roomId);
    
      } catch (error) {
     
        socket.emit("error", { message: "Failed to join chat" });
      }
    });


    socket.on("sendMessage", async ({ firstName, lastName, userId, targetUserId, newMessage, type, timestamp }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
        
        // Check if message type is image
        if (type === "image" && newMessage) {
          // Assuming newMessage is the image URL
          const messageData = {
            senderId: userId,
            targetUserId,
            content: newMessage,  // URL of the image
            type: "image",
            timestamp: timestamp || new Date().toISOString(),
            firstName,
            lastName,
          };
    
          // Save the message (if necessary, depending on your schema)
          const savedMessage = new Message(messageData);
          await savedMessage.save();
    
          // Emit the message with both content and URL
          io.to(roomId).emit("receiveMessage", messageData);
        } else {
          const messageData = {
            senderId: userId,
            targetUserId,
            content: newMessage,  // Regular text message content
            type: type || "text",
            timestamp: timestamp || new Date().toISOString(),
            firstName,
            lastName,
          };
    
          // Save and emit the text message
          const savedMessage = new Message(messageData);
          await savedMessage.save();
          io.to(roomId).emit("receiveMessage", messageData);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        socket.emit("error", { message: "Failed to send message", error: error.message });
      }
    });
    


    socket.on("typing", ({ targetUserId, userId }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.to(roomId).emit("typing", { userId });
   
      } catch (error) {

      }
    });

    // Handle stop typing
    socket.on("stopTyping", ({ targetUserId, userId }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);
        socket.to(roomId).emit("stopTyping", { userId });
      } catch (error) {
     
      }
    });


    socket.on("disconnect", () => {
    
  
    });

    // Handle socket errors
    socket.on("error", (error) => {
      
    });
  });

  return io; // Return the io instance for potential further use
};

module.exports = initializeSocket;