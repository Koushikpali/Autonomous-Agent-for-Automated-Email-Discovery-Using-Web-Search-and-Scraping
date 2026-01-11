// server/services/llmService.js
import settings from "../config/settings.json" with { type: "json" };

// Node v20+ has global fetch, so you don’t need node-fetch anymore
async function callOllama(prompt) {
  const res = await fetch(`${settings.ollama.host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: settings.ollama.model,
      prompt,
      stream: false,
    }),
  });
  const data = await res.json();
  return data.response;
}

export async function planNextStep({ goal, state, lastStep }) {
  console.log("[LLM][PLAN] Called");
  const ctx = {
    goal,
    last_step_outcome: lastStep ? lastStep.outcome_class : null,
    last_target: lastStep ? lastStep.target : null,
    current_strategy: state.strategy,
    budget_left: state.budget_left,
  };
const prompt = `
You are an autonomous planner in an agentic workflow. 
Your job is to decide the next step the agent should take.

⚠️ CRITICAL RULES:
- Respond ONLY with valid JSON. No text outside JSON.
- Keys must be exactly: "action", "target", "strategy_note".
- "action"  should be taken with after observing Laststep,State,Goal
- "target" should be finetuned LastStep.target
- "action" must be one of: "search", "scrape", "stop".
- "target" must be either a query string, a URL, or null.
- "strategy_note" must be a short sentence explaining why.

Context:
Goal: ${goal}
State: ${JSON.stringify(state)}
LastStep: ${JSON.stringify(lastStep)}

Return STRICT JSON like:
{"action":"search","target":"company careers page","strategy_note":"Need to discover contact forms"}
`;


  const raw = await callOllama(prompt);
  console.log("[LLM][PLAN] Raw:", raw);
  let decision;
  try {
    decision = JSON.parse(raw);
  } catch {
    decision = { action: "stop", target: null, strategy_note: "Parse error" };
  }
  console.log("[LLM][PLAN] Parsed:", JSON.stringify(decision));
  return decision;
}

export async function classifyObservationLLM({ toolEnvelope }) {
  console.log("[LLM][OBS] Called");
const prompt = `
You are the observation classifier. 
Your job is to analyze the tool envelope and classify the outcome.

⚠️ CRITICAL RULES:
- Respond ONLY with valid JSON. No text outside JSON.
- Keys must be exactly: "outcome_class", "observation".
- "outcome_class" must be one of: "EMAIL_FOUND", "FORM_ONLY", "BLOCKED", "NO_SIGNAL", "DUPLICATE".
- "observation" must be a concise JSON object with normalized signals.

Envelope:
${JSON.stringify(toolEnvelope)}

Guidelines:
- For search: usually "NO_SIGNAL"; if candidates exist, put them in observation.candidates = [{url,title,source}]
- For scrape: 
  - "BLOCKED" if blocked=true
  - "EMAIL_FOUND" if any emails found
  - "FORM_ONLY" if forms found but no emails
  - "NO_SIGNAL" otherwise
- Keep observation minimal and structured.

Return STRICT JSON like:
{
  "outcome_class": "EMAIL_FOUND",
  "observation": { "emails": ["hr@company.com"], "forms": [] }
}
`;


  const raw = await callOllama(prompt);
  console.log("[LLM][OBS] Raw:", raw);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { outcome_class: "NO_SIGNAL", observation: null };
  }
  console.log("[LLM][OBS] Parsed:", JSON.stringify(parsed));
  return parsed;
}

export async function reflectUpdateLLM({ state, lastStep, observation }) {
  console.log("[LLM][REFLECT] Called");
  const ctx = {
    last_step_outcome: lastStep ? lastStep.outcome_class : null,
    last_target: lastStep ? lastStep.target : null,
    current_strategy: state.strategy,
    budget_left: state.budget_left,
  };
 const prompt = `
You are the reflection module. 
Your job is to update the agent's state based on the last step and observation.

⚠️ CRITICAL RULES:
- Respond ONLY with valid JSON. No text outside JSON.
- Keys must be exactly: "state_update", "notes".
- "state_update" must contain ONLY: "known_urls", "contact_methods", "strategy".
- Do NOT update budget_left.
- "notes" must be a short sentence explaining why.

CurrentState:
${JSON.stringify(state)}

DiffContext:
${JSON.stringify(ctx)}

Observation:
${JSON.stringify(observation)}

Rules:
- known_urls: add only high-confidence URLs from observation.candidates.
- contact_methods: add emails or form endpoints only if present.
- strategy: update with a short keyword like "email_first", "prefer_forms", etc.
- Keep notes short and human-readable.

Return STRICT JSON like:
{
  "state_update": {
    "known_urls": ["https://company.com/contact"],
    "contact_methods": ["hr@company.com"],
    "strategy": "email_first"
  },
  "notes": "Added HR email from scrape"
}
`;


  const raw = await callOllama(prompt);
  console.log("[LLM][REFLECT] Raw:", raw);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      state_update: {
        known_urls: [],
        contact_methods: [],
        strategy: state.strategy,
      },
      notes: "Parse error",
    };
  }
  console.log("[LLM][REFLECT] Parsed:", JSON.stringify(parsed));
  return parsed;
}
