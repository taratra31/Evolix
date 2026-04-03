import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, ToastController, ActionSheetController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logoFacebook, logoTiktok, logoYoutube, 
  checkmarkCircleOutline, timeOutline, linkOutline, 
  imageOutline, starOutline, helpCircleOutline, 
  calendarOutline, walletOutline, diamondOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase/supabase.service'; // Amboary ny path

@Component({
  selector: 'app-tache',
  templateUrl: './tache.page.html',
  styleUrls: ['./tache.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon]
})
export class TachePage implements OnInit {

  userVIP: number = 0;
  dailyBonus: number = 0;
  tasks: any[] = [];
  hasCheckedIn = false;

  constructor(
    private toastCtrl: ToastController, 
    private actionSheetCtrl: ActionSheetController,
    private supabaseService: SupabaseService
  ) {
    addIcons({ 
      logoFacebook, logoYoutube, logoTiktok, 
      checkmarkCircleOutline, timeOutline, linkOutline, 
      imageOutline, starOutline, helpCircleOutline,
      calendarOutline, walletOutline, diamondOutline
    });
  }

  async ngOnInit() {
    await this.loadUserData();
  }

  async loadUserData() {
    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone) return;

    // 1. Alao ny VIP level avy ao amin'ny table 'users'
    const { data: user, error } = await this.supabaseService.supabase
      .from('users')
      .select('vip, solde')
      .eq('phone', userPhone)
      .single();

    if (user) {
      this.userVIP = user.vip || 0;
      this.generateTasksByVIP(this.userVIP);
      // Ny bonus isan'andro dia ohatra 10% amin'ny revenu journalier
      this.dailyBonus = this.calculateDailyRevenue(this.userVIP) * 0.1; 
    }
  }

  // 2. Kajio ny revenu journalier araka ny sary "PLAN VIP"
  calculateDailyRevenue(vip: number): number {
    const revenues: { [key: number]: number } = {
      0: 0,
      1: 700,
      2: 3000,
      3: 8700,
      4: 21000,
      5: 30000,
      6: 46000
    };
    return revenues[vip] || 0;
  }

  // 3. Mamorona tâche mifanaraka amin'ny VIP
  generateTasksByVIP(vip: number) {
    const dailyIncome = this.calculateDailyRevenue(vip);
    
    // Zaraina ho tâche 3 ny revenu journalier mba ho "pro"
    const pricePerTask = Math.floor(dailyIncome / 3);

    if (vip === 0) {
      this.tasks = [{ title: 'VIP Requis', desc: 'Activez un pack VIP pour voir les tâches', price: 0, status: 'locked', logo: 'diamond-outline' }];
      return;
    }

    this.tasks = [
      { id: 1, category: 'YOUTUBE VIP', title: 'Mission Vidéo 1', desc: 'Regarder et Liker', price: pricePerTask, logo: 'logo-youtube', type: 'yt', status: 'available', color: '#FF0000' },
      { id: 2, category: 'TIKTOK VIP', title: 'Mission Follow', desc: 'S\'abonner au compte', price: pricePerTask, logo: 'logo-tiktok', type: 'tk', status: 'available', color: '#00f2ea' },
      { id: 3, category: 'FACEBOOK VIP', title: 'Mission Partage', desc: 'Partager dans un groupe', price: pricePerTask, logo: 'logo-facebook', type: 'fb', status: 'available', color: '#1877F2' }
    ];
  }

  async checkIn() {
    if (this.userVIP === 0) {
      this.showToast('Veuillez activer un pack VIP pour le bonus', 'danger');
      return;
    }
    if (this.hasCheckedIn) return;

    this.hasCheckedIn = true;
    this.showToast(`Bonus +${this.dailyBonus} CDF récupéré !`, 'success');
  }

  async claim(task: any) {
    if (task.status !== 'available') return;

    const actionSheet = await this.actionSheetCtrl.create({
      header: `Mission VIP ${this.userVIP}`,
      subHeader: `Gain: ${task.price} CDF`,
      buttons: [
        { text: 'Ouvrir le lien', icon: 'link-outline', handler: () => { window.open('https://google.com', '_blank'); } },
        { text: 'Screenshot de preuve', icon: 'image-outline', handler: () => this.uploadScreenshot(task) },
        { text: 'Annuler', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async uploadScreenshot(task: any) {
    task.status = 'pending';
    this.showToast('Preuve envoyée à l\'admin', 'warning');
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color: color, position: 'top' });
    toast.present();
  }
}