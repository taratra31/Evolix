import { Routes } from '@angular/router';

export const routes: Routes = [
  
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
  },
  
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'signin',
    loadComponent: () => import('./pages/signin/signin.page').then(m => m.SigninPage)
  },
  {
    path: 'forgot-pass',
    loadComponent: () => import('./pages/forgot-pass/forgot-pass.page').then(m => m.ForgotPassPage)
  },

  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: '',
        redirectTo: 'acceuil',
        pathMatch: 'full',
      },
      {
        path: 'acceuil',
        loadComponent: () => import('./pages/acceuil/acceuil.page').then(m => m.AcceuilPage)
      },
      {
        path: 'tache',
        loadComponent: () => import('./pages/tache/tache.page').then(m => m.TachePage)
      },
      {
        path: 'equipe',
        loadComponent: () => import('./pages/equipe/equipe.page').then(m => m.EquipePage)
      },
      {
        path: 'compte',
        loadComponent: () => import('./pages/compte/compte.page').then(m => m.ComptePage)
      },
       {
    path: 'historique/:type',
    loadComponent: () => import('./pages/historique/historique.page').then( m => m.HistoriquePage)
  },
    ],
  },
  
  {
    path: '**',
    redirectTo: 'splash'
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then( m => m.NotificationsPage)
  },
 

];