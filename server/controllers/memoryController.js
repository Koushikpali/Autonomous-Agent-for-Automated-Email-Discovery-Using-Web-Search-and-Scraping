// server/controllers/memoryController.js
import StateMemory from "../models/StateMemory.js";
import StepHistory from "../models/StepHistory.js";
import Metrics from "../models/Metrics.js";

// ===========================
// GET STATE MEMORY
// ===========================
export async function getStateMemory(req, res) {
  console.log("[MEMORY] getStateMemory called");
  const { run_id } = req.query;

  if (!run_id) {
    console.warn("[MEMORY] Missing run_id");
    return res.status(400).json({ ok: false, error: "run_id required" });
  }

  try {
    const doc = await StateMemory.findOne({ run_id });
    if (!doc) {
      console.warn("[MEMORY] No state found for run_id:", run_id);
      return res.status(404).json({ ok: false, error: "State not found" });
    }
    console.log(
      "[MEMORY] StateMemory result:",
      JSON.stringify(doc.toObject(), null, 2)
    );
    res.json({ ok: true, state: doc });
  } catch (err) {
    console.error("[MEMORY] Error fetching state:", err.message);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

// ===========================
// GET STEP HISTORY
// ===========================
export async function getStepHistory(req, res) {
  console.log("[MEMORY] getStepHistory called");
  const { run_id } = req.query;

  if (!run_id) {
    console.warn("[MEMORY] Missing run_id");
    return res.status(400).json({ ok: false, error: "run_id required" });
  }

  try {
    const docs = await StepHistory.find({ run_id }).sort({ step_id: 1 });
    console.log(`[MEMORY] Found ${docs.length} steps for run_id ${run_id}`);
    res.json({ ok: true, steps: docs });
  } catch (err) {
    console.error("[MEMORY] Error fetching steps:", err.message);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

// ===========================
// GET METRICS
// ===========================
export async function getMetrics(req, res) {
  console.log("[MEMORY] getMetrics called");
  const { run_id } = req.query;

  if (!run_id) {
    console.warn("[MEMORY] Missing run_id");
    return res.status(400).json({ ok: false, error: "run_id required" });
  }

  try {
    const doc = await Metrics.findOne({ run_id });
    if (!doc) {
      console.warn("[MEMORY] No metrics found for run_id:", run_id);
      return res.status(404).json({ ok: false, error: "Metrics not found" });
    }
    console.log(
      "[MEMORY] Metrics result:",
      JSON.stringify(doc.toObject(), null, 2)
    );
    res.json({ ok: true, metrics: doc });
  } catch (err) {
    console.error("[MEMORY] Error fetching metrics:", err.message);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
