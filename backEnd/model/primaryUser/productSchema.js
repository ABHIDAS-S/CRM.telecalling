

import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  description: { type: String },

  selected: [],
  GSTIN: String
})

export default mongoose.model("Product", productSchema)
