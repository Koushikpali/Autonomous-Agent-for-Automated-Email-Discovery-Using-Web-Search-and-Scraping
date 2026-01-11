import policies from "../config/policies.json" with { type: "json" };

function domainAllowed(targetUrl) {
  try {
    const host = new URL(targetUrl).hostname;
    if (policies.domain_deny.includes(host)) {
      return { allowed: false, reason: `Domain denied: ${host}` };
    }
    if (
      policies.domain_allow.length > 0 &&
      !policies.domain_allow.includes(host)
    ) {
      return { allowed: false, reason: `Domain not in allow list: ${host}` };
    }
    return { allowed: true, reason: "Domain allowed" };
  } catch (e) {
    return { allowed: false, reason: "Invalid URL format" };
  }
}

export function preRunGuard(req, res, next) {
  console.log("[GUARD] Pre-run guard");
  const { goal } = req.body;
  if (!goal || typeof goal !== "string" || !goal.trim()) {
    console.warn("[GUARD] Invalid goal");
    return res.status(400).json({ ok: false, error: "Invalid goal" });
  }
  next();
}

export function perStepGuard(action, target) {
  console.log("[GUARD] Per-step guard:", { action, target });
  if (action === "scrape" && target) {
    const check = domainAllowed(target);
    if (!check.allowed) return { ok: false, error: check.reason };
  }
  // if (policies.respect_robots) {
  //   console.log("[GUARD] Robots policy respected (placeholder)");
  // }
  
  return { ok: true };
}
