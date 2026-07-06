const logger = {
  info(message, metadata) {
    console.log(format('info', message, metadata));
  },
  warn(message, metadata) {
    console.warn(format('warn', message, metadata));
  },
  error(message, metadata) {
    console.error(format('error', message, metadata));
  }
};

function format(level, message, metadata) {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString()
  };

  return JSON.stringify(metadata ? { ...base, metadata } : base);
}

export default logger;

