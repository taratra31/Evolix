import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  constructor(
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController
  ) {}

  // ==================== USER MANAGEMENT ====================
  
  async getAllUsers() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  async getUserById(userId: string) {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  async updateUserVipLevel(userId: string, newVipLevel: number) {
    try {
      const { data: user } = await this.supabaseService.supabase
        .from('users')
        .select('vip_level')
        .eq('id', userId)
        .single();

      const oldVipLevel = user?.vip_level || 0;

      const { error } = await this.supabaseService.supabase
        .from('users')
        .update({ vip_level: newVipLevel })
        .eq('id', userId);

      if (error) throw error;

      await this.supabaseService.supabase
        .from('vip_upgrades')
        .insert({
          user_id: userId,
          old_level: oldVipLevel,
          new_level: newVipLevel,
          amount: 0,
          created_at: new Date().toISOString()
        });

      this.showToast(`VIP niveau ${newVipLevel} attribué`, 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de la mise à jour VIP', 'danger');
      return false;
    }
  }

  async updateUserSolde(userId: string, amount: number, operation: 'set' | 'add' | 'subtract' = 'set') {
    try {
      let finalSolde = amount;
      
      if (operation !== 'set') {
        const { data: user, error: getUserError } = await this.supabaseService.supabase
          .from('users')
          .select('solde')
          .eq('id', userId)
          .single();
        
        if (getUserError) throw getUserError;
        
        if (operation === 'add') {
          finalSolde = (user?.solde || 0) + amount;
        } else if (operation === 'subtract') {
          finalSolde = (user?.solde || 0) - amount;
          if (finalSolde < 0) finalSolde = 0;
        }
      }

      const { error } = await this.supabaseService.supabase
        .from('users')
        .update({ solde: finalSolde })
        .eq('id', userId);

      if (error) throw error;

      const operationText = operation === 'add' ? 'ajoutés' : (operation === 'subtract' ? 'retirés' : 'définis à');
      this.showToast(`${amount.toLocaleString()} CDF ${operationText} - Nouveau solde: ${finalSolde.toLocaleString()} CDF`, 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de la mise à jour du solde', 'danger');
      return false;
    }
  }

  async blockUser(userId: string, reason?: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('users')
        .update({ 
          is_blocked: true,
          blocked_reason: reason || null,
          blocked_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      this.showToast('Utilisateur bloqué ❌', 'warning');
      return true;
    } catch (error) {
      this.showToast('Erreur lors du blocage', 'danger');
      return false;
    }
  }

  async unblockUser(userId: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('users')
        .update({ 
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null
        })
        .eq('id', userId);

      if (error) throw error;

      this.showToast('Utilisateur débloqué ✅', 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors du déblocage', 'danger');
      return false;
    }
  }

  async toggleAdminStatus(userId: string, isAdmin: boolean) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('users')
        .update({ is_admin: isAdmin })
        .eq('id', userId);

      if (error) throw error;

      this.showToast(`Admin ${isAdmin ? 'activé' : 'désactivé'}`, 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors du changement', 'danger');
      return false;
    }
  }

  async deleteUser(userId: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      this.showToast('Utilisateur supprimé', 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de la suppression', 'danger');
      return false;
    }
  }

  // ==================== TRANSACTION MANAGEMENT ====================

  async getAllTransactions() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('transactions')
        .select('*, users(phone, id)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  async updateTransactionStatus(transactionId: string, status: string) {
    try {
      let finalStatus = status;
      if (status === 'refused') {
        finalStatus = 'rejected';
      }
      
      const { error } = await this.supabaseService.supabase
        .from('transactions')
        .update({ status: finalStatus })
        .eq('id', transactionId);

      if (error) throw error;
      
      const toast = await this.toastCtrl.create({
        message: finalStatus === 'accepted' ? '✅ Transaction acceptée avec succès !' : '❌ Transaction refusée avec succès !',
        duration: 3000,
        color: finalStatus === 'accepted' ? 'success' : 'danger',
        position: 'top'
      });
      await toast.present();
      
      return true;
      
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      const toast = await this.toastCtrl.create({
        message: `❌ Erreur: ${error.message || 'Problème lors de la mise à jour'}`,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      return false;
    }
  }

  async deleteTransaction(transactionId: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      this.showToast('Transaction supprimée', 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de la suppression', 'danger');
      return false;
    }
  }

  async getTransactionStats() {
    try {
      const transactions = await this.getAllTransactions();
      
      const totalDepots = transactions
        .filter(t => t.type === 'depot' && t.status === 'accepted')
        .reduce((sum, t) => sum + (t.montant || 0), 0);
      
      const totalRetraits = transactions
        .filter(t => t.type === 'retrait' && t.status === 'accepted')
        .reduce((sum, t) => sum + (t.montant || 0), 0);
      
      const pendingCount = transactions.filter(t => t.status === 'pending').length;
      const totalCount = transactions.length;

      return { totalDepots, totalRetraits, pendingCount, totalCount };
    } catch (error) {
      return { totalDepots: 0, totalRetraits: 0, pendingCount: 0, totalCount: 0 };
    }
  }

  // ==================== PUBLICATION MANAGEMENT ====================

  async getAllPublications() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  async addPublication(publication: any) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('publications')
        .insert({
          title: publication.title,
          content: publication.content,
          type: publication.type || 'info',
          image_url: publication.image_url || null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      this.showToast('Publication ajoutée', 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de l\'ajout', 'danger');
      return false;
    }
  }

  async updatePublication(id: string, publication: any) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('publications')
        .update({
          title: publication.title,
          content: publication.content,
          type: publication.type,
          image_url: publication.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      this.showToast('Publication modifiée', 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de la modification', 'danger');
      return false;
    }
  }

  async deletePublication(id: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('publications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.showToast('Publication supprimée', 'success');
      return true;
    } catch (error) {
      this.showToast('Erreur lors de la suppression', 'danger');
      return false;
    }
  }

  // ==================== STATISTICS ====================

  async getGlobalStats() {
    try {
      const users = await this.getAllUsers();
      const transactions = await this.getAllTransactions();
      const publications = await this.getAllPublications();

      const totalUsers = users.length;
      const totalVIP = users.filter(u => u['vip_level'] > 0).length;
      const totalTransactions = transactions.length;
      const totalPublications = publications.length;
      
      const totalVolume = transactions
        .filter(t => t.status === 'accepted')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      return {
        totalUsers,
        totalVIP,
        totalTransactions,
        totalPublications,
        totalVolume
      };
    } catch (error) {
      return {
        totalUsers: 0,
        totalVIP: 0,
        totalTransactions: 0,
        totalPublications: 0,
        totalVolume: 0
      };
    }
  }

  // ==================== COLLECT NUMBERS MANAGEMENT ====================

  async getAllCollectNumbers() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('collect_numbers')
        .select('*')
        .order('operator', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getAllCollectNumbers:', error);
      return [];
    }
  }

  async getCollectNumberByOperator(operator: string) {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('collect_numbers')
        .select('phone_number, is_active, id')
        .eq('operator', operator)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur getCollectNumberByOperator:', error);
      return null;
    }
  }

  async updateCollectNumber(id: string, phoneNumber: string) {
    try {
      if (!phoneNumber || phoneNumber.length < 9) {
        this.showToast('Numéro invalide (minimum 9 chiffres)', 'warning');
        return false;
      }

      const { error } = await this.supabaseService.supabase
        .from('collect_numbers')
        .update({ 
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      this.showToast('✅ Numéro mis à jour avec succès', 'success');
      return true;
    } catch (error) {
      console.error('Erreur updateCollectNumber:', error);
      this.showToast('❌ Erreur lors de la mise à jour', 'danger');
      return false;
    }
  }

  async toggleCollectNumberStatus(id: string, isActive: boolean) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('collect_numbers')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      this.showToast(isActive ? '✅ Numéro activé' : '⛔ Numéro désactivé', 'success');
      return true;
    } catch (error) {
      console.error('Erreur toggleCollectNumberStatus:', error);
      this.showToast('❌ Erreur lors du changement de statut', 'danger');
      return false;
    }
  }

  async addCollectNumber(operator: string, phoneNumber: string) {
    try {
      const existing = await this.getCollectNumberByOperator(operator);
      if (existing) {
        this.showToast(`Un numéro existe déjà pour ${operator}`, 'warning');
        return false;
      }

      const { error } = await this.supabaseService.supabase
        .from('collect_numbers')
        .insert({
          operator: operator,
          phone_number: phoneNumber,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      this.showToast('✅ Nouveau numéro ajouté', 'success');
      return true;
    } catch (error) {
      console.error('Erreur addCollectNumber:', error);
      this.showToast('❌ Erreur lors de l\'ajout', 'danger');
      return false;
    }
  }

  async deleteCollectNumber(id: string) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('collect_numbers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.showToast('🗑️ Numéro supprimé', 'success');
      return true;
    } catch (error) {
      console.error('Erreur deleteCollectNumber:', error);
      this.showToast('❌ Erreur lors de la suppression', 'danger');
      return false;
    }
  }

  // ==================== TOAST ====================

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