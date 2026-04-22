import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import { SigninService } from '../../services/register/signin/signin.service';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon, RouterLink]
})
export class SigninPage implements OnInit {

  showCountries = false;

  phone = '';
  password = '';
  confirmPassword = '';
  referral = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  selectedCountry = {
     name: 'DRC', dialCode: '+243', flag: 'https://flagcdn.com/w40/cd.png' 
  };

  countries = [
    { name: 'Madagascar', dialCode: '+261', flag: 'https://flagcdn.com/w40/mg.png' },
    { name: 'DRC', dialCode: '+243', flag: 'https://flagcdn.com/w40/cd.png' },
    { name: 'France', dialCode: '+33', flag: 'https://flagcdn.com/w40/fr.png' },
    { name: 'USA', dialCode: '+1', flag: 'https://flagcdn.com/w40/us.png' }
  ];

  constructor(
    private signinService: SigninService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ chevronDownOutline });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      const ref = params['ref'];
      if (ref && ref !== 'null' && ref !== 'undefined') {
        this.referral = ref;
        this.presentToast(`Code parrain: ${ref}`, 'success');
      }
    });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
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

  async register() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.phone || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    const phoneError = this.validatePhone();
    if (phoneError) {
      this.errorMessage = phoneError;
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Mot de passe trop court.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;

    try {
      await this.signinService.register({
        phone: this.phone,
        country_code: this.selectedCountry.dialCode,
        password: this.password,
        referral_code: this.referral
      });

      this.successMessage = 'Inscription réussie 🎉';

      setTimeout(() => {
        this.router.navigate(['/tabs/acceuil']);
      }, 1500);

    } catch (err: any) {
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