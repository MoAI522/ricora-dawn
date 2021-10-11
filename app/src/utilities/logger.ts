import config from "../config";

const createLogger = (identifier: string, disable: boolean = false) => {
  const debug = (msg: string, ...data: any[]) => {
    if (!config.DEBUG || disable) return;
    console.debug(`[${identifier}] ${msg}`, ...data);
  };

  const log = (msg: string, ...data: any[]) => {
    if (disable) return;
    console.log(`[${identifier}] ${msg}`, ...data);
  };

  return {
    debug,
    log,
  };
};

export default createLogger;
