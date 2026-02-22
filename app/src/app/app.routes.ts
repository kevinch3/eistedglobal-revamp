import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'participants',
        loadComponent: () => import('./features/participants/participants.component').then((m) => m.ParticipantsComponent),
      },
      {
        path: 'competitions',
        loadComponent: () =>
          import('./features/competitions/competitions.component').then((m) => m.CompetitionsComponent),
      },
      {
        path: 'registrations',
        loadComponent: () =>
          import('./features/registrations/registrations.component').then((m) => m.RegistrationsComponent),
      },
      {
        path: 'works',
        loadComponent: () => import('./features/works/works.component').then((m) => m.WorksComponent),
      },
      {
        path: 'editions',
        loadComponent: () => import('./features/editions/editions.component').then((m) => m.EditionsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
