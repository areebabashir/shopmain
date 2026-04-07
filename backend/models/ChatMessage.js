const mongoose = require("mongoose");

const chatProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, default: "", trim: true },
    product: { type: chatProductSchema, default: undefined },
  },
  { timestamps: true }
);

chatMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
