// server/utils/logger.js

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${args.join(" ")}`;
}

export function info(...args) {
  console.log(formatMessage("INFO", args));
}

export function warn(...args) {
  console.warn(formatMessage("WARN", args));
}

export function error(...args) {
  console.error(formatMessage("ERROR", args));
}

export function debug(...args) {
  if (process.env.DEBUG === "true") {
    console.debug(formatMessage("DEBUG", args));
  }
}
