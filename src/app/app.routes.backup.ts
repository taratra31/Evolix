import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  
  // ================================================
  // 🔥 ROUTES PUBLIQUES (Tsy mila authentification)
  // ================================================
  
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage),
    canActivate: [NoAuthGuard] // Raha efa connecté dia mandeha any amin'ny tabs
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [NoAuthGuard] // Tsy afaka miditra raha efa connecté
  },
  {
    path: 'signin',
    loadComponent: () => import('./pages/signin/signin.page').then(m => m.SigninPage),
    canActivate: [NoAuthGuard]
  },
  {
    path: 'forgot-pass',
    loadComponent: () => import('./pages/forgot-pass/forgot-pass.page').then(m => m.ForgotPassPage),
    canActivate: [NoAuthGuard]
  },

  // ================================================
  // 🔥 ROUTES PRINCIPALES (Mila authentification)
  // ================================================
  
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage),
    canActivate: [AuthGuard] // Mila connecté
  },

  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [AuthGuard], // Mila connecté
    children: [
      {
        path: '',
        redirectTo: 'acceuil',
        pathMatch: 'full',
      },
      {
        path: 'acceuil',
        loadComponent: () => import('./pages/acceuil/acceuil.page').then(m => m.AcceuilPage),
        title: 'Accueil - EVOLIX'
      },
      {
        path: 'tache',
        loadComponent: () => import('./pages/tache/tache.page').then(m => m.TachePage),
        title: 'Tâches - EVOLIX'
      },
      {
        path: 'equipe',
        loadComponent: () => import('./pages/equipe/equipe.page').then(m => m.EquipePage),
        title: 'Équipe - EVOLIX'
      },
      {
        path: 'compte',
        loadComponent: () => import('./pages/compte/compte.page').then(m => m.ComptePage),
        title: 'Mon Compte - EVOLIX'
      },
      {
        path: 'historique/:type',
        loadComponent: () => import('./pages/historique/historique.page').then(m => m.HistoriquePage),
        title: 'Historique - EVOLIX'
      },
    ],
  },
  
  // ================================================
  // 🔥 ROUTES ADMIN (Mila authentification + Admin)
  // ================================================
  
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard], // Mila connecté + Admin
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/admin/home/home.page').then(m => m.HomePage),
        title: 'Dashboard Admin - EVOLIX'
      },
      {
        path: 'transactions',
        loadComponent: () => import('./pages/admin/transactions/transactions.page').then(m => m.TransactionsPage),
        title: 'Transactions - Admin EVOLIX'
      },
      {
        path: 'utilisateur',
        loadComponent: () => import('./pages/admin/utilisateur/utilisateur.page').then(m => m.UtilisateurPage),
        title: 'Utilisateurs - Admin EVOLIX'
      },
      {
        path: 'publications',
        loadComponent: () => import('./pages/admin/publications/publications.page').then(m => m.PublicationsPage),
        title: 'Publications - Admin EVOLIX'
      },
      {
        path: 'number',
        loadComponent: () => import('./pages/admin/number/number.page').then(m => m.NumberPage),
        title: 'Numéros - Admin EVOLIX'
      },
    ]
  },
  
  // 🔥 ROUTES LEGACY - Redirection vers les nouvelles routes admin
  {
    path: 'home',
    redirectTo: 'admin/home',
    pathMatch: 'full'
  },
  {
    path: 'transactions',
    redirectTo: 'admin/transactions',
    pathMatch: 'full'
  },
  {
    path: 'utilisateur',
    redirectTo: 'admin/utilisateur',
    pathMatch: 'full'
  },
  {
    path: 'publications',
    redirectTo: 'admin/publications',
    pathMatch: 'full'
  },
  {
    path: 'number',
    redirectTo: 'admin/number',
    pathMatch: 'full'
  },

  // ================================================
  // 🔥 REDIRECT POUR LES ROUTES INCONNUES
  // ================================================
  
  {
    path: '**',
    redirectTo: 'splash'
  },
];