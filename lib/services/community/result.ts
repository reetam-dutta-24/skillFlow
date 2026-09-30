export type ServiceFail = { ok: false; error: string; field?: string };

export function fail(error: string, field?: string): ServiceFail {
  return field ? { ok: false, error, field } : { ok: false, error };
}
