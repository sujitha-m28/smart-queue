import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/customer/join', pathMatch: 'full' },

  // Auth
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
  },

  // Customer (public)
  {
    path: 'customer',
    loadChildren: () => import('./features/customer/customer.routes').then(m => m.customerRoutes),
  },

  // Live Queue Display (public kiosk/TV)
  {
    path: 'display/:storeId',
    loadComponent: () => import('./features/queue-display/live-queue-display.component')
      .then(m => m.LiveQueueDisplayComponent),
  },

  // Staff
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STAFF', 'MANAGER', 'ADMIN'] },
    loadComponent: () => import('./features/staff/staff-dashboard.component')
      .then(m => m.StaffDashboardComponent),
  },

  // Manager
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MANAGER', 'ADMIN'] },
    loadChildren: () => import('./features/manager/manager.routes').then(m => m.managerRoutes),
  },

  // Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },

  { path: '**', redirectTo: '/customer/join' },
];
