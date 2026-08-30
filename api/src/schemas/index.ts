import { z } from 'zod';

/**
 * Request-body schemas — the API's validation, in one place.
 *
 * Before these existed, required fields were checked ad hoc in POST handlers
 * and not at all in PUT handlers, and the value vocabularies (`type`,
 * `language`, `placement`) were enforced only by SQL CHECK constraints. So a
 * bad enum was a database error surfacing as a 500 rather than a 400 naming
 * the field, and a PUT could null out a NOT NULL column.
 *
 * The vocabularies below must match `config/schema.sql`. They are duplicated
 * deliberately: SQL is the last line of defence and stays authoritative, while
 * these give the caller a useful message instead of a constraint failure.
 */

export const ENTRANT_TYPES = ['IND', 'GRU'] as const;

export const LANGUAGES = [
  'Cymraeg', 'Castellano', 'English', 'Aleman', 'Polaco',
  'Frances', 'Portugues', 'Italiano', 'Otro',
] as const;

export const PLACEMENTS = ['1', '2', '3', 'mencion'] as const;

/** Optional, nullable, and absent-means-null — the shape most columns have. */
const nullableString = z.string().nullish().transform(v => v ?? null);

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const categoryInputSchema = z.object({
  name: z.string().min(1),
  name_welsh: nullableString,
});

export const editionCreateSchema = z.object({
  year: z.number().int(),
});

export const editionInputSchema = z.object({
  committee: nullableString,
  committee_img: nullableString,
  presenters: nullableString,
  presenters_img: nullableString,
});

export const uploadInputSchema = z.object({
  filename: z.string().min(1),
  description: nullableString,
});

const competitionFields = {
  category_id: z.number().int(),
  type: z.enum(ENTRANT_TYPES),
  description: nullableString,
  language: z.enum(LANGUAGES).nullish().transform(v => v ?? null),
  extra_text: nullableString,
  rank: z.number().int().default(0),
  preliminary: nullableString,
};

export const competitionCreateSchema = z.object({
  id: z.string().min(1),
  year: z.number().int(),
  ...competitionFields,
});

/** `id` and `year` are immutable, so they are simply not accepted here. */
export const competitionUpdateSchema = z.object(competitionFields);

const participantFields = {
  name: z.string().min(1),
  type: z.enum(ENTRANT_TYPES),
  surname: nullableString,
  document_id: nullableString,
  birth_date: nullableString,
  nationality: nullableString,
  residence: nullableString,
  email: nullableString,
  phone: nullableString,
  /** Accepts boolean, number or string; the route normalizes it to 0|1. */
  active: z.union([z.boolean(), z.number(), z.string()]).optional(),
};

export const participantInputSchema = z.object(participantFields);

export const registrationCreateSchema = z.object({
  participant_id: z.number().int(),
  competition_id: z.string().min(1),
  year: z.number().int(),
  pseudonym: nullableString,
});

export const registrationUpdateSchema = z.object({
  competition_id: z.string().min(1),
  pseudonym: nullableString,
});

const workFields = {
  title: z.string().min(1),
  display_name: nullableString,
  placement: z.enum(PLACEMENTS).nullish().transform(v => v ?? null),
  video_url: nullableString,
  photo_url: nullableString,
};

export const workCreateSchema = z.object({
  participant_id: z.number().int(),
  competition_id: z.string().min(1),
  ...workFields,
});

/** `participant_id`, `competition_id` and `date` are not updatable. */
export const workUpdateSchema = z.object(workFields);
