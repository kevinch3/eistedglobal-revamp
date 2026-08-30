/**
 * Domain types, aliased from the generated contract so this file and the Angular
 * app cannot drift apart again. Edit openapi.yaml, then `npm run contract:gen`.
 *
 * Import paths are unchanged, so route code needs no edits.
 */
import type { components } from './api.generated';

type S = components['schemas'];

/* Response shapes — what the API returns. The list variants are supersets of the
 * single-item ones (they carry extra JOIN-computed fields), so aliasing to the
 * widest form keeps every existing usage type-checking. */
export type Participant = S['Participant'];
export type Category = S['Category'];
export type Edition = S['Edition'];
export type Competition = S['Competition'];
export type Registration = S['RegistrationListItem'];
export type Work = S['WorkListItem'];
export type Upload = S['Upload'];

/* Request shapes — what callers may send. These differ from the response types:
 * server-generated ids, `registered_at`/`date`, and JOIN-computed fields such as
 * `category_name` are absent. Prefer these when typing a request body. */
export type ParticipantInput = S['ParticipantInput'];
export type CategoryInput = S['CategoryInput'];
export type EditionInput = S['EditionInput'];
export type CompetitionInput = S['CompetitionInput'];
export type CompetitionUpdate = S['CompetitionUpdate'];
export type RegistrationInput = S['RegistrationInput'];
export type WorkInput = S['WorkInput'];
export type WorkUpdate = S['WorkUpdate'];

/* Vocabularies enforced by SQL CHECK constraints. */
export type EntrantType = S['EntrantType'];
export type Placement = S['Placement'];
export type Language = S['Language'];

/* Auth */
export type LoginResponse = S['LoginResponse'];
export type JwtPayload = S['JwtPayload'];
export type ApiError = S['Error'];
