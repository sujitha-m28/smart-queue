import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'stores',
    loadComponent: () => import('./stores/store-management.component').then(m => m.StoreManagementComponent),
  },
  {
    path: 'rooms',
    loadComponent: () => import('./rooms/room-management.component').then(m => m.RoomManagementComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-management.component').then(m => m.UserManagementComponent),
  },
];
