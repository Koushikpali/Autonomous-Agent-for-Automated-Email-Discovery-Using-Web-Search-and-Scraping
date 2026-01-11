// server/services/reflectionService.js
import { reflectUpdateLLM } from "./llmService.js";

function arrayUniqueMerge(prev = [], next = []) {
  return Array.from(new Set([...(prev || []), ...(next || [])]));
}

export function buildDiffContext({ state, lastStep }) {
  // This is now used inside llmService; kept for completeness/logging if needed
  return {
    last_step_outcome: lastStep ? lastStep.outcome_class : null,
    last_target: lastStep ? lastStep.target : null,
    current_strategy: state.strategy,
    budget_left: state.budget_left,
  };
}

export async function applyStateUpdate({ state, lastStep, observation }) {
  const { state_update, notes } = await reflectUpdateLLM({
    state,
    lastStep,
    observation,
  });
  console.log(
    "[REFLECT] LLM suggested update:",
    JSON.stringify({ state_update, notes })
  );

  const next = { ...state };

  // Safe merges
  if (state_update) {
    if (Array.isArray(state_update.known_urls)) {
      next.known_urls = arrayUniqueMerge(
        next.known_urls,
        state_update.known_urls
      );
    }
    if (Array.isArray(state_update.contact_methods)) {
      next.contact_methods = arrayUniqueMerge(
        next.contact_methods,
        state_update.contact_methods
      );
    }
    if (
      typeof state_update.strategy === "string" &&
      state_update.strategy.length <= 50
    ) {
      next.strategy = state_update.strategy;
    }
  }

  // Server-enforced budget decrement (LLM must not control this)
  next.budget_left = Math.max(0, (next.budget_left || 0) - 1);
  next.updated_at = new Date();

  console.log("[REFLECT] Applied state:", JSON.stringify(next));
  return next;
}
