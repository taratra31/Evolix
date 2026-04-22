import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, IonContent, IonIcon, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { 
  copyOutline, checkmarkCircleOutline, cashOutline, alertCircleOutline,
  closeOutline, addCircle, arrowDownCircle, phonePortraitOutline,
  informationCircleOutline, flashOutline, documentTextOutline, callOutline,
  sendOutline, shieldCheckmarkOutline, checkmarkCircle, arrowUpOutline,
  diamondOutline, warningOutline, timeOutline, peopleOutline, giftOutline,
  trendingUpOutline, walletOutline, arrowForwardOutline, checkmarkDoneOutline
} from 'ionicons/icons';

import { TransactionService } from '../services/transactions/transaction.service';
import { AdminService } from '../services/admin/admin.service';
import { SupabaseService } from '../services/supabase/supabase.service';

// Configuration VIP basée sur le niveau
const VIP_CONFIG: Record<number, { min: number; max: number; name: string }> = {
  1: { min: 5000, max: 15000, name: 'VIP 1' },
  2: { min: 5000, max: 63000, name: 'VIP 2' },
  3: { min: 5000, max: 121000, name: 'VIP 3' },
  4: { min: 5000, max: 441000, name: 'VIP 4' },
  5: { min: 5000, max: 630000, name: 'VIP 5' },
  6: { min: 5000, max: 966000, name: 'VIP 6' },
};

@Component({
  selector: 'app-transaction-modal',
  templateUrl: './transaction-modal.component.html',
  styleUrls: ['./transaction-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class TransactionModalComponent implements OnInit {
  @Input() type: 'depot' | 'retrait' = 'depot';
  @Input() currentSolde: number = 0;
  
  // 🔥 Tsy ilaina intsony ny @Input userVipLevel fa maka avy amin'ny base de données
  userVipLevel: number = 1;
  userVipName: string = 'VIP 1';
  userId: string = '';

  operateur: string = '';
  montant: number | null = null;
  transactionId: string = '';
  userPhone: string = '';
  
  numeros: Record<string, string> = {
    orange: '',
    airtel: '',
    vodacom: ''
  };
  
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  
  // Erreurs
  montantError: string = '';
  transactionIdError: string = '';
  phoneError: string = '';
  globalError: string = '';

  operators = [
    { value: 'orange', name: 'Orange', logo: 'https://cdn.worldvectorlogo.com/logos/orange-1.svg' },
    { value: 'airtel', name: 'Airtel', logo: 'https://cdn.worldvectorlogo.com/logos/airtel.svg' },
    { value: 'vodacom', name: 'Vodacom', logo: 'https://cdn.worldvectorlogo.com/logos/vodacom.svg' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private transactionService: TransactionService,
    private adminService: AdminService,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      copyOutline, checkmarkCircleOutline, cashOutline, alertCircleOutline,
      closeOutline, addCircle, arrowDownCircle, phonePortraitOutline,
      informationCircleOutline, flashOutline, documentTextOutline, callOutline,
      sendOutline, shieldCheckmarkOutline, checkmarkCircle, arrowUpOutline,
      diamondOutline, warningOutline, timeOutline, peopleOutline, giftOutline,
      trendingUpOutline, walletOutline, arrowForwardOutline, checkmarkDoneOutline
    });
  }

  async ngOnInit() {
    await this.loadUserData();
    await this.loadNumbersFromDatabase();
  }

  // 🔥 Maka ny données utilisateur (solde, vip level)
  async loadUserData() {
    try {
      const userId = localStorage.getItem('userId') || '';
      if (!userId) {
        this.showToast('Utilisateur non connecté', 'danger');
        return;
      }
      
      this.userId = userId;
      
      const { data: user, error } = await this.supabaseService.supabase
        .from('users')
        .select('vip_level, solde')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (user) {
        this.userVipLevel = user.vip_level || 1;
        this.userVipName = `VIP ${this.userVipLevel}`;
        if (!this.currentSolde) {
          this.currentSolde = user.solde || 0;
        }
      }
      
    } catch (error) {
      console.error('Erreur chargement user:', error);
      // Valeurs par défaut
      this.userVipLevel = 1;
      this.userVipName = 'VIP 1';
    }
  }

  async loadNumbersFromDatabase() {
    try {
      this.isLoading = true;
      const numbers = await this.adminService.getAllCollectNumbers();
      
      numbers.forEach((num: any) => {
        if (num.operator === 'orange' && num.is_active) {
          this.numeros['orange'] = num.phone_number;
        } else if (num.operator === 'airtel' && num.is_active) {
          this.numeros['airtel'] = num.phone_number;
        } else if (num.operator === 'vodacom' && num.is_active) {
          this.numeros['vodacom'] = num.phone_number;
        }
      });
      
      if (!this.numeros['orange'] && !this.numeros['airtel'] && !this.numeros['vodacom']) {
        this.setDefaultNumbers();
      }
      
    } catch (error) {
      this.setDefaultNumbers();
      this.showToast('Erreur de chargement des numéros', 'warning');
    } finally {
      this.isLoading = false;
    }
  }

  setDefaultNumbers() {
    this.numeros = {
      orange: '0854267738',
      airtel: '0974507734',
      vodacom: '0822443493'
    };
  }

  selectOperateur(op: string) { 
    this.operateur = op;
    this.clearErrors();
  }
  
  getNumero(op: string): string { 
    return this.numeros[op] || 'Non configuré'; 
  }

  async copyNumber() {
    const num = this.getNumero(this.operateur);
    if (num && num !== 'Non configuré') {
      await navigator.clipboard.writeText(num);
      this.showToast('📋 Numéro copié avec succès !', 'success');
    } else {
      this.showToast('❌ Aucun numéro disponible', 'danger');
    }
  }

  close() { 
    this.modalCtrl.dismiss(); 
  }

  // 🔥 Maka limites selon le niveau VIP
  getVipLimits() {
    return VIP_CONFIG[this.userVipLevel] || { min: 5000, max: 15000, name: 'VIP 1' };
  }

  getVipLevelNumber(): number {
    return this.userVipLevel || 1;
  }

  getVipColorClass(): string {
    const level = this.userVipLevel;
    if (level === 1) return 'vip-1';
    if (level === 2) return 'vip-2';
    if (level === 3) return 'vip-3';
    if (level === 4) return 'vip-4';
    if (level >= 5) return 'vip-5';
    return 'vip-1';
  }

  validateMontant() {
    this.montantError = '';
    
    if (!this.montant || this.montant <= 0) {
      this.montantError = 'Veuillez entrer un montant valide';
      return false;
    }
    
    if (this.type === 'depot') {
      if (this.montant < 1000) {
        this.montantError = 'Le montant minimum de dépôt est de 1 000 CDF';
        return false;
      }
    } else {
      const limits = this.getVipLimits();
      if (this.montant < limits.min) {
        this.montantError = `Le montant minimum de retrait pour ${limits.name} est de ${limits.min.toLocaleString()} CDF`;
        return false;
      }
      if (this.montant > limits.max) {
        this.montantError = `Le montant maximum pour ${limits.name} est de ${limits.max.toLocaleString()} CDF`;
        return false;
      }
      if (this.currentSolde && this.montant > this.currentSolde) {
        this.montantError = `Solde insuffisant. Votre solde est de ${this.currentSolde.toLocaleString()} CDF`;
        return false;
      }
    }
    
    return true;
  }

  validateTransactionId() {
    this.transactionIdError = '';
    
    if (!this.transactionId || this.transactionId.trim().length < 5) {
      this.transactionIdError = 'Veuillez entrer un ID de transaction valide';
      return false;
    }
    
    return true;
  }

  validatePhone() {
    this.phoneError = '';
    const phoneRegex = /^(08|09|07)[0-9]{8}$/;
    
    if (!this.userPhone || this.userPhone.trim().length < 9) {
      this.phoneError = 'Veuillez entrer un numéro de téléphone valide';
      return false;
    }
    
    if (!phoneRegex.test(this.userPhone)) {
      this.phoneError = 'Format invalide. Utilisez 08XXXXXXXX, 09XXXXXXXX ou 07XXXXXXXX';
      return false;
    }
    
    return true;
  }

  isFormValid(): boolean {
    if (!this.operateur) return false;
    if (!this.montant || this.montant <= 0) return false;
    
    if (this.type === 'depot') {
      return this.validateMontant() && this.validateTransactionId();
    } else {
      return this.validateMontant() && this.validatePhone();
    }
  }

  clearErrors() {
    this.montantError = '';
    this.transactionIdError = '';
    this.phoneError = '';
    this.globalError = '';
  }

  async confirm() {
    this.clearErrors();
    
    if (!this.isFormValid()) {
      this.showToast('Veuillez vérifier les informations saisies', 'warning');
      return;
    }

    this.isSubmitting = true;

    const data = {
      operateur: this.operateur,
      montant: this.montant,
      transactionId: this.transactionId,
      userPhone: this.userPhone,
      vipLevel: this.userVipLevel,
      userId: this.userId
    };

    try {
      if (this.type === 'depot') {
        await this.transactionService.createDepot(data);
        this.showToast('✅ Dépôt enregistré avec succès !', 'success');
      } else {
        await this.transactionService.createRetrait(data);
        this.showToast('✅ Demande de retrait envoyée avec succès !', 'success');
      }
      
      this.modalCtrl.dismiss({ ...data, type: this.type, success: true });
      
    } catch (error: any) {
      console.error('Erreur:', error);
      this.globalError = error.message || 'Une erreur est survenue. Veuillez réessayer.';
      this.showToast(this.globalError, 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color: color as any,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}