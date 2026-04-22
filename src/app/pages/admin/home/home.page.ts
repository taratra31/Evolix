import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, swapHorizontalOutline, newspaperOutline, 
  cashOutline, shieldCheckmarkOutline, logOutOutline,
  personCircleOutline, receiptOutline, megaphoneOutline,
  arrowDownOutline, arrowUpOutline, peopleCircleOutline,callOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonIcon]
})
export class HomePage implements OnInit {

  totalUsers: number = 0;
  totalTransactions: number = 0;
  totalPublications: number = 0;
  totalVolume: number = 0;
  
  recentTransactions: any[] = [];
  recentUsers: any[] = [];

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      peopleOutline, swapHorizontalOutline, newspaperOutline,
      cashOutline, shieldCheckmarkOutline, logOutOutline,
      personCircleOutline, receiptOutline, megaphoneOutline,
      arrowDownOutline, arrowUpOutline, peopleCircleOutline,callOutline,
      arrowBackOutline
    });
  }

  async ngOnInit() {
    await this.loadStats();
    await this.loadRecentTransactions();
    await this.loadRecentUsers();
  }

  async loadStats() {
    try {
      // Total users
      const { count: usersCount } = await this.supabaseService.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      this.totalUsers = usersCount || 0;

      // Total transactions
      const { count: transCount } = await this.supabaseService.supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      this.totalTransactions = transCount || 0;

      // Total publications
      const { count: pubCount } = await this.supabaseService.supabase
        .from('publications')
        .select('*', { count: 'exact', head: true });
      this.totalPublications = pubCount || 0;

      // 🔥 TOTAL VOLUME = fitambaran'ny vola rehetra (depot + retrait acceptés)
      const { data: volumeData } = await this.supabaseService.supabase
        .from('transactions')
        .select('montant, type, status')
        .eq('status', 'accepted');

      if (volumeData && volumeData.length > 0) {
        // Total des dépôts acceptés + total des retraits acceptés
        const totalDepots = volumeData
          .filter(t => t.type === 'depot')
          .reduce((sum, t) => sum + (t.montant || 0), 0);
        
        const totalRetraits = volumeData
          .filter(t => t.type === 'retrait')
          .reduce((sum, t) => sum + (t.montant || 0), 0);
        
        // Volume total = somme des dépôts + somme des retraits
        this.totalVolume = totalDepots + totalRetraits;
      } else {
        this.totalVolume = 0;
      }
      
      console.log('📊 Volume total:', this.totalVolume, 'CDF');
      
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async loadRecentTransactions() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('transactions')
        .select('*, users(phone)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && !error) {
        this.recentTransactions = data.map(t => ({
          ...t,
          user_name: t.users?.['phone'] || 'Inconnu'
        }));
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  }

  async loadRecentUsers() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && !error) {
        this.recentUsers = data;
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  goBackToCompte() {
    this.router.navigate(['/tabs/compte']);
  }

  goTo(page: string) {
    switch(page) {
      case 'utilisateur':
        this.router.navigate(['/utilisateur']);
        break;
      case 'transactions':
        this.router.navigate(['/transactions']);
        break;
      case 'publications':
        this.router.navigate(['/publications']);
        break;
        case 'number':  // 🔥 AMPIO IZY IZY
      this.router.navigate(['/number']);
      break
      default:
        this.router.navigate([`/${page}`]);
    }
  }

  async logout() {
    localStorage.clear();
    this.router.navigateByUrl('/login');
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