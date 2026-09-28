const LOAD_MS = 800;
const ACTION_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Loading delay for mock page data. Runs in development only, so production builds stay fast. */
export async function devDelay() {
  if (process.env.NODE_ENV === "development") await sleep(LOAD_MS);
}

/** Pending-state delay for mock server actions. Runs in development only. */
export async function devActionDelay() {
  if (process.env.NODE_ENV === "development") await sleep(ACTION_MS);
}
