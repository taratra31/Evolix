import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonIcon, 
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  AlertController,
  NavController,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  notificationsOutline, 
  notificationsOffOutline,
  checkmarkCircleOutline,
  warningOutline,
  informationCircleOutline,
  giftOutline,
  closeOutline,
  cashOutline,
  trophyOutline,
  flashOutline,
  timeOutline,
  trashOutline, 
  arrowBackOutline, 
  refreshOutline, 
  chevronBackOutline,
  peopleOutline,
  calendarOutline,
  checkmarkDoneCircleOutline,
  time,
  cash,
  gift,
  trophy,
  alertCircleOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    CommonModule, 
    FormsModule, 
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton
  ]
})
export class NotificationsPage implements OnInit {

  notifications: any[] = [];
  groupedNotifications: any[] = [];
  userId: string = '';
  isLoading = true;
  isRefreshing = false;

  // 🔥 Ho an'ny "Deleted" notifications (hide fotsiny)
  private deletedNotifications: Set<string> = new Set();

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private supabaseService: SupabaseService,
    private navCtrl: NavController
  ) {
    addIcons({
      chevronBackOutline,
      trashOutline,
      closeOutline,
      notificationsOffOutline,
      refreshOutline,
      arrowBackOutline,
      notificationsOutline,
      checkmarkCircleOutline,
      warningOutline,
      informationCircleOutline,
      giftOutline,
      cashOutline,
      trophyOutline,
      flashOutline,
      timeOutline,
      peopleOutline,
      calendarOutline,
      checkmarkDoneCircleOutline,
      time,
      cash,
      gift,
      trophy,
      alertCircleOutline,
      checkmarkDoneOutline
    });
  }

  async ngOnInit() {
    await this.loadUser();
    await this.loadAllNotifications();
    this.loadDeletedFromStorage();
  }

  loadDeletedFromStorage() {
    // Maka ny notifications voafafa tao localStorage
    const deleted = localStorage.getItem(`deleted_notifs_${this.userId}`);
    if (deleted) {
      const deletedIds = JSON.parse(deleted);
      deletedIds.forEach((id: string) => this.deletedNotifications.add(id));
    }
  }

  saveDeletedToStorage() {
    // Tehirizo ny notifications voafafa
    const deletedIds = Array.from(this.deletedNotifications);
    localStorage.setItem(`deleted_notifs_${this.userId}`, JSON.stringify(deletedIds));
  }

  async loadUser() {
    const userId = localStorage.getItem('userId') ?? '';
    const phone = localStorage.getItem('userPhone') ?? '';

    if (!userId && !phone) {
      this.showToast('Utilisateur non connecté', 'danger');
      return;
    }

    try {
      let query = this.supabaseService.supabase
        .from('users')
        .select('id')
        .eq('id', userId);
      
      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        console.error('User not found');
        return;
      }

      this.userId = data.id;

    } catch (err) {
      console.error('Error loading user:', err);
    }
  }

  async loadAllNotifications() {
    this.isLoading = true;
    this.notifications = [];

    if (!this.userId) {
      this.isLoading = false;
      return;
    }

    try {
      // 1️⃣ DAILY BONUS
      const { data: dailyBonuses, error: dailyError } = await this.supabaseService.supabase
        .from('daily_bonus')
        .select('*')
        .eq('user_id', this.userId)
        .order('claimed_date', { ascending: false })
        .limit(20);

      if (!dailyError && dailyBonuses) {
        dailyBonuses.forEach((bonus: any) => {
          const notifId = `daily_${bonus.id}`;
          if (!this.deletedNotifications.has(notifId)) {
            this.notifications.push({
              id: notifId,
              originalId: bonus.id,
              table: 'daily_bonus',
              title: 'Bonus Quotidien',
              message: `Vous avez reçu ${bonus.amount.toLocaleString()} CDF pour votre check-in du ${new Date(bonus.claimed_date).toLocaleDateString()}`,
              time: this.formatDate(bonus.claimed_date),
              type: 'daily',
              icon: 'gift-outline',
              unread: false,
              created_at: bonus.claimed_date,
              deletable: true
            });
          }
        });
      }

      // 2️⃣ TASKS
      const { data: tasks, error: tasksError } = await this.supabaseService.supabase
        .from('tasks')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!tasksError && tasks) {
        tasks.forEach((task: any) => {
          const notifId = `task_${task.id}`;
          if (!this.deletedNotifications.has(notifId)) {
            const statusIcon = task.status === 'pending' ? 'time-outline' : 'checkmark-circle-outline';
            const statusTitle = task.status === 'pending' ? 'Tâche en attente' : 'Tâche validée';
            const statusMessage = task.status === 'pending' 
              ? `Votre tâche "${task.title}" est en cours de validation.`
              : `Votre tâche "${task.title}" a été validée. +${task.price.toLocaleString()} CDF`;
            
            this.notifications.push({
              id: notifId,
              originalId: task.id,
              table: 'tasks',
              title: statusTitle,
              message: statusMessage,
              time: this.formatDate(task.created_at),
              type: task.status === 'pending' ? 'warning' : 'success',
              icon: statusIcon,
              unread: task.status === 'pending',
              created_at: task.created_at,
              deletable: true
            });
          }
        });
      }

      // 3️⃣ TRANSACTIONS
      const { data: transactions, error: transError } = await this.supabaseService.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!transError && transactions) {
        transactions.forEach((trans: any) => {
          const notifId = `trans_${trans.id}`;
          if (!this.deletedNotifications.has(notifId)) {
            let title = '';
            let message = '';
            let type = '';
            let icon = '';

            if (trans.type === 'depot') {
              if (trans.status === 'pending') {
                title = 'Dépôt en attente';
                message = `Votre dépôt de ${trans.montant.toLocaleString()} CDF est en cours de validation.`;
                type = 'warning';
                icon = 'time-outline';
              } else if (trans.status === 'accepted') {
                title = 'Dépôt accepté';
                message = `Votre dépôt de ${trans.montant.toLocaleString()} CDF a été accepté et crédité.`;
                type = 'success';
                icon = 'checkmark-circle-outline';
              } else {
                title = 'Dépôt refusé';
                message = `Votre dépôt de ${trans.montant.toLocaleString()} CDF a été refusé.`;
                type = 'warning';
                icon = 'close-outline';
              }
            } else if (trans.type === 'retrait') {
              if (trans.status === 'pending') {
                title = 'Retrait en attente';
                message = `Votre demande de retrait de ${trans.montant.toLocaleString()} CDF est en cours.`;
                type = 'warning';
                icon = 'time-outline';
              } else if (trans.status === 'accepted') {
                title = 'Retrait effectué';
                message = `Votre retrait de ${trans.montant.toLocaleString()} CDF a été effectué.`;
                type = 'success';
                icon = 'cash-outline';
              } else {
                title = 'Retrait refusé';
                message = `Votre demande de retrait de ${trans.montant.toLocaleString()} CDF a été refusée.`;
                type = 'warning';
                icon = 'close-outline';
              }
            }

            this.notifications.push({
              id: notifId,
              originalId: trans.id,
              table: 'transactions',
              title: title,
              message: message,
              time: this.formatDate(trans.created_at),
              type: type,
              icon: icon,
              unread: trans.status === 'pending',
              created_at: trans.created_at,
              deletable: true
            });
          }
        });
      }

      // 4️⃣ PARRAINAGE
      const { data: parrainages, error: parrainError } = await this.supabaseService.supabase
        .from('users')
        .select('*')
        .eq('referred_by', this.userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!parrainError && parrainages) {
        parrainages.forEach((parrain: any) => {
          const notifId = `parrain_${parrain.id}`;
          if (!this.deletedNotifications.has(notifId)) {
            this.notifications.push({
              id: notifId,
              originalId: parrain.id,
              table: 'users',
              title: 'Nouveau parrainage',
              message: `Un nouveau membre a rejoint via votre code de parrainage.`,
              time: this.formatDate(parrain.created_at),
              type: 'info',
              icon: 'people-outline',
              unread: false,
              created_at: parrain.created_at,
              deletable: true
            });
          }
        });
      }

      // 5️⃣ VIP UPGRADES
      const { data: vips, error: vipError } = await this.supabaseService.supabase
        .from('vip_upgrades')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!vipError && vips) {
        vips.forEach((vip: any) => {
          const notifId = `vip_${vip.id}`;
          if (!this.deletedNotifications.has(notifId)) {
            this.notifications.push({
              id: notifId,
              originalId: vip.id,
              table: 'vip_upgrades',
              title: `Upgrade VIP ${vip.new_level}`,
              message: `Félicitations! Vous êtes maintenant VIP ${vip.new_level}. Votre bonus quotidien a été augmenté.`,
              time: this.formatDate(vip.created_at),
              type: 'vip',
              icon: 'trophy-outline',
              unread: false,
              created_at: vip.created_at,
              deletable: true
            });
          }
        });
      }

      // Manambatra sy mandamina araka ny daty
      this.notifications.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Group notifications by date
      this.groupNotificationsByDate();

      console.log(`📬 ${this.notifications.length} notifications chargées`);

    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      this.isLoading = false;
      this.isRefreshing = false;
    }
  }

  groupNotificationsByDate() {
    const groups: { [key: string]: any[] } = {};
    
    this.notifications.forEach(notif => {
      const date = new Date(notif.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      let groupKey = '';
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Aujourd'hui";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Hier';
      } else {
        groupKey = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notif);
    });
    
    this.groupedNotifications = Object.keys(groups).map(key => ({
      date: key,
      items: groups[key]
    }));
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      success: 'Succès',
      warning: 'Alerte',
      info: 'Information',
      daily: 'Bonus',
      bonus: 'Bonus',
      vip: 'VIP',
      deposit: 'Dépôt',
      withdraw: 'Retrait'
    };
    return labels[type] || 'Information';
  }

  async deleteNotification(notification: any) {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer',
      message: 'Voulez-vous vraiment supprimer cette notification ?',
      backdropDismiss: false,
      buttons: [
        { 
          text: 'Annuler', 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        { 
          text: 'Supprimer', 
          role: 'destructive',
          cssClass: 'alert-button-destructive',
          handler: async () => {
            this.deletedNotifications.add(notification.id);
            this.saveDeletedToStorage();
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
              this.notifications.splice(index, 1);
              this.groupNotificationsByDate();
              this.showToast('Notification supprimée', 'success');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteAllNotifications() {
    if (this.notifications.length === 0) {
      this.showToast('Aucune notification à supprimer', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Supprimer tout',
      message: 'Voulez-vous vraiment supprimer toutes les notifications ?',
      backdropDismiss: false,
      buttons: [
        { 
          text: 'Annuler', 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        { 
          text: 'Tout supprimer', 
          role: 'destructive',
          cssClass: 'alert-button-destructive',
          handler: async () => {
            this.notifications.forEach(notif => {
              this.deletedNotifications.add(notif.id);
            });
            this.saveDeletedToStorage();
            this.notifications = [];
            this.groupedNotifications = [];
            this.showToast('Toutes les notifications ont été supprimées', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  async restoreNotifications() {
    this.deletedNotifications.clear();
    localStorage.removeItem(`deleted_notifs_${this.userId}`);
    await this.loadAllNotifications();
    this.showToast('Notifications restaurées', 'success');
  }

  formatDate(dateString: string): string {
    if (!dateString) return "À l'instant";
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  async markAsRead(notification: any) {
    if (notification.unread) {
      notification.unread = false;
      this.showToast('Notification marquée comme lue', 'success');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: color as any,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  async doRefresh(event: any) {
    this.isRefreshing = true;
    await this.loadAllNotifications();
    if (event) {
      event.target.complete();
    }
  }
}