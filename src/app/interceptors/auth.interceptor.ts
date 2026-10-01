import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Ajoute le JWT à chaque requête protégée.
 * Si l'access token a expiré, Angular tente une seule fois de le renouveler
 * avec le refresh token puis rejoue automatiquement la requête initiale.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      const estRouteRefresh = req.url.includes('/auth/rafraichir/');
      const refresh = sessionStorage.getItem('chantial_refresh');
      if (erreur.status !== 401 || estRouteRefresh || !refresh) return throwError(() => erreur);

      return auth.rafraichirToken().pipe(
        switchMap(() => {
          const nouveauToken = auth.token();
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${nouveauToken}` } }));
        }),
        catchError((refreshErreur) => {
          auth.deconnexion();
          return throwError(() => refreshErreur);
        }),
      );
    }),
  );
};
