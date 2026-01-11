import mongoose from "mongoose";

const MetricsSchema = new mongoose.Schema(
  {
    run_id: { type: String, unique: true, index: true },

    counters: {
      searches: { type: Number, default: 0 },
      scrapes: { type: Number, default: 0 },
      blocked: { type: Number, default: 0 },
      duplicates: { type: Number, default: 0 },
      useful_results: { type: Number, default: 0 },
    },

    rates: {
      discovery_rate: { type: Number, default: 0 }, // urls per search
      block_rate: { type: Number, default: 0 }, // blocked / scrapes
      yield_rate: { type: Number, default: 0 }, // useful / scrapes
    },

    updated_at: { type: Date, default: Date.now },
  },
  { minimize: false }
);

export default mongoose.model("Metrics", MetricsSchema);
