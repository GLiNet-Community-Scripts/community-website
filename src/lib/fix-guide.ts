/*
 * The guide of a community fix (content/fixes/<advisory>.yaml), loaded and checked at
 * build time like the rest of the content.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';

const T = z.string().min(1);
const Link = z.union([z.string().regex(/^\/[a-z0-9/-]*$/), z.string().url().refine((u) => u.startsWith('https://'), 'links must use https://')]);

const FixGuideSchema = z.object({
  intro: T,
  hero_note: T,
  hero_link: z.object({ label: T, url: Link }).optional(),
  steps: z.array(z.object({ title: T, text: T, command: T })).min(1),
  run_note: T.optional(),
  notes: z.array(z.object({ title: T, text: T })).default([]),
  result: z.object({
    address: T,
    text: z.array(T).min(1),
    verdicts: z.array(z.object({ verdict: T, tone: z.enum(['bad', 'warn', 'ok']), text: T, then: T })).min(1),
    labels_title: T,
    labels: z.array(z.object({ label: T, meaning: T, fix: T })).min(1),
    exit_codes: T,
  }),
  update: z.object({ lead: T, command: T, note: T }),
  looks_for: z.array(z.object({ title: T, items: z.array(T).min(1) })).min(1),
  report: z.object({ lead: T, sent: z.array(T).min(1), never: z.array(T).min(1), controls: z.array(z.object({ key: T, text: T })).default([]) }),
  afterwards: z.array(z.object({ audience: T, items: z.array(T).min(1) })).min(1),
  more: z.array(z.object({ title: T, text: T, url: Link })).default([]),
  report_problem: z.object({ label: T, text: T, url: Link }).optional(),
  ai_note: T.optional(),
});

export type FixGuide = z.infer<typeof FixGuideSchema>;

export function loadFixGuide(slug: string): FixGuide {
  const file = `content/fixes/${slug}.yaml`;
  const result = FixGuideSchema.safeParse(YAML.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8')));
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Invalid content in ${file}:\n${issues}`);
  }
  return result.data;
}
