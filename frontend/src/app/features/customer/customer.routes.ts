import { Routes } from '@angular/router';

export const customerRoutes: Routes = [
  {
    path: 'join',
    loadComponent: () => import('./join/customer-join.component').then(m => m.CustomerJoinComponent),
  },
  {
    path: 'status/:token',
    loadComponent: () => import('./status/queue-status.component').then(m => m.QueueStatusComponent),
  },
  { path: '', redirectTo: 'join', pathMatch: 'full' },
];
