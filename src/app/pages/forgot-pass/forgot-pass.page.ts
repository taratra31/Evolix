import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, ToastController, LoadingController } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronDownOutline, arrowBackOutline, eyeOutline, eyeOffOutline, reloadOutline, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { LoginService } from '../../services/register/login/login.service';

@Component({
  selector: 'app-forgot-pass',
  templateUrl: './forgot-pass.page.html',
  styleUrls: ['./forgot-pass.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterLink]
})
export class ForgotPassPage {

  showCountries = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Données du formulaire
  phone = '';
  newPassword = '';
  confirmPassword = '';

  // Afficher/masquer mot de passe
  showPassword = false;
  showConfirmPassword = false;

  // Pays sélectionné
  selectedCountry = {
    name: 'RDC',
    dialCode: '+243',
    flag: 'https://flagcdn.com/w40/cd.png'
  };

  // Liste des pays disponibles
  countries = [
    { name: 'Madagascar', dialCode: '+261', flag: 'https://flagcdn.com/w40/mg.png' },
    { name: 'RDC', dialCode: '+243', flag: 'https://flagcdn.com/w40/cd.png' },
    { name: 'France', dialCode: '+33', flag: 'https://flagcdn.com/w40/fr.png' },
    { name: 'USA', dialCode: '+1', flag: 'https://flagcdn.com/w40/us.png' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private loginService: LoginService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({ 
      chevronDownOutline, 
      arrowBackOutline, 
      eyeOutline, 
      eyeOffOutline, 
      reloadOutline,
      alertCircleOutline,
      checkmarkCircleOutline
    });
  }

  // Basculer l'affichage de la liste des pays
  toggleCountryList() {
    this.showCountries = !this.showCountries;
  }

  // Sélectionner un pays
  selectCountry(country: any) {
    this.selectedCountry = country;
    this.showCountries = false;
  }

  // Fermer la liste des pays
  closeCountryList() {
    if (this.showCountries) {
      this.showCountries = false;
    }
  }

  // Validation du numéro de téléphone
  validatePhone(): string | null {
    const phone = this.phone.replace(/\s+/g, '');

    if (!phone) {
      return 'Veuillez entrer votre numéro de téléphone';
    }

    switch (this.selectedCountry.dialCode) {
      case '+261': // Madagascar
        if (!/^[0-9]{9}$/.test(phone) || !phone.startsWith('3')) {
          return 'Numéro Madagascar invalide (ex: 321234567)';
        }
        break;

      case '+243': // RDC
        if (!/^[0-9]{9}$/.test(phone)) {
          return 'Numéro RDC invalide (9 chiffres, ex: 991234567)';
        }
        break;

      case '+33': // France
        if (!/^[0-9]{9}$/.test(phone) || !phone.startsWith('6') && !phone.startsWith('7')) {
          return 'Numéro France invalide (ex: 612345678)';
        }
        break;

      case '+1': // USA
        if (!/^[0-9]{10}$/.test(phone)) {
          return 'Numéro USA invalide (10 chiffres, ex: 2125551234)';
        }
        break;

      default:
        return 'Code pays non supporté';
    }

    return null;
  }

  // Validation du mot de passe
  validatePassword(): string | null {
    if (!this.newPassword) {
      return 'Veuillez entrer un nouveau code';
    }

    if (this.newPassword.length < 4) {
      return 'Le code doit contenir au moins 4 caractères';
    }

    if (this.newPassword !== this.confirmPassword) {
      return 'Les codes ne correspondent pas';
    }

    return null;
  }

  // Réinitialisation du mot de passe
  async resetPassword() {
    // Effacer les messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation du téléphone
    const phoneError = this.validatePhone();
    if (phoneError) {
      this.errorMessage = phoneError;
      await this.showToast(phoneError, 'danger');
      return;
    }

    // Validation du mot de passe
    const passwordError = this.validatePassword();
    if (passwordError) {
      this.errorMessage = passwordError;
      await this.showToast(passwordError, 'danger');
      return;
    }

    this.isLoading = true;

    const loading = await this.loadingCtrl.create({
      message: 'Réinitialisation en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Numéro complet avec indicatif
      const fullPhone = this.selectedCountry.dialCode + this.phone;
      
      console.log('🔍 Recherche utilisateur:', fullPhone);

      // 1. Vérifier si l'utilisateur existe
      const { data: user, error: userError } = await this.supabaseService.supabase
        .from('users')
        .select('id, phone')
        .eq('phone', fullPhone)
        .single();

      if (userError || !user) {
        throw new Error('Aucun compte trouvé avec ce numéro');
      }

      console.log('✅ Utilisateur trouvé:', user);

      // 2. Mettre à jour le mot de passe
      // Raha misy table `passwords` na `auth` dia atao any
      // Fa raha tsy misy, dia azo atao amin'ny table `users` mivantana
      const { error: updateError } = await this.supabaseService.supabase
        .from('users')
        .update({ password: this.newPassword }) // ⚠️ ATAO IZAY Raha tsy encrypted
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Erreur lors de la mise à jour du mot de passe');
      }

      console.log('✅ Mot de passe mis à jour');

      this.successMessage = '✅ Mot de passe réinitialisé avec succès !';
      await this.showToast(this.successMessage, 'success');

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Erreur reset password:', err);
      this.errorMessage = err.message || 'Une erreur est survenue';
      await this.showToast(this.errorMessage, 'danger');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  // Afficher un toast
  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close-circle-outline',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Redirection vers la page de connexion
  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}