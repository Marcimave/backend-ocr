import mongoose from "mongoose";

const medSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  price: Number,
  pharmacies: [String],
});

export default mongoose.model("Med", medSchema);
