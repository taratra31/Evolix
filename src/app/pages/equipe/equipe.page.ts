import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  giftOutline, peopleOutline, shareSocialOutline, 
  lockClosedOutline, cashOutline, copyOutline, checkmarkCircle 
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { EquipeService } from '../../services/equipe/equipe.service';

@Component({
  selector: 'app-equipe',
  templateUrl: './equipe.page.html',
  styleUrls: ['./equipe.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon]
})
export class EquipePage implements OnInit {

  vipLevels: any[] = [];
  totalCommission: number = 0;
  totalInvitations: number = 0;
  referralCode: string = '';
  referralLink: string = '';
  userPhone: string = ''; 
  currentVipLvl: number = 0; 
  isCopied: boolean = false;

  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private supabaseService: SupabaseService,
    private equipeService: EquipeService
  ) { 
    addIcons({ 
      giftOutline, peopleOutline, shareSocialOutline, 
      lockClosedOutline, cashOutline, copyOutline, checkmarkCircle 
    });
  }

  ngOnInit() {
    this.getUserData();
    this.generateVIPs();
  }

  async getUserData() {
  this.userPhone = localStorage.getItem('userPhone') || '';
  const userId = localStorage.getItem('userId') || '';
  
  console.log('📱 userPhone from localStorage:', this.userPhone);
  console.log('👤 userId from localStorage:', userId);
  
  if (!this.userPhone && !userId) {
    console.warn('❌ Pas de userPhone ou userId trouvé');
    this.presentToast('Vous devez être connecté', 'danger');
    return;
  }

  try {
    let user = null;
    let error = null;

    // Priorité: utiliser userId (plus fiable)
    if (userId) {
      const result = await this.supabaseService.supabase
        .from('users')
        .select('referral_code, total_commission, phone, id')
        .eq('id', userId);
      
      user = result.data?.[0] || null;
      error = result.error;
      console.log('✅ Recherche par userId');
    } 
    // Sinon essayer avec phone
    else if (this.userPhone) {
      const result = await this.supabaseService.supabase
        .from('users')
        .select('referral_code, total_commission, phone, id')
        .eq('phone', this.userPhone);
      
      user = result.data?.[0] || null;
      error = result.error;
      console.log('✅ Recherche par phone');
    }

    console.log('📊 Données reçues:', { user, error });

    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      this.presentToast('Erreur: ' + error.message, 'danger');
      return;
    }

    if (!user) {
      console.warn('❌ Aucun utilisateur trouvé');
      this.presentToast('Utilisateur non trouvé', 'danger');
      return;
    }

    // Mettre à jour userPhone si on ne l'avait pas
    if (!this.userPhone && user.phone) {
      this.userPhone = user.phone;
      localStorage.setItem('userPhone', this.userPhone);
      console.log('💾 userPhone mis à jour depuis DB:', this.userPhone);
    }

    // ✅ SAFE
    this.referralCode = user.referral_code || '';
    console.log('📌 Referral Code depuis DB:', this.referralCode);

    // 👉 Générer code si vide ET sauvegarder
    if (!this.referralCode) {
      this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.warn('🔄 Génération nouveau code:', this.referralCode);
      
      // 💾 Sauvegarder le code généré en base de données
      const { error: updateError } = await this.supabaseService.supabase
        .from('users')
        .update({ referral_code: this.referralCode })
        .eq('id', user.id || userId);
      
      if (updateError) {
        console.error('❌ Erreur sauvegarde code:', updateError);
      } else {
        console.log('✅ Code sauvegardé:', this.referralCode);
      }
    }

    this.totalCommission = user.total_commission || 0;
    this.currentVipLvl = 0;

    // ✅ Generate lien seulement si code existe
    this.referralLink = this.equipeService.generateReferralLink(this.referralCode);
    console.log('🔗 Lien généré:', this.referralLink);

    if (!this.referralLink) {
      console.error('❌ Lien vide après génération!');
    }

    const { count } = await this.supabaseService.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', this.referralCode);

    this.totalInvitations = count || 0;
    console.log('👥 Total invitations:', this.totalInvitations);
    
  } catch (err: any) {
    console.error('❌ Exception dans getUserData:', err);
    this.presentToast('Erreur: ' + err.message, 'danger');
  }
}

   async copyLink() {
  if (!this.referralLink) {
    this.presentToast("Lien non disponible ❌", "danger");
    return;
  }

  try {
    await navigator.clipboard.writeText(this.referralLink);

    this.isCopied = true;

    setTimeout(() => {
      this.isCopied = false;
    }, 2000);

    this.presentToast("Lien copié !", "success");

  } catch (err) {
    console.error(err);
    this.presentToast("Erreur de copie", "danger");
  }
}
  async shareLink() {
    if (!this.referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins moi sur EVOLIX',
          text: 'Rejoins moi sur EVOLIX et commence à gagner !',
          url: this.referralLink
        });
      } catch (err) { console.error(err); }
    } else {
      this.copyLink();
    }
  }

   async selectVIP(vip: any) {

  // 🔥 CONDITION PAR NIVEAU (membres requis)
  const requiredMap: any = {
    3: 3,
    4: 12,
    5: 30,
    6: 45
  };

  // ✅ Vérification invitation
  if (requiredMap[vip.lvl]) {
    if (this.totalInvitations < requiredMap[vip.lvl]) {
      this.presentToast(
        `Il faut ${requiredMap[vip.lvl]} membres actifs pour débloquer ce VIP`,
        'warning'
      );
      return;
    }
  }

  // ❌ Locked
  if (vip.status === 'locked') {
    this.presentToast(vip.req, 'warning');
    return;
  }

  // ❌ Déjà actif
  if (this.currentVipLvl >= vip.lvl) {
    this.presentToast(`Vous êtes déjà au niveau VIP ${vip.lvl} ou plus.`, 'info');
    return;
  }

  // ✅ Confirmation (logic anao tsy novaina)
  const alert = await this.alertCtrl.create({
    header: `Activer VIP ${vip.lvl}`,
    message: `Voulez-vous investir ${vip.invest} FC pour gagner ${vip.daily} FC par jour ?`,
    cssClass: 'custom-vip-alert',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'CONFIRMER',
        handler: () => { this.processPurchase(vip); }
      }
    ]
  });

  await alert.present();
}

  async processPurchase(vip: any) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.presentToast('Utilisateur non connecté', 'danger');
      return;
    }

    try {
      const amount = Number(vip.invest.replace(/\s/g, ''));
      await this.equipeService.buyVIP(userId, amount, vip.lvl);
      
      this.presentToast(`Félicitations ! VIP ${vip.lvl} activé 🎉`, 'success');
      this.getUserData(); // Refresh data
    } catch (error: any) {
      this.presentToast(error.message || 'Erreur lors de l\'activation', 'danger');
    }
  }

  async presentToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  generateVIPs() {
    this.vipLevels = [
      { lvl: 1, invest: '20 000', daily: '700', monthly: '21 000', req: 'Aucune', status: 'open' },
      { lvl: 2, invest: '90 000', daily: '3 000', monthly: '90 000', req: 'Aucune', status: 'open' },
      { lvl: 3, invest: '260 000', daily: '8 700', monthly: '261 000', req: '3 membres actifs', status: 'open' },
      { lvl: 4, invest: '630 000', daily: '21 000', monthly: '630 000', req: '12 membres actifs', status: 'open' },
      { lvl: 5, invest: '900 000', daily: '30 000', monthly: '900 000', req: '30 membres actifs', status: 'open' },
      { lvl: 6, invest: '1 380 000', daily: '46 000', monthly: '1 380 000', req: '45 membres actifs', status: 'open' },
      { lvl: 7, invest: '1 900 000', daily: '---', monthly: '---', req: 'Verrouillé', status: 'locked' },
      { lvl: 8, invest: '2 400 000', daily: '---', monthly: '---', req: 'Verrouillé', status: 'locked' },
      { lvl: 9, invest: '3 000 000', daily: '---', monthly: '---', req: 'Verrouillé', status: 'locked' },
      { lvl: 10, invest: '4 500 000', daily: '---', monthly: '---', req: 'Verrouillé', status: 'locked' }
    ];
  }
}