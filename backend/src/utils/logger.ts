const LEVELS: Record<string, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = process.env.LOG_LEVEL ? LEVELS[process.env.LOG_LEVEL] ?? 2 : 2;

function formatMessage(level: string, message: any, meta?: any) {
  const payload: any = { level, message, meta, timestamp: new Date().toISOString() };
  return JSON.stringify(payload);
}

export default {
  error(message: any, meta?: any) {
    if (CURRENT_LEVEL >= LEVELS.error) console.error(formatMessage('error', message, meta));
  },
  warn(message: any, meta?: any) {
    if (CURRENT_LEVEL >= LEVELS.warn) console.warn(formatMessage('warn', message, meta));
  },
  info(message: any, meta?: any) {
    if (CURRENT_LEVEL >= LEVELS.info) console.log(formatMessage('info', message, meta));
  },
  debug(message: any, meta?: any) {
    if (CURRENT_LEVEL >= LEVELS.debug) console.log(formatMessage('debug', message, meta));
  }
};
