import { COMMUNITY_DAILY_CAP, SERPAPI_HARD_CAP, TICKETMASTER_DAILY_CAP, serpApiMonthlyCap } from "@/lib/events/config";

/** True when another call still fits under the cap. `used` is the count already stored. */
export function allowsAnotherCall(used: number, limit: number): boolean {
  return used < limit;
}

export function ticketmasterAllows(usedToday: number): boolean {
  return allowsAnotherCall(usedToday, TICKETMASTER_DAILY_CAP);
}

export function serpApiAllows(usedThisMonth: number, rawCap?: string): boolean {
  return allowsAnotherCall(usedThisMonth, serpApiMonthlyCap(rawCap));
}

export function canSubmitAnother(submittedToday: number): boolean {
  return allowsAnotherCall(submittedToday, COMMUNITY_DAILY_CAP);
}

export { SERPAPI_HARD_CAP, TICKETMASTER_DAILY_CAP, COMMUNITY_DAILY_CAP };
