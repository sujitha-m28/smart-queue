import { Routes } from '@angular/router';

export const managerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./manager-dashboard.component').then(m => m.ManagerDashboardComponent),
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent),
  },
  {
    path: 'ai',
    loadComponent: () => import('./ai/manager-ai.component').then(m => m.ManagerAiComponent),
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/manager-reports.component').then(m => m.ManagerReportsComponent),
  },
];
