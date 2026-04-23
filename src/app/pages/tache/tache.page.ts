import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  ToastController,
  ActionSheetController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  logoFacebook, logoTiktok, logoYoutube,
  checkmarkCircleOutline, timeOutline, linkOutline,
  imageOutline, starOutline, helpCircleOutline,
  calendarOutline, walletOutline, diamondOutline,
  giftOutline, checkmarkCircle, informationCircleOutline } from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase/supabase.service';
import { TacheService } from '../../services/tache/tache.service';

@Component({
  selector: 'app-tache',
  templateUrl: './tache.page.html',
  styleUrls: ['./tache.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon]
})
export class TachePage implements OnInit {

  userId: string = '';
  userVIP: number = 0;
  dailyBonus: number = 0;
  tasks: any[] = [];
  hasCheckedIn = false;
  isLoading = true;
  hasCollectedInitialBonus: boolean = false;

  constructor(
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private supabaseService: SupabaseService,
    private tacheService: TacheService,
    public router: Router
  ) {
    addIcons({informationCircleOutline,logoFacebook,logoYoutube,logoTiktok,checkmarkCircleOutline,timeOutline,linkOutline,imageOutline,starOutline,helpCircleOutline,calendarOutline,walletOutline,diamondOutline,giftOutline,checkmarkCircle});
  }

  async ngOnInit() {
    await this.loadUser();
  }

  async loadUser() {
    this.isLoading = true;
    
    let userId = localStorage.getItem('userId') ?? '';
    let phone = localStorage.getItem('userPhone') ?? '';
    
    if (!phone && !userId) {
      console.error('Tsy misy user tao localStorage');
      this.showToast('Tsy voa connect ny mpampiasa', 'danger');
      this.isLoading = false;
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    try {
      let query = this.supabaseService.supabase
        .from('users')
        .select('id, vip_level, solde, phone');
      
      if (userId && userId !== 'null' && userId !== 'undefined' && userId !== '') {
        query = query.eq('id', userId);
      } else if (phone && phone !== 'null' && phone !== 'undefined' && phone !== '') {
        query = query.eq('phone', phone);
      } else {
        throw new Error('Tsy misy information momba ny mpampiasa');
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        this.showToast('Erreur de connexion', 'danger');
        this.isLoading = false;
        return;
      }

      if (!data) {
        console.error('User tsy hita');
        this.showToast('Utilisateur introuvable', 'danger');
        this.isLoading = false;
        return;
      }

      this.userId = data.id;
      this.userVIP = data.vip_level ?? 0;
      
      localStorage.setItem('userId', this.userId);
      localStorage.setItem('userPhone', data.phone ?? '');
      localStorage.setItem('userVIP', String(this.userVIP));
      localStorage.setItem('userSolde', String(data.solde ?? 0));

      this.dailyBonus = this.getDailyBonus(this.userVIP);
      this.generateTasks(this.userVIP);
      
      // 🔥 Jereo raha efa nahazo bonus (VIP 0 dia indray mandeha ihany)
      this.hasCollectedInitialBonus = await this.hasClaimedAnyBonus();
      
      if (this.userVIP === 0) {
        if (!this.hasCollectedInitialBonus) {
          this.dailyBonus = 500; // Bonus tokana
        } else {
          this.dailyBonus = 0;
        }
        this.hasCheckedIn = this.hasCollectedInitialBonus;
      } else {
        this.hasCheckedIn = await this.hasClaimedToday();
      }
      
      console.log('User loaded:', {
        vip_level: this.userVIP,
        bonus: this.dailyBonus,
        hasCheckedIn: this.hasCheckedIn,
        hasCollectedInitialBonus: this.hasCollectedInitialBonus
      });
      
    } catch (err: any) {
      console.error('Error:', err);
      this.showToast('Erreur: ' + (err.message || 'Inconnu'), 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // 🔥 Bonus araka ny VIP
  getDailyBonus(vip: number): number {
    if (vip === 0) {
      return 0;
    }
    
    const bonuses: Record<number, number> = {
      1: 700,
      2: 3000,
      3: 8700,
      4: 21000,
      5: 30000,
      6: 46000
    };
    return bonuses[vip] ?? 0;
  }

  // 🔥 Jereo raha efa nahazo bonus (na inona na inona)
  async hasClaimedAnyBonus(): Promise<boolean> {
    if (!this.userId) return false;

    const { data, error } = await this.supabaseService.supabase
      .from('daily_bonus')
      .select('id')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking bonus:', error);
      return false;
    }

    return !!data;
  }

  // 🔥 Jereo raha efa nahazo bonus anio (ho an'ny VIP > 0)
  async hasClaimedToday(): Promise<boolean> {
    if (!this.userId) return false;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabaseService.supabase
      .from('daily_bonus')
      .select('id')
      .eq('user_id', this.userId)
      .eq('claimed_date', today)
      .maybeSingle();

    if (error) {
      console.error('Error checking daily bonus:', error);
      return false;
    }

    return !!data;
  }

  getDailyRevenue(vip: number): number {
    return this.getDailyBonus(vip);
  }

  generateTasks(vip: number) {
    if (vip <= 0) {
      this.tasks = [{
        id: 0,
        title: 'VIP requis',
        price: 0,
        status: 'locked',
        logo: 'help-circle-outline',
        desc: 'Devenez VIP pour débloquer les tâches',
        color: '#888888',
        category: 'Premium'
      }];
      return;
    }

    const revenue = this.getDailyRevenue(vip);
    const price = Math.floor(revenue / 3);

    // this.tasks = [
    //   { 
    //     id: 1, 
    //     title: 'YouTube', 
    //     price, 
    //     status: 'available', 
    //     logo: 'logo-youtube',
    //     desc: 'Abonnez-vous et likez',
    //     color: '#FF0000',
    //     category: 'Social'
    //   },
    //   { 
    //     id: 2, 
    //     title: 'TikTok', 
    //     price, 
    //     status: 'available', 
    //     logo: 'logo-tiktok',
    //     desc: 'Suivez et likez',
    //     color: '#000000',
    //     category: 'Social'
    //   },
    //   { 
    //     id: 3, 
    //     title: 'Facebook', 
    //     price, 
    //     status: 'available', 
    //     logo: 'logo-facebook',
    //     desc: 'Rejoignez le groupe',
    //     color: '#1877F2',
    //     category: 'Social'
    //   }
    // ];
  }

  // ================= CHECK-IN =================
  async checkIn() {
    console.log('checkIn() - userId:', this.userId, 'VIP:', this.userVIP);

    if (!this.userId) {
      await this.loadUser();
      if (!this.userId) {
        this.showToast('Erreur: Non connecté', 'danger');
        return;
      }
    }

    // VIP 0: bonus tokana 500 FC
    if (this.userVIP === 0) {
      if (this.hasCollectedInitialBonus) {
        this.showToast('Bonus unique déjà récupéré! Devenez VIP pour plus.', 'warning');
        return;
      }
      
      await this.claimInitialBonus();
      return;
    }

    // VIP > 0: bonus isan'andro
    const already = await this.hasClaimedToday();

    if (already) {
      this.showToast('Déjà récupéré aujourd\'hui', 'warning');
      return;
    }

    try {
      const { data: userData, error: fetchError } = await this.supabaseService.supabase
        .from('users')
        .select('solde')
        .eq('id', this.userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const current = userData?.solde ?? 0;
      const newSolde = current + this.dailyBonus;

      await this.tacheService.claimDailyBonus(this.userId, this.dailyBonus);

      const { error: updateError } = await this.supabaseService.supabase
        .from('users')
        .update({ solde: newSolde })
        .eq('id', this.userId);

      if (updateError) throw updateError;

      this.hasCheckedIn = true;
      this.showToast(`+${this.dailyBonus} CDF reçu!`, 'success');
      localStorage.setItem('userSolde', String(newSolde));

    } catch (err: any) {
      console.error('Error in checkIn:', err);
      this.showToast(err?.message || 'Erreur', 'danger');
    }
  }

  // 🔥 Bonus tokana ho an'ny VIP 0 (500 FC)
  async claimInitialBonus() {
    try {
      const { data: userData, error: fetchError } = await this.supabaseService.supabase
        .from('users')
        .select('solde')
        .eq('id', this.userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const current = userData?.solde ?? 0;
      const newSolde = current + 500;

      // 🔥 Tsy misy bonus_type, tsy misy problème!
      const { error: insertError } = await this.supabaseService.supabase
        .from('daily_bonus')
        .insert({
          user_id: this.userId,
          amount: 500,
          claimed_date: new Date().toISOString().split('T')[0]
        });

      if (insertError) throw insertError;

      const { error: updateError } = await this.supabaseService.supabase
        .from('users')
        .update({ solde: newSolde })
        .eq('id', this.userId);

      if (updateError) throw updateError;

      this.hasCheckedIn = true;
      this.hasCollectedInitialBonus = true;
      this.dailyBonus = 0;
      
      this.showToast('+500 CDF reçu! Devenez VIP pour plus de bonus!', 'success');
      localStorage.setItem('userSolde', String(newSolde));

    } catch (err: any) {
      console.error('Error claiming initial bonus:', err);
      this.showToast(err?.message || 'Erreur lors du bonus', 'danger');
    }
  }

  // ================= TASK =================
  async claim(task: any) {
    if (!this.userId) {
      await this.loadUser();
      if (!this.userId) {
        this.showToast('Erreur: Non connecté', 'danger');
        return;
      }
    }

    if (this.userVIP === 0) {
      this.showToast('Devenez VIP pour débloquer les tâches!', 'warning');
      return;
    }

    if (task.status !== 'available') {
      this.showToast('Tâche non disponible', 'warning');
      return;
    }

    const action = await this.actionSheetCtrl.create({
      header: task.title,
      subHeader: `Gain: ${task.price} CDF`,
      buttons: [
        {
          text: 'Ouvrir le lien',
          handler: () => {
            window.open('https://google.com', '_blank');
          }
        },
        {
          text: 'Valider la tâche',
          handler: async () => {
            try {
              await this.tacheService.saveCompletedTask(this.userId, task);
              task.status = 'pending';
              this.showToast('Tâche envoyée pour validation', 'success');
            } catch (err: any) {
              this.showToast(err.message || 'Erreur', 'danger');
            }
          }
        },
        { text: 'Annuler', role: 'cancel' }
      ]
    });

    await action.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}