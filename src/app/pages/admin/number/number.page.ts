import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonIcon, IonToggle, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  createOutline, checkmarkOutline, closeOutline, callOutline,
  arrowBackOutline, informationCircle, timeOutline, copyOutline,
  shieldCheckmarkOutline, cellularOutline, wifiOutline, hardwareChipOutline
} from 'ionicons/icons';
import { AdminService } from '../../../services/admin/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-number',
  templateUrl: './number.page.html',
  styleUrls: ['./number.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, 
    IonToolbar, IonIcon, IonToggle
  ]
})
export class NumberPage implements OnInit {
  
  numbers: any[] = [];
  editingId: string | null = null;
  editValue: string = '';
  isLoading: boolean = true;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ 
      createOutline, checkmarkOutline, closeOutline, callOutline,
      arrowBackOutline, informationCircle, timeOutline, copyOutline,
      shieldCheckmarkOutline, cellularOutline, wifiOutline, hardwareChipOutline,
    });
  }

  async ngOnInit() {
    await this.loadNumbers();
  }

  async loadNumbers() {
    try {
      this.isLoading = true;
      this.numbers = await this.adminService.getAllCollectNumbers();
      console.log('📞 Numéros chargés:', this.numbers);
    } catch (error) {
      console.error('❌ Erreur:', error);
      this.showToast('Erreur lors du chargement', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  get activeCount(): number {
    return this.numbers.filter(n => n.is_active).length;
  }

  get inactiveCount(): number {
    return this.numbers.filter(n => !n.is_active).length;
  }

  getOperatorIcon(operator: string): string {
    switch(operator) {
      case 'orange': return 'cellular-outline';
      case 'airtel': return 'wifi-outline';
      case 'vodacom': return 'hardware-chip-outline';
      default: return 'call-outline';
    }
  }

  startEdit(number: any) {
    this.editingId = number.id;
    this.editValue = number.phone_number;
  }

  cancelEdit() {
    this.editingId = null;
    this.editValue = '';
  }

  async saveNumber(number: any) {
    if (!this.editValue || this.editValue.length < 9) {
      this.showToast('Numéro invalide (minimum 9 chiffres)', 'warning');
      return;
    }

    const success = await this.adminService.updateCollectNumber(number.id, this.editValue);
    if (success) {
      this.editingId = null;
      await this.loadNumbers();
    }
  }

  async toggleStatus(number: any) {
    const success = await this.adminService.toggleCollectNumberStatus(number.id, number.is_active);
    if (success) {
      await this.loadNumbers();
    }
  }

  async copyNumber(phoneNumber: string) {
    await navigator.clipboard.writeText(phoneNumber);
    this.showToast('📋 Numéro copié !', 'success');
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: color as any,
      position: 'bottom'
    });
    await toast.present();
  }
}