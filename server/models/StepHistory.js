import mongoose from "mongoose";
import OutcomeEnums from "../constants/outcomeEnums.js"; // note the .js extension

const Outcome = OutcomeEnums;

const StepHistorySchema = new mongoose.Schema(
  {
    run_id: { type: String, index: true },
    step_id: Number,
    action: String, // search | scrape | stop
    target: String,
    llm_reason: String,
    tool_result: Object,
    outcome_class: { type: String, enum: Object.values(Outcome) },
    next_hint: String,
    timestamp: { type: Date, default: Date.now },
  },
  { minimize: false }
);

StepHistorySchema.index({ run_id: 1, step_id: 1 }, { unique: true });

// ✅ Use ESM export instead of CommonJS
export default mongoose.model("StepHistory", StepHistorySchema);
