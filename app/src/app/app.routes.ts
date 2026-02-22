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
        path: 'personas',
        loadComponent: () => import('./features/personas/personas.component').then((m) => m.PersonasComponent),
      },
      {
        path: 'competencias',
        loadComponent: () =>
          import('./features/competencias/competencias.component').then((m) => m.CompetenciasComponent),
      },
      {
        path: 'inscripciones',
        loadComponent: () =>
          import('./features/inscripciones/inscripciones.component').then((m) => m.InscripcionesComponent),
      },
      {
        path: 'obras',
        loadComponent: () => import('./features/obras/obras.component').then((m) => m.ObrasComponent),
      },
      {
        path: 'anios',
        loadComponent: () => import('./features/anios/anios.component').then((m) => m.AniosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
