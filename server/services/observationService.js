// server/services/observationService.js
import OutcomeEnums from "../constants/outcomeEnums.js";
import * as llm from "./llmService.js";

const VALID = new Set(Object.values(OutcomeEnums));

export async function classifyObservation(toolEnvelope) {
  const result = await llm.classifyObservationLLM({ toolEnvelope });
  let { outcome_class, observation } = result || {};

  if (!VALID.has(outcome_class)) {
    console.warn(
      "[OBS] Invalid outcome_class from LLM, defaulting NO_SIGNAL:",
      outcome_class
    );
    outcome_class = OutcomeEnums.NO_SIGNAL;
  }

  // Minimal normalization guarantees
  if (toolEnvelope.tool === "search") {
    const candidates = Array.isArray(toolEnvelope.data)
      ? toolEnvelope.data
      : [];
    observation =
      observation && observation.candidates ? observation : { candidates };
  }

  return { outcome_class, observation };
}
