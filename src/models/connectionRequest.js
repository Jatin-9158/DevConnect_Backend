const mongoose = require("mongoose");
const user = require("./user");

const connectionRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: user,
    required: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: user,
    required: true,
  },
  status: {
    type: String,
    enum: {
      values: ["ignored", "interested", "accepted", "rejected"],
      message: "{VALUE} is not a valid status",
    },
  },
}, {
  timestamps: true,
});

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

connectionRequestSchema.pre("save", async function () {
  if (this.fromUserId.equals(this.toUserId)) {
    throw new Error("Cannot send connection request to yourself");
  }
});

module.exports = mongoose.model("connectionRequest", connectionRequestSchema);
