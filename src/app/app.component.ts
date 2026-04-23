import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit, OnDestroy {
  
  private inactivityTimer: any;
  private readonly INACTIVITY_TIME = 30 * 60 * 1000; // 30 minitra

  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  async ngOnInit() {
    await this.platform.ready();
    
    // 🔥 Amboary ny StatusBar
    await this.setupStatusBar();
    
    // 🔥 Araho ny navigation hanovana style StatusBar
    this.trackNavigation();
    
    // 🔥 Jereo session
    this.checkSession();
    
    // 🔥 Atombohy ny inactivity timer
    this.initInactivityTimer();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.clearInactivityTimer();
    this.removeEventListeners();
  }

  // 🔥 Configuration StatusBar - TSY HIDITRA CONTENU
  async setupStatusBar() {
    try {
      // ZAVA-DEHIBE: Aza avela hi-overlay ny StatusBar
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      // Mametraha background color
      await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
      
      // Asehoy ny StatusBar
      await StatusBar.show();
    } catch (error) {
      console.warn('StatusBar not available on web:', error);
    }
  }

  // 🔥 Araho ny navigation
  trackNavigation() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateStatusBarStyle(event.url);
    });
  }

  // 🔥 Havaozy ny style StatusBar arakaraka ny page
  async updateStatusBarStyle(url: string) {
    try {
      // Pages misy background maizina - StatusBar texte mazava
      if (url.includes('/login') || url.includes('/forgot-pass')) {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#000000' });
      } 
      // Pages hafa - StatusBar texte maizina (na mazava arakaraka)
      else {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
      }
    } catch (error) {
      console.warn('Error updating StatusBar:', error);
    }
  }

  // 🔥 Jereo raha efa nisy session teo aloha
  checkSession() {
    const userId = localStorage.getItem('userId');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (userId) {
      if (rememberMe === 'true') {
        this.router.navigateByUrl('/tabs/acceuil');
      } else if (sessionExpiry) {
        const expiryDate = new Date(sessionExpiry);
        const now = new Date();
        
        if (expiryDate > now) {
          this.router.navigateByUrl('/tabs/acceuil');
        } else {
          this.clearSession();
          this.router.navigateByUrl('/login');
        }
      } else {
        this.router.navigateByUrl('/tabs/acceuil');
      }
    }
  }

  // 🔥 Manomboka timer ho an'ny inactivity
  initInactivityTimer() {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.logoutDueToInactivity();
    }, this.INACTIVITY_TIME);
  }

  // 🔥 Mamerina ny timer isaky ny misy hetsika
  resetInactivityTimer() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    this.initInactivityTimer();
  }

  // 🔥 Mivoaka noho ny tsy fahavitrihana
  logoutDueToInactivity() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      console.log('⏰ Inactivity detected - Auto logout');
      this.clearSession();
      this.router.navigateByUrl('/login');
    }
  }

  // 🔥 Manangana event listeners
  setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.resetInactivityTimer());
      window.addEventListener('touchstart', () => this.resetInactivityTimer());
      window.addEventListener('scroll', () => this.resetInactivityTimer());
      window.addEventListener('keypress', () => this.resetInactivityTimer());
      window.addEventListener('mousemove', () => this.resetInactivityTimer());
    }
  }

  // 🔥 Manala ny event listeners
  removeEventListeners() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', () => this.resetInactivityTimer());
      window.removeEventListener('touchstart', () => this.resetInactivityTimer());
      window.removeEventListener('scroll', () => this.resetInactivityTimer());
      window.removeEventListener('keypress', () => this.resetInactivityTimer());
      window.removeEventListener('mousemove', () => this.resetInactivityTimer());
    }
  }

  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  clearSession() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userVIP');
    localStorage.removeItem('userSolde');
    localStorage.removeItem('userReferralCode');
    localStorage.removeItem('userIsAdmin');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('rememberMe');
  }
}