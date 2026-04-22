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

  // 🔥 NOTIFICATIONS - Apetraka eo ivelan'ny tabs mba ho azonao idirana avy na aiza na aiza
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage)
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
        loadComponent: () => import('./pages/historique/historique.page').then(m => m.HistoriquePage)
      },
    ],
  },
  
  // 🔥 ADMIN ROUTES
  {
    path: 'home',
    loadComponent: () => import('./pages/admin/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'transactions',
    loadComponent: () => import('./pages/admin/transactions/transactions.page').then(m => m.TransactionsPage)
  },
  {
    path: 'utilisateur',
    loadComponent: () => import('./pages/admin/utilisateur/utilisateur.page').then(m => m.UtilisateurPage)
  },
  {
    path: 'publications',
    loadComponent: () => import('./pages/admin/publications/publications.page').then( m => m.PublicationsPage)
  },
    {
    path: 'number',
    loadComponent: () => import('./pages/admin/number/number.page').then( m => m.NumberPage)
  },

  // 🔥 Redirect any unknown path to splash
  {
    path: '**',
    redirectTo: 'splash'
  },

  
];