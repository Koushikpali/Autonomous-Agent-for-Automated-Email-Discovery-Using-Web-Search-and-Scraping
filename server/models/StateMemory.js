import mongoose from "mongoose";

const StateMemorySchema = new mongoose.Schema(
  {
    run_id: { type: String, unique: true },
    known_urls: [String],
    contact_methods: [String],
    strategy: String, // e.g., email_first | prefer_forms
    budget_left: Number,
    updated_at: { type: Date, default: Date.now },
  },
  { minimize: false }
);

export default mongoose.model("StateMemory", StateMemorySchema);
