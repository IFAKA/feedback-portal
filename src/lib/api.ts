import { z } from 'zod';

export function zodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}

export async function parseJson<T>(request: Request, schema: z.ZodSchema<T>): Promise<{ data: T } | { errors: ReturnType<typeof zodIssues> }> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { errors: zodIssues(parsed.error) };
  return { data: parsed.data };
}
