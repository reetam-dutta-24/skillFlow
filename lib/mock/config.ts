/** Placeholder until the real pass mark is decided. 0.8 means 4 of 5. */
export const QUIZ_PASS_THRESHOLD = 0.8;

/** Pass this stage id to the quiz data function to review the generation-failure state. */
export const QUIZ_GENERATION_FAILURE_STAGE_ID = "__quiz_generation_failed__";

/** Pass this stage id to the explain-back page to review the writing step. The real stage still waits on the quiz. */
export const EXPLAIN_INPUT_PREVIEW_STAGE_ID = "__explain_input__";

/** Type this as the explanation or the follow-up to review the "could not review" state. */
export const EXPLAIN_REVIEW_FAILURE_TEXT = "review failed";

/** Include this phrase in the explanation to review the needs-improvement result. */
export const EXPLAIN_NEEDS_WORK_PHRASE = "stops the effect from looping";

/** Pass this URL to the bring-your-own-resource mock to review the unsupported-link error. */
export const BYOR_UNSUPPORTED_URL = "https://example.com/unsupported";

/** Shown on the upgrade screen. Not a real price. */
export const PREMIUM_PRICE_LABEL = "Placeholder";

/** Video resources use this id. Nothing is embedded until a person presses play. */
export const YOUTUBE_PLACEHOLDER_ID = "skillflow-placeholder";
