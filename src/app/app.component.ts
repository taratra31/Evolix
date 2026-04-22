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
  private readonly INACTIVITY_TIME = 30 * 60 * 1000; // 30 minitra

  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.platform.ready().then(async () => {
      
      /* --- 🔥 FANAMBOARANA STATUS BAR (80px ambony) --- */
      try {
        // overlay: false -> ny app tsy hiditra ao anaty status bar
        await StatusBar.setOverlaysWebView({ overlay: false });
        
        // Ataovy maivana ny soratry ny StatusBar (ora, batterie, signal)
        await StatusBar.setStyle({ style: Style.Light });
        
        // Ataovy mainty ny lokon'ny status bar
        await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
        
        // 🔥 Manome padding 80px ho an'ny page rehetra
        document.documentElement.style.setProperty('--ion-safe-area-top', '80px');
        document.documentElement.style.setProperty('--status-bar-height', '80px');
        
        // Manampy CSS style ho an'ny status bar zone
        const style = document.createElement('style');
        style.textContent = `
          /* Status bar zone 80px */
          .status-bar-zone-pro {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: #0a0a0f;
            z-index: 10000;
            pointer-events: none;
          }
          
          .status-bar-zone-pro::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(243, 208, 120, 0.3), transparent);
          }
          
          /* Fanerena ny padding ho an'ny ion-content rehetra */
          ion-content {
            --padding-top: 80px !important;
            --offset-top: 80px !important;
          }
          
          ion-content .scroll-content {
            margin-top: 80px !important;
            padding-top: 0 !important;
          }
          
          ion-header {
            margin-top: 80px !important;
          }
          
          /* Ny animated background dia manomboka ambany 80px */
          .animated-bg {
            top: 80px !important;
            height: calc(100% - 80px) !important;
          }
        `;
        document.head.appendChild(style);
        
        // Mamorona ny status bar zone
        const statusBarZone = document.createElement('div');
        statusBarZone.className = 'status-bar-zone-pro';
        document.body.insertBefore(statusBarZone, document.body.firstChild);
        
        // Manery ny ion-content rehetra efa misy
        setTimeout(() => {
          const contents = document.querySelectorAll('ion-content');
          contents.forEach((content: HTMLElement) => {
            content.style.setProperty('--padding-top', '80px', 'important');
            content.style.setProperty('--offset-top', '80px', 'important');
          });
        }, 100);
        
        console.log('✅ StatusBar: 80px padding applied successfully');
      } catch (e) {
        console.log('⚠️ StatusBar non disponible sur web browser');
      }
      /* -------------------------------------------- */

      this.checkSession();
      this.initInactivityTimer();
      this.setupEventListeners();
    });
  }

  ngOnDestroy() {
    this.clearInactivityTimer();
    this.removeEventListeners();
    
    // Manala ny status bar zone
    const statusBarZone = document.querySelector('.status-bar-zone-pro');
    if (statusBarZone) {
      statusBarZone.remove();
    }
  }

  checkSession() {
    const userId = localStorage.getItem('userId');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    const rememberMe = localStorage.getItem('rememberMe');
    
    if (userId) {
      if (rememberMe === 'true') {
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

  initInactivityTimer() {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.logoutDueToInactivity();
    }, this.INACTIVITY_TIME);
  }

  resetInactivityTimer() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    this.initInactivityTimer();
  }

  logoutDueToInactivity() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      console.log('⏰ Inactivity detected - Auto logout');
      this.showToast('Session expirée pour inactivité', 'warning');
      this.clearSession();
      this.router.navigateByUrl('/login');
    }
  }

  setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', this.resetInactivityTimer.bind(this));
      window.addEventListener('touchstart', this.resetInactivityTimer.bind(this));
      window.addEventListener('scroll', this.resetInactivityTimer.bind(this));
      window.addEventListener('keypress', this.resetInactivityTimer.bind(this));
      window.addEventListener('mousemove', this.resetInactivityTimer.bind(this));
    }
  }

  removeEventListeners() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', this.resetInactivityTimer.bind(this));
      window.removeEventListener('touchstart', this.resetInactivityTimer.bind(this));
      window.removeEventListener('scroll', this.resetInactivityTimer.bind(this));
      window.removeEventListener('keypress', this.resetInactivityTimer.bind(this));
      window.removeEventListener('mousemove', this.resetInactivityTimer.bind(this));
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
    console.log(message);
  }
}