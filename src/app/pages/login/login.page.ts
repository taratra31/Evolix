import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import { LoginService } from '../../services/register/login/login.service';
import { SupabaseService } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterLink]
})
export class LoginPage {

  showCountries = false;
  phone = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  rememberMe: boolean = true;

  selectedCountry = {
    name: 'DRC',
    dialCode: '+243',
    flag: 'https://flagcdn.com/w40/cd.png'
  };

  countries = [
    { name: 'Madagascar', dialCode: '+261', flag: 'https://flagcdn.com/w40/mg.png' },
    { name: 'DRC', dialCode: '+243', flag: 'https://flagcdn.com/w40/cd.png' },
    { name: 'France', dialCode: '+33', flag: 'https://flagcdn.com/w40/fr.png' },
    { name: 'USA', dialCode: '+1', flag: 'https://flagcdn.com/w40/us.png' }
  ];

  constructor(
    private loginService: LoginService,
    private supabaseService: SupabaseService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ chevronDownOutline });
    this.checkExistingSession();
  }

  async checkExistingSession() {
    const userId = localStorage.getItem('userId');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    const rememberMeFlag = localStorage.getItem('rememberMe');
    
    if (userId && rememberMeFlag === 'true') {
      if (sessionExpiry) {
        const expiryDate = new Date(sessionExpiry);
        const now = new Date();
        
        if (expiryDate > now) {
          this.router.navigateByUrl('/tabs/acceuil');
          return;
        } else {
          this.clearSession();
        }
      } else {
        this.router.navigateByUrl('/tabs/acceuil');
      }
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

  goToForgotPassword() {
    this.router.navigateByUrl('/forgot-pass');
  }

  toggleCountryList() {
    this.showCountries = !this.showCountries;
  }

  selectCountry(country: any) {
    this.selectedCountry = country;
    this.showCountries = false;
  }

  validatePhone(): string | null {
    const phone = this.phone.replace(/\s+/g, '');

    switch (this.selectedCountry.dialCode) {
      case '+261': // Madagascar
        let cleanPhoneMG = phone.replace(/^0+/, '');
        if (!/^3[2-8]\d{7}$/.test(cleanPhoneMG)) {
          return 'Numéro Madagascar invalide (ex: 381234567)';
        }
        break;
      case '+243': // RDC
        if (!/^[8-9]\d{8}$/.test(phone)) {
          return 'Numéro RDC invalide (9 chiffres, commence par 8 ou 9)';
        }
        break;
      case '+33': // France
        if (!/^[67]\d{8}$/.test(phone)) {
          return 'Numéro France invalide (9 chiffres, commence par 6 ou 7)';
        }
        break;
      case '+1': // USA
        if (!/^\d{10}$/.test(phone)) {
          return 'Numéro USA invalide (10 chiffres)';
        }
        break;
      default:
        if (phone.length < 6 || phone.length > 15) {
          return 'Numéro invalide';
        }
    }
    return null;
  }

  async login() {
    this.errorMessage = '';

    if (!this.phone || !this.password) {
      this.errorMessage = 'Remplissez tous les champs';
      return;
    }

    const phoneError = this.validatePhone();
    if (phoneError) {
      this.errorMessage = phoneError;
      return;
    }

    this.isLoading = true;

    try {
      const fullPhone = this.selectedCountry.dialCode + this.phone;
      
      const { data: user, error } = await this.supabaseService.supabase
        .from('users')
        .select('id, phone, password, vip_level, solde, referral_code, is_admin')
        .eq('phone', fullPhone)
        .single();

      if (error || !user) {
        throw new Error('Numéro ou code incorrect');
      }

      if (user.password !== this.password) {
        throw new Error('Numéro ou code incorrect');
      }

      const finalSolde = user.solde || 0;

      localStorage.setItem('userId', user.id);
      localStorage.setItem('userPhone', user.phone);
      localStorage.setItem('userVIP', String(user.vip_level || 0));
      localStorage.setItem('userSolde', String(finalSolde));
      localStorage.setItem('userReferralCode', user.referral_code || '');
      localStorage.setItem('userIsAdmin', String(user.is_admin || false));
      localStorage.setItem('rememberMe', String(this.rememberMe));
      
      if (this.rememberMe) {
        localStorage.removeItem('sessionExpiry');
      } else {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        localStorage.setItem('sessionExpiry', expiryDate.toISOString());
      }

      this.router.navigateByUrl('/tabs/compte');

    } catch (err: any) {
      this.errorMessage = err.message || 'Erreur de connexion';
      this.showToast(this.errorMessage, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  scrollToInput() {
    setTimeout(() => {
      document.activeElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  }
}