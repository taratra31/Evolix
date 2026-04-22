import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, ToastController, AlertController, LoadingController, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, peopleOutline, diamondOutline,
  walletOutline, giftOutline, eyeOutline, searchOutline,
  personCircleOutline, trashOutline, starOutline, createOutline,
  refreshOutline, filterOutline, closeCircleOutline, checkmarkCircleOutline,
  lockClosedOutline, lockOpenOutline, addOutline, removeOutline,
  callOutline, keyOutline, copyOutline, mailOutline, calendarOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { AdminService } from '../../../services/admin/admin.service';

@Component({
  selector: 'app-utilisateur',
  templateUrl: './utilisateur.page.html',
  styleUrls: ['./utilisateur.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon, IonSpinner]
})
export class UtilisateurPage implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  sortBy: string = 'date_desc';
  
  totalUsers: number = 0;
  totalVIP: number = 0;
  totalSolde: number = 0;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private adminService: AdminService
  ) {
    addIcons({
      arrowBackOutline, peopleOutline, diamondOutline,
      walletOutline, giftOutline, eyeOutline, searchOutline,
      personCircleOutline, trashOutline, starOutline, createOutline,
      refreshOutline, filterOutline, closeCircleOutline, checkmarkCircleOutline,
      lockClosedOutline, lockOpenOutline, addOutline, removeOutline,
      callOutline, keyOutline, copyOutline, mailOutline, calendarOutline
    });
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    const loading = await this.loadingCtrl.create({
      message: 'Chargement des utilisateurs...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });
    await loading.present();

    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.users = data || [];
      this.calculateStats();
      this.applySort();
      
    } catch (err) {
      console.error('Error loading users:', err);
      this.showToast('Erreur lors du chargement des utilisateurs', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  calculateStats() {
    this.totalUsers = this.users.length;
    this.totalVIP = this.users.filter(u => u['vip_level'] > 0).length;
    this.totalSolde = this.users.reduce((sum, u) => sum + (u['solde'] || 0), 0);
  }

  applySort() {
    let sorted = [...this.users];
    
    switch(this.sortBy) {
      case 'vip_desc':
        sorted.sort((a, b) => (b['vip_level'] || 0) - (a['vip_level'] || 0));
        break;
      case 'solde_desc':
        sorted.sort((a, b) => (b['solde'] || 0) - (a['solde'] || 0));
        break;
      case 'date_asc':
        sorted.sort((a, b) => new Date(a['created_at']).getTime() - new Date(b['created_at']).getTime());
        break;
      default:
        sorted.sort((a, b) => new Date(b['created_at']).getTime() - new Date(a['created_at']).getTime());
    }
    
    this.users = sorted;
    this.filterUsers();
  }

  filterUsers() {
    if (!this.searchTerm) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user => 
        user['phone']?.toLowerCase().includes(term) ||
        user['email']?.toLowerCase().includes(term) ||
        user['id']?.toLowerCase().includes(term)
      );
    }
  }

  async showSortOptions() {
    const alert = await this.alertCtrl.create({
      header: 'Trier par',
      inputs: [
        { name: 'date_desc', type: 'radio', label: '📅 Date (récent → ancien)', value: 'date_desc', checked: this.sortBy === 'date_desc' },
        { name: 'date_asc', type: 'radio', label: '📅 Date (ancien → récent)', value: 'date_asc', checked: this.sortBy === 'date_asc' },
        { name: 'vip_desc', type: 'radio', label: '⭐ Niveau VIP (plus élevé)', value: 'vip_desc', checked: this.sortBy === 'vip_desc' },
        { name: 'solde_desc', type: 'radio', label: '💰 Solde (plus élevé)', value: 'solde_desc', checked: this.sortBy === 'solde_desc' }
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Appliquer', handler: (value) => { if (value) { this.sortBy = value; this.applySort(); this.showToast('Tri appliqué', 'success'); } } }
      ]
    });
    await alert.present();
  }

  async refreshData() {
    await this.loadUsers();
    this.showToast('Données actualisées', 'success');
  }

  viewUserDetails(user: any) {
    this.router.navigate(['/user-details', user['id']]);
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Mot de passe copié ! 🔑', 'success');
    } catch (err) {
      this.showToast('Erreur lors de la copie', 'danger');
    }
  }

 async editSolde(user: any) {
  console.log('🟢 editSolde called for user:', user['id'], user['phone']);
  
  const alert = await this.alertCtrl.create({
    header: '💰 Modifier le solde',
    message: 'Solde actuel: ' + (user['solde'] || 0) + ' CDF',
    inputs: [
      {
        name: 'amount',
        type: 'number',
        placeholder: 'Montant'
      }
    ],
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Valider',
        handler: (data: any) => {
          console.log('🟢 Data from alert:', data);
          console.log('🟢 Amount:', data.amount);
          
          if (!data.amount || data.amount <= 0) {
            this.showToast('Montant invalide', 'danger');
            return false;
          }
          
          this.adminService.updateUserSolde(user['id'], Number(data.amount), 'set')
            .then(success => {
              console.log('🟢 Update result:', success);
              if (success) {
                this.loadUsers();
                this.showToast('Solde mis à jour', 'success');
              }
            })
            .catch(err => {
              console.error('🔴 Error:', err);
              this.showToast('Erreur: ' + err.message, 'danger');
            });
          
          return true;
        }
      }
    ]
  });
  await alert.present();
}

  async blockUser(user: any) {
    const alert = await this.alertCtrl.create({
      header: '🔒 Bloquer l\'utilisateur',
      message: `Bloquer <strong>${user['phone']}</strong> ?`,
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Raison (optionnel)', attributes: { rows: 2 } }],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Bloquer', cssClass: 'danger', handler: async (data) => {
          const loading = await this.loadingCtrl.create({ message: 'Blocage...', spinner: 'crescent' });
          await loading.present();
          const success = await this.adminService.blockUser(user['id'], data.reason);
          await loading.dismiss();
          if (success) { await this.loadUsers(); this.showToast(`🔒 ${user['phone']} bloqué`, 'warning'); }
        }}
      ]
    });
    await alert.present();
  }

  async unblockUser(user: any) {
    const alert = await this.alertCtrl.create({
      header: '🔓 Débloquer l\'utilisateur',
      message: `Débloquer <strong>${user['phone']}</strong> ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Débloquer', cssClass: 'success', handler: async () => {
          const loading = await this.loadingCtrl.create({ message: 'Déblocage...', spinner: 'crescent' });
          await loading.present();
          const success = await this.adminService.unblockUser(user['id']);
          await loading.dismiss();
          if (success) { await this.loadUsers(); this.showToast(`🔓 ${user['phone']} débloqué`, 'success'); }
        }}
      ]
    });
    await alert.present();
  }

  async deleteUser(user: any) {
    const alert = await this.alertCtrl.create({
      header: '⚠️ Suppression',
      message: `Supprimer <strong>${user['phone']}</strong> ? Irréversible !`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Supprimer', cssClass: 'danger', handler: async () => {
          const loading = await this.loadingCtrl.create({ message: 'Suppression...', spinner: 'crescent' });
          await loading.present();
          const success = await this.adminService.deleteUser(user['id']);
          await loading.dismiss();
          if (success) { await this.loadUsers(); this.showToast(`✅ ${user['phone']} supprimé`, 'success'); }
        }}
      ]
    });
    await alert.present();
  }

  async removeVIP(user: any) {
    if (user['vip_level'] === 0) { this.showToast('Pas membre VIP', 'warning'); return; }
    const alert = await this.alertCtrl.create({
      header: '⭐ Rétrogradation VIP',
      message: `Retirer le VIP ${user['vip_level']} à ${user['phone']} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Retirer', handler: async () => {
          const loading = await this.loadingCtrl.create({ message: 'Mise à jour...', spinner: 'crescent' });
          await loading.present();
          const success = await this.adminService.updateUserVipLevel(user['id'], 0);
          await loading.dismiss();
          if (success) { await this.loadUsers(); this.showToast(`⭐ VIP retiré`, 'warning'); }
        }}
      ]
    });
    await alert.present();
  }

  async changeVIPLevel(user: any) {
    const alert = await this.alertCtrl.create({
      header: '⭐ Modifier VIP',
      message: `Nouveau niveau pour ${user['phone']} :`,
      inputs: [
        { name: '0', type: 'radio', label: 'VIP 0 (Standard)', value: '0', checked: user['vip_level'] === 0 },
        { name: '1', type: 'radio', label: 'VIP 1 (Bronze)', value: '1', checked: user['vip_level'] === 1 },
        { name: '2', type: 'radio', label: 'VIP 2 (Argent)', value: '2', checked: user['vip_level'] === 2 },
        { name: '3', type: 'radio', label: 'VIP 3 (Or)', value: '3', checked: user['vip_level'] === 3 },
        { name: '4', type: 'radio', label: 'VIP 4 (Platine)', value: '4', checked: user['vip_level'] === 4 },
        { name: '5', type: 'radio', label: 'VIP 5 (Diamant)', value: '5', checked: user['vip_level'] === 5 }
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Appliquer', handler: async (value) => {
          if (value && parseInt(value) !== user['vip_level']) {
            const loading = await this.loadingCtrl.create({ message: 'Mise à jour...', spinner: 'crescent' });
            await loading.present();
            const success = await this.adminService.updateUserVipLevel(user['id'], parseInt(value));
            await loading.dismiss();
            if (success) { await this.loadUsers(); this.showToast(`⭐ VIP ${value}`, 'success'); }
          }
        }}
      ]
    });
    await alert.present();
  }

  getVIPLevelName(level: number): string {
    const names: {[key: number]: string} = { 0: 'Standard', 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };
    return names[level] || `VIP ${level}`;
  }

  getVIPBadgeClass(level: number): string {
    if (level === 0) return 'vip-0';
    if (level === 1) return 'vip-1';
    if (level === 2) return 'vip-2';
    if (level === 3) return 'vip-3';
    if (level === 4) return 'vip-4';
    return 'vip-5';
  }

  formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    if (phone.startsWith('+243')) {
      return phone.replace(/(\+243)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
    return phone;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'bottom',
      buttons: [{ icon: 'close-circle-outline', role: 'cancel' }]
    });
    await toast.present();
  }
}