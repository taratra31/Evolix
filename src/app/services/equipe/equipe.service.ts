import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable({
  providedIn: 'root',
})
export class EquipeService {

  constructor(
    private supabaseService: SupabaseService,
    private notifService: NotificationsService
  ) {}

  generateReferralLink(code: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/signin?ref=${code}`;
  }

  async buyVIP(userId: string, amount: number, newVipLevel: number) {
    try {
      // 🔥 Vérifier si l'utilisateur a déjà ce niveau VIP
      const { data: user, error: userError } = await this.supabaseService.supabase
        .from('users')
        .select('solde, vip_level, referred_by')
        .eq('id', userId)
        .single();

      if (userError || !user) throw new Error('Utilisateur non trouvé');

      // 🔥 Raha efa manana VIP level ambony kokoa na mitovy dia tsy avela
      if (user.vip_level >= newVipLevel) {
        throw new Error('Vous avez déjà un niveau VIP supérieur ou égal');
      }

      if (user.solde < amount) {
        throw new Error('Solde insuffisant');
      }

      const newSolde = user.solde - amount;

      const { error: updateError } = await this.supabaseService.supabase
        .from('users')
        .update({
          vip_level: newVipLevel,
          solde: newSolde
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 🔥 Commission ho an'ny parrain (100 FC raikitra)
      if (user.referred_by) {
        await this.giveCommissionToParrain(user.referred_by, newVipLevel);
      }

      await this.supabaseService.supabase
        .from('vip_upgrades')
        .insert({
          user_id: userId,
          old_level: user.vip_level,
          new_level: newVipLevel,
          amount: amount,
          created_at: new Date().toISOString()
        });

      return true;

    } catch (error) {
      throw error;
    }
  }

  async giveCommissionToParrain(referralCode: string, vipLevel: number) {
    try {
      const { data: parrain, error: parrainError } = await this.supabaseService.supabase
        .from('users')
        .select('id, solde, total_commission')
        .eq('referral_code', referralCode)
        .single();

      if (parrainError || !parrain) {
        return;
      }

      // 🔥 100 FC raikitra ho an'ny parrain
      const commission = 100;
      
      const newSolde = (parrain.solde || 0) + commission;
      const newTotalCommission = (parrain.total_commission || 0) + commission;

      const { error: updateError } = await this.supabaseService.supabase
        .from('users')
        .update({
          solde: newSolde,
          total_commission: newTotalCommission
        })
        .eq('id', parrain.id);

      if (updateError) throw updateError;

      if (this.notifService) {
        await this.notifService.createNotification({
          user_id: parrain.id,
          title: '💰 Commission de parrainage',
          message: `Vous avez reçu ${commission.toLocaleString()} CDF de commission car votre filleul a activé le niveau VIP ${vipLevel}!`,
          type: 'success',
          read: false,
          data: { commission, vipLevel }
        });
      }

    } catch (error) {
      // Silent error
    }
  }

  async getTotalCommission(userId: string): Promise<number> {
    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('total_commission')
      .eq('id', userId)
      .single();

    if (error) return 0;
    return data?.total_commission || 0;
  }

  async getTotalInvitations(referralCode: string): Promise<number> {
    const { count, error } = await this.supabaseService.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', referralCode);

    if (error) return 0;
    return count || 0;
  }

  async getUserVipLevel(userId: string): Promise<number> {
    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('vip_level')
      .eq('id', userId)
      .single();

    if (error) return 0;
    return data?.vip_level || 0;
  }
}