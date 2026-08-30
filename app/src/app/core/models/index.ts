/**
 * API models, aliased from the generated contract (api/openapi.yaml) so this file
 * and the API's own types cannot drift apart again — they previously disagreed on
 * `Category.id`, silently.
 *
 * Regenerate from the api/ folder: `npm run contract:gen`.
 * Import paths are unchanged, so components and services need no edits.
 */
import type { components } from './api.generated';

type S = components['schemas'];

/* Response shapes. List variants are supersets of single-item ones (extra
 * JOIN-computed fields), so aliasing to the widest form keeps existing usage
 * compiling — see the A8 quirk in openapi.yaml. */
export type Participant = S['Participant'];
export type Category = S['Category'];
export type Edition = S['Edition'];
export type Competition = S['Competition'];
export type Registration = S['RegistrationListItem'];
export type Work = S['WorkListItem'];
export type Upload = S['Upload'];

/* Request shapes — server-generated and JOIN-computed fields are absent. */
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
export type ApiError = S['Error'];
