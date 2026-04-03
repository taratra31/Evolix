import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import { LoginService } from '../../services/register/login/login.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon,RouterLink]
})
export class LoginPage {

  showCountries = false;

  phone = '';
  password = '';

  errorMessage = '';
  isLoading = false;

  selectedCountry = {
    name: 'Madagascar',
    dialCode: '+261',
    flag: 'https://flagcdn.com/w40/mg.png'
  };

  countries = [
    { name: 'Madagascar', dialCode: '+261', flag: 'https://flagcdn.com/w40/mg.png' },
    { name: 'DRC', dialCode: '+243', flag: 'https://flagcdn.com/w40/cd.png' },
    { name: 'France', dialCode: '+33', flag: 'https://flagcdn.com/w40/fr.png' },
    { name: 'USA', dialCode: '+1', flag: 'https://flagcdn.com/w40/us.png' }
  ];

  constructor(
    private loginService: LoginService,
    private router: Router
  ) {
    addIcons({ chevronDownOutline });
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

      case '+261':
        if (!/^3[2-8]\d{7}$/.test(phone)) {
          return 'Numéro Madagascar invalide';
        }
        break;

      case '+243':
        if (!/^9\d{8}$/.test(phone)) {
          return 'Numéro RDC invalide';
        }
        break;

      case '+33':
        if (!/^[67]\d{8}$/.test(phone)) {
          return 'Numéro France invalide';
        }
        break;

      case '+1':
        if (!/^\d{10}$/.test(phone)) {
          return 'Numéro USA invalide';
        }
        break;
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
      const user = await this.loginService.login({
        phone: this.phone,
        country_code: this.selectedCountry.dialCode,
        password: this.password
      });

      console.log('👉 USER RETOUR LOGIN:', user);

      // 🔥 VALIDATION
      if (!user) {
        throw 'Utilisateur introuvable';
      }

      if (!user.id) {
        throw 'ID utilisateur manquant';
      }

      // 🔥 SAVE LOCAL STORAGE
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userPhone', this.phone);

      console.log('👉 USER ID STORED:', localStorage.getItem('userId'));
      console.log('👉 USER PHONE STORED:', localStorage.getItem('userPhone'));
    
      // 🔥 NAVIGATION CORRECTE
      this.router.navigateByUrl('/tabs/compte');

    } catch (err: any) {
      console.error('LOGIN ERROR:', err);
      this.errorMessage = err;
    }

    this.isLoading = false;
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