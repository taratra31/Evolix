import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { ToastController } from '@ionic/angular/standalone';

export interface Notification {
  id?: number;
  user_id: string;
  title: string;
  message: string;
  type: 'depot' | 'retrait' | 'daily' | 'vip' | 'task' | 'info' | 'warning' | 'success';
  read: boolean;
  data?: any;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  
  constructor(
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController
  ) {}

  // ================= CREER NOTIFICATION =================
  async createNotification(notification: Notification) {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('notifications')
        .insert({
          user_id: notification.user_id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: false,
          data: notification.data || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Notification créée:', data);
      return data;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return null;
    }
  }

  // ================= NOTIFICATION POUR DEPOT EN ATTENTE =================
  async notifyDepotEnAttente(userId: string, montant: number, transactionId: string) {
    return this.createNotification({
      user_id: userId,
      title: '💰 Dépôt en attente',
      message: `Votre dépôt de ${montant.toLocaleString()} CDF est en cours de validation.`,
      type: 'depot',
      read: false,
      data: { transactionId, montant, status: 'pending' }
    });
  }

  // ================= NOTIFICATION POUR DEPOT ACCEPTE =================
  async notifyDepotAccepte(userId: string, montant: number, transactionId: string) {
    // Toast notification
    const toast = await this.toastCtrl.create({
      message: `✅ Dépôt de ${montant.toLocaleString()} CDF accepté!`,
      duration: 4000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    // Base de données
    return this.createNotification({
      user_id: userId,
      title: '✅ Dépôt accepté',
      message: `Votre dépôt de ${montant.toLocaleString()} CDF a été accepté et crédité sur votre compte.`,
      type: 'success',
      read: false,
      data: { transactionId, montant, status: 'accepted' }
    });
  }

  // ================= NOTIFICATION POUR DEPOT REFUSE =================
  async notifyDepotRefuse(userId: string, montant: number, transactionId: string, raison?: string) {
    const toast = await this.toastCtrl.create({
      message: `❌ Dépôt de ${montant.toLocaleString()} CDF refusé`,
      duration: 4000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();

    return this.createNotification({
      user_id: userId,
      title: '❌ Dépôt refusé',
      message: raison || `Votre dépôt de ${montant.toLocaleString()} CDF a été refusé. Contactez le support.`,
      type: 'warning',
      read: false,
      data: { transactionId, montant, status: 'refused', raison }
    });
  }

  // ================= NOTIFICATION POUR BONUS QUOTIDIEN =================
  async notifyDailyBonus(userId: string, montant: number) {
    const toast = await this.toastCtrl.create({
      message: `🎁 Bonus quotidien: +${montant.toLocaleString()} CDF!`,
      duration: 3000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();

    return this.createNotification({
      user_id: userId,
      title: '🎁 Bonus Quotidien',
      message: `Vous avez reçu ${montant.toLocaleString()} CDF pour votre check-in quotidien. Revenez demain pour plus!`,
      type: 'daily',
      read: false,
      data: { montant }
    });
  }

  // ================= NOTIFICATION POUR UPGRADE VIP =================
  async notifyVIPUpgrade(userId: string, nouveauVIP: number, ancienVIP: number) {
    const toast = await this.toastCtrl.create({
      message: `⭐ Félicitations! VIP ${nouveauVIP} débloqué!`,
      duration: 5000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();

    const bonusMap: Record<number, number> = {
      1: 700,
      2: 3000,
      3: 8700,
      4: 21000,
      5: 30000,
      6: 46000
    };
    const nouveauBonus = bonusMap[nouveauVIP] || 0;

    return this.createNotification({
      user_id: userId,
      title: `⭐ UPGRADE VIP ${nouveauVIP}`,
      message: `Félicitations! Vous êtes maintenant VIP ${nouveauVIP}. Votre bonus quotidien passe à ${nouveauBonus.toLocaleString()} CDF!`,
      type: 'vip',
      read: false,
      data: { ancienVIP, nouveauVIP, nouveauBonus }
    });
  }

  // ================= NOTIFICATION POUR TACHE VALIDEE =================
  async notifyTaskValidee(userId: string, taskTitle: string, montant: number) {
    const toast = await this.toastCtrl.create({
      message: `✅ Tâche "${taskTitle}" validée! +${montant.toLocaleString()} CDF`,
      duration: 4000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    return this.createNotification({
      user_id: userId,
      title: '✅ Tâche validée',
      message: `Votre tâche "${taskTitle}" a été validée. Vous avez gagné ${montant.toLocaleString()} CDF.`,
      type: 'task',
      read: false,
      data: { taskTitle, montant }
    });
  }

  // ================= NOTIFICATION POUR TACHE EN ATTENTE =================
  async notifyTaskEnAttente(userId: string, taskTitle: string) {
    return this.createNotification({
      user_id: userId,
      title: '⏳ Tâche en attente',
      message: `Votre tâche "${taskTitle}" est en cours de vérification.`,
      type: 'task',
      read: false,
      data: { taskTitle, status: 'pending' }
    });
  }

  // ================= NOTIFICATION POUR RETRAIT =================
  async notifyRetrait(userId: string, montant: number, status: 'pending' | 'accepted' | 'refused') {
    let title = '';
    let message = '';
    let type: any = 'warning';

    switch(status) {
      case 'pending':
        title = '💰 Retrait en attente';
        message = `Votre demande de retrait de ${montant.toLocaleString()} CDF est en cours de traitement.`;
        type = 'warning';
        break;
      case 'accepted':
        title = '✅ Retrait effectué';
        message = `Votre retrait de ${montant.toLocaleString()} CDF a été effectué avec succès.`;
        type = 'success';
        break;
      case 'refused':
        title = '❌ Retrait refusé';
        message = `Votre demande de retrait de ${montant.toLocaleString()} CDF a été refusée.`;
        type = 'danger';
        break;
    }

    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      color: status === 'accepted' ? 'success' : (status === 'refused' ? 'danger' : 'warning'),
      position: 'top'
    });
    await toast.present();

    return this.createNotification({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      data: { montant, status }
    });
  }

  // ================= CHARGER NOTIFICATIONS D'UN USER =================
  async getUserNotifications(userId: string) {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      return [];
    }
  }

  // ================= MARQUER COMME LUE =================
  async markAsRead(notificationId: number) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur mark as read:', error);
      return false;
    }
  }

  // ================= COMPTER NOTIFICATIONS NON LUES =================
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabaseService.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erreur count unread:', error);
      return 0;
    }
  }

  // ================= SUPPRIMER NOTIFICATION =================
  async deleteNotification(notificationId: number) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur delete notification:', error);
      return false;
    }
  }
}