import config from "../config";

const createLogger = (identifier: string) => {
  const debug = (msg: string, ...data: any[]) => {
    if (!config.DEBUG) return;
    console.debug(`[${identifier}] ${msg}`, ...data);
  };

  const log = (msg: string, ...data: any[]) => {
    console.log(`[${identifier}] ${msg}`, ...data);
  };

  return {
    debug,
    log,
  };
};

export default createLogger;
