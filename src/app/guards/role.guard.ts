import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
export const roleGuard =
  (roles: string[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.utilisateur()?.role;
    return role && roles.includes(role) ? true : router.createUrlTree(['/connexion']);
  };
