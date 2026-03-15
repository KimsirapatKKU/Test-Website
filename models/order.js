const mongoose = require("mongoose");


const orderSchema = new mongoose.Schema({
  table: Number,
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      note: String
    }
  ],
  status: {
    type: String,
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", orderSchema)
module.exports = Order