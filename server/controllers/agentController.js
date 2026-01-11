import { v4 as uuidv4 } from "uuid";

import StateMemory from "../models/StateMemory.js";
import StepHistory from "../models/StepHistory.js";
import Metrics from "../models/Metrics.js";

import OutcomeEnums from "../constants/outcomeEnums.js";
const Outcome = OutcomeEnums;

import settings from "../config/settings.json" with { type: "json" };

// policyGuard exports named functions; only perStepGuard is used here
import { perStepGuard } from "../middleware/policyGuard.js";

// llmService exposes named functions
import { planNextStep } from "../services/llmService.js";

// tools registry exports default
import tools from "../services/tools/index.js";

// observationService exposes named function
import { classifyObservation } from "../services/observationService.js";

// reflectionService exposes named functions
import { applyStateUpdate } from "../services/reflectionService.js";
import scrape from "../services/tools/scrape.js";

export async function runAgent(req, res) {
  console.log("[AGENT] Run initiated");
  const { goal, debugMode } = req.body;
  const run_id = `run-${uuidv4()}`;
  const maxSteps = debugMode ? 5 : settings.budgets.max_steps;

  let state = await StateMemory.create({
    run_id,
    known_urls: [],
    contact_methods: [],
    strategy: "email_first",
    budget_left: maxSteps,
  });

  let metrics = await Metrics.create({
    run_id,
    counters: {
      searches: 0,
      scrapes: 0,
      blocked: 0,
      duplicates: 0,
      useful_results: 0,
    },
    rates: { discovery_rate: 0, block_rate: 0, yield_rate: 0 },
  });

  let lastStepRecord = null;
  const stepsForResponse = [];

  for (let step = 1; step <= maxSteps; step++) {
    console.log("-------------------------------------------");
    console.log(`[AGENT] Step ${step}`);

 

    const decision = await planNextStep({
      goal,
      state: state.toObject(),
      lastStep: lastStepRecord,
    });

    // const guardRes = perStepGuard(decision.action, decision.target);
    // if (!guardRes.ok) {
    //   const blockedStep = await StepHistory.create({
    //     run_id,
    //     step_id: step,
    //     action: decision.action,
    //     target: decision.target,
    //     llm_reason: decision.strategy_note || "Blocked by guard",
    //     tool_result: { ok: false, error: guardRes.error },
    //     outcome_class: Outcome.BLOCKED,
    //     next_hint: "Adjust domain or strategy",
    //   });
    //   stepsForResponse.push(blockedStep.toObject());
    //   lastStepRecord = blockedStep.toObject();

    //   metrics.counters.blocked += 1;
    //   await metrics.save();

    //   state = await StateMemory.findOneAndUpdate(
    //     { run_id },
    //     {
    //       $set: {
    //         updated_at: new Date(),
    //         budget_left: Math.max(0, state.budget_left - 1),
    //       },
    //     },
    //     { new: true }
    //   );
    //   if (state.budget_left <= 0) break;
    //   continue;
    // }

    
    let tool = tools.getTool(decision.action);
  
    if (!tool) {
      console.error("[AGENT] No tool for action:", decision.action);
      break;
    }
    let envelope;
    try {  envelope = await tool(decision.target);
      
    } catch (error) {
      console.log(error)
    }

   
  if (!envelope) {
      console.error("[AGENT] no tool executed:", decision.target);
      break;
    }    

    const { outcome_class, observation } = await classifyObservation(envelope);

    const stepRecord = await StepHistory.create({
      run_id,
      step_id: step,
      action: decision.action,
      target: decision.target,
      llm_reason: decision.strategy_note,
      tool_result: envelope|| {},
      outcome_class,
      next_hint:
        outcome_class === Outcome.FORM_ONLY
          ? "Prefer forms"
          : outcome_class === Outcome.EMAIL_FOUND
          ? "Prioritize emails"
          : outcome_class === Outcome.BLOCKED
          ? "Cooldown/change domain"
          : "Broaden search/refine query",
    });
    stepsForResponse.push(stepRecord.toObject());
    lastStepRecord = stepRecord.toObject();

    // Metrics counters
    if (decision.action === "search") metrics.counters.searches += 1;
    if (decision.action === "scrape") metrics.counters.scrapes += 1;
    if (outcome_class === Outcome.BLOCKED) metrics.counters.blocked += 1;
    if (
      outcome_class === Outcome.EMAIL_FOUND ||
      outcome_class === Outcome.FORM_ONLY
    ) {
      metrics.counters.useful_results += 1;
    }

    // Metrics rates
    metrics.rates.discovery_rate =
      metrics.counters.searches > 0
        ? state.known_urls.length / metrics.counters.searches
        : 0;
    metrics.rates.block_rate =
      metrics.counters.scrapes > 0
        ? metrics.counters.blocked / metrics.counters.scrapes
        : 0;
    metrics.rates.yield_rate =
      metrics.counters.scrapes > 0
        ? metrics.counters.useful_results / metrics.counters.scrapes
        : 0;
    metrics.updated_at = new Date();
    await metrics.save();

    const nextState = await applyStateUpdate({
      state: state.toObject(),
      lastStep: lastStepRecord,
      observation,
    });

    state = await StateMemory.findOneAndUpdate(
      { run_id },
      { $set: nextState },
      { new: true }
    );
   
       // Deduplicate contacts
const uniqueContacts = Array.isArray(state.contact_methods)
  ? [...new Set(state.contact_methods)]
  : [];

// Stop if at least 1 email/contact method found
const sufficientContacts = uniqueContacts.length >= 2;

const highBlockRate =
  metrics.counters.scrapes >= 3 && metrics.rates.block_rate > 0.6;

const lowYield =
  metrics.counters.scrapes >= 3 && metrics.rates.yield_rate < 0.1;

// Allow termination check from the very first step
const hasProgress = step >= 1;

if (hasProgress && (highBlockRate || lowYield || sufficientContacts)) {
  console.log("[AGENT] Termination condition met");
  break;
}

  }

  return res.json({
    ok: true,
    run_id,
    goal,
    steps: stepsForResponse,
    state: state.toObject(),
    metrics: (await Metrics.findOne({ run_id })).toObject(),
  });
}
