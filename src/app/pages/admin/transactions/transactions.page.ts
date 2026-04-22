import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, arrowDownOutline, arrowUpOutline,
  checkmarkOutline, closeOutline, trendingUpOutline,
  trendingDownOutline, receiptOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';
import { AdminService } from '../../../services/admin/admin.service';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon]
})
export class TransactionsPage implements OnInit {

  transactions: any[] = [];
  filteredTransactions: any[] = [];
  selectedFilter: string = 'all';
  
  totalDepots: number = 0;
  totalRetraits: number = 0;
  
  isAdmin: boolean = false;
  userId: string = '';
  adminInfo: any = null;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private adminService: AdminService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      arrowBackOutline, arrowDownOutline, arrowUpOutline,
      checkmarkOutline, closeOutline, trendingUpOutline,
      trendingDownOutline, receiptOutline
    });
  }

  async ngOnInit() {
    await this.getCurrentUser();
    await this.checkAdminStatus();
    await this.loadTransactions();
  }

  async getCurrentUser() {
    this.userId = localStorage.getItem('userId') || '';
    console.log('👤 Current userId:', this.userId);
  }

  async checkAdminStatus() {
    if (!this.userId) {
      this.isAdmin = false;
      console.log('❌ Pas de userId');
      return;
    }

    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('id, phone, is_admin, vip_level')
        .eq('id', this.userId)
        .single();

      if (error) {
        console.error('❌ Erreur requête:', error);
        throw error;
      }
      
      console.log('📊 User data from DB:', data);
      
      this.isAdmin = data && data['is_admin'] === true;
      this.adminInfo = data;
      
      console.log('👑 Is Admin:', this.isAdmin);
      console.log('📞 Phone:', data?.['phone']);
      console.log('⭐ VIP Level:', data?.['vip_level']);
      
      if (!this.isAdmin) {
        this.showToast('⚠️ Accès réservé à l\'administrateur', 'warning');
      } else {
        this.showToast('✅ Mode Admin activé', 'success');
      }
      
    } catch (err: any) {
      console.error('❌ Error checking admin status:', err);
      this.isAdmin = false;
      this.showToast('Erreur lors de la vérification admin', 'danger');
    }
  }

  async loadTransactions() {
    try {
      const data = await this.adminService.getAllTransactions();
      this.transactions = data || [];
      console.log('📋 Transactions chargées:', this.transactions.length);
      this.calculateTotals();
      this.filterTransactions(this.selectedFilter);
      
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      this.showToast('Erreur de chargement', 'danger');
    }
  }

  calculateTotals() {
    this.totalDepots = this.transactions
      .filter(t => t.type === 'depot' && t.status === 'accepted')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
    
    this.totalRetraits = this.transactions
      .filter(t => t.type === 'retrait' && t.status === 'accepted')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  filterTransactions(filter: string) {
    this.selectedFilter = filter;
    
    switch(filter) {
      case 'depot':
        this.filteredTransactions = this.transactions.filter(t => t.type === 'depot');
        break;
      case 'retrait':
        this.filteredTransactions = this.transactions.filter(t => t.type === 'retrait');
        break;
      case 'pending':
        this.filteredTransactions = this.transactions.filter(t => t.status === 'pending');
        break;
      default:
        this.filteredTransactions = [...this.transactions];
    }
    console.log('🔍 Filtered transactions:', this.filteredTransactions.length);
  }

  async updateStatus(transaction: any, status: string) {
    console.log('🔄 updateStatus called:', { transactionId: transaction.id, status, isAdmin: this.isAdmin });
    
    if (!this.isAdmin) {
      this.showToast('🔒 Seul l\'administrateur peut modifier les transactions', 'danger');
      return;
    }
    
    const actionText = status === 'accepted' ? 'accepter' : 'refuser';
    const confirmText = status === 'accepted' ? '✅ Accepter' : '❌ Refuser';
    
    const alert = await this.alertCtrl.create({
      header: 'Confirmation',
      message: `
        <div style="text-align: center; padding: 10px;">
          <strong>💰 Montant:</strong> ${transaction.montant.toLocaleString()} CDF<br><br>
          <strong>👤 Utilisateur:</strong> ${transaction.users?.phone || transaction.user_phone || 'Inconnu'}<br><br>
          <strong>📅 Date:</strong> ${new Date(transaction.created_at).toLocaleString()}<br><br>
          <strong>⚠️ Action:</strong> Voulez-vous vraiment ${actionText} cette transaction ?
        </div>
      `,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: confirmText,
          handler: async () => {
            await this.processUpdate(transaction, status);
          }
        }
      ]
    });

    await alert.present();
  }

  async processUpdate(transaction: any, status: string) {
    console.log('⚙️ processUpdate started:', { transactionId: transaction.id, status });
    
    if (!this.isAdmin) {
      this.showToast('🔒 Action non autorisée', 'danger');
      return;
    }
    
    const loading = await this.alertCtrl.create({
      message: '⏳ Traitement en cours...',
      backdropDismiss: false
    });
    await loading.present();
    
    try {
      const success = await this.adminService.updateTransactionStatus(transaction.id, status);
      
      if (success) {
        console.log('✅ Update successful');
        await this.loadTransactions();
        await loading.dismiss();
      } else {
        throw new Error('Update failed');
      }
      
    } catch (err: any) {
      await loading.dismiss();
      console.error('❌ Error updating status:', err);
      const errorMessage = err?.message || err?.error?.message || 'Erreur inconnue';
      this.showToast('Erreur lors de la mise à jour: ' + errorMessage, 'danger');
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'accepted': return 'checkmark-circle-outline';
      case 'refused': return 'close-circle-outline';
      default: return 'time-outline';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'accepted': return 'Accepté';
      case 'refused': return 'Refusé';
      default: return 'En attente';
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}