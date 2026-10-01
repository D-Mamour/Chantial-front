/** Configuration utilisée par le build de production.
 * L'API est servie derrière le même domaine via un reverse proxy /api.
 * Aucun secret ne doit être placé dans le bundle Angular.
 */
export const API_URL = '/api';

/** Analytics désactivé par défaut. Renseigner le domaine seulement après déploiement. */
export const ANALYTICS = { enabled: false, domain: '', scriptUrl: 'https://plausible.io/js/script.js' } as const;
