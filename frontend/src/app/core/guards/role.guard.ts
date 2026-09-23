import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRoles: string[] = route.data['roles'] ?? [];
  if (requiredRoles.length === 0) return true;

  const userRoles = auth.getRoles();
  const hasRole = requiredRoles.some(r => userRoles.includes(r));

  if (hasRole) return true;

  router.navigate(['/auth/login']);
  return false;
};
