import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';

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
  private readonly INACTIVITY_TIME = 30 * 60 * 1000; // 🔥 30 minitra (ovaina raha tiana)
  // 5 * 60 * 1000 = 5 minitra
  // 10 * 60 * 1000 = 10 minitra
  // 30 * 60 * 1000 = 30 minitra
  // 60 * 60 * 1000 = 1 ora

  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.platform.ready().then(async () => { // Nampiana async eto
      
      /* --- FANAMBOARANA STATUS BAR --- */
      try {
        // Ataovy fotsy ny soratry ny StatusBar (ora, batterie) satria mainty ny app
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Ity no tena zava-dehibe: 
        // overlay: false midika hoe "manome toerana" ny StatusBar ka midina kely ny app-nao
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        // Raha tiana ho mainty tanteraka ny lokon'ny bar any ambony
        await StatusBar.setBackgroundColor({ color: '#000000' });
      } catch (e) {
        console.log('StatusBar non disponible sur web browser');
      }
      /* ------------------------------- */

      this.checkSession();
      this.initInactivityTimer();
      this.setupEventListeners();
    });
  }

  ngOnDestroy() {
    this.clearInactivityTimer();
    this.removeEventListeners();
  }

  // 🔥 Jereo raha efa nisy session teo aloha
  checkSession() {
    const userId = localStorage.getItem('userId');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (userId) {
      if (rememberMe === 'true') {
        // Session mandrakizay
        this.router.navigateByUrl('/tabs/compte');
      } else if (sessionExpiry) {
        const expiryDate = new Date(sessionExpiry);
        const now = new Date();
        
        if (expiryDate > now) {
          this.router.navigateByUrl('/tabs/compte');
        } else {
          this.clearSession();
          this.router.navigateByUrl('/login');
        }
      } else {
        this.router.navigateByUrl('/tabs/compte');
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
    // Raha tsy mbola login ny utilisateur, aza manao timer
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    this.initInactivityTimer();
  }

  // 🔥 Mivoaka noho ny tsy fahavitrihana
  logoutDueToInactivity() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      console.log('⏰ Inactivity detected - Auto logout');
      this.showToast('Session expirée pour inactivité', 'warning');
      this.clearSession();
      this.router.navigateByUrl('/login');
    }
  }

  // 🔥 Manangana event listeners (click, touch, scroll, keypress)
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

  async showToast(message: string, color: string) {
    // Ampidiro ny ToastController raha tiana
    console.log(message);
  }
}