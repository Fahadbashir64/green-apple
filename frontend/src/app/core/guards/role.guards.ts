import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Menu, cart, and checkout are for customers only (not sub-admins). */
export const customerShopGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isSubAdmin()) {
    return router.createUrlTree(['/orders']);
  }
  return true;
};

/** Full admin dashboard and delivery areas (not sub-admins). */
export const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  if (!authService.isAdmin()) {
    return authService.isSubAdmin() ? router.createUrlTree(['/orders']) : router.createUrlTree(['/menu']);
  }
  return true;
};
