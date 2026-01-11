


const OutcomeEnums = {
  EMAIL_FOUND: "EMAIL_FOUND",   // scrape found one or more valid email addresses
  FORM_ONLY: "FORM_ONLY",       // scrape found forms but no emails
  BLOCKED: "BLOCKED",           // access blocked (robots.txt, 403, etc.)
  NO_SIGNAL: "NO_SIGNAL",       // no useful information found
  DUPLICATE: "DUPLICATE",       // duplicate URL or repeated attempt
};

export default OutcomeEnums;
