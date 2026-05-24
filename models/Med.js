import mongoose from "mongoose";

const medSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  price: { type: Number },
  pharmacies: [String]
});

const Med = mongoose.model("Med", medSchema);

export default Med;
