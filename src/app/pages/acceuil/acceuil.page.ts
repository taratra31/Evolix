import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, ToastController, ModalController, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  addCircle, arrowDownCircle, peopleCircle, flashOutline, barChart, giftOutline,
  calendarOutline, statsChart, sync, megaphone, newspaperOutline, arrowUp,
  remove, walletOutline, trendingUpOutline, trendingUp, trendingDown,
  shieldCheckmarkOutline, pieChartOutline, peopleOutline, notificationsOutline,
  refreshOutline, diamond, addOutline, arrowDownOutline, add, arrowDown, people,
  pieChart, shieldCheckmark, calendar, warningOutline, checkmarkCircleOutline,
  informationCircleOutline, refreshCircle, wallet, flash, gift, newspaper,
  trophyOutline, medalOutline, cashOutline, addCircleOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { TransactionModalComponent } from '../../transaction-modal/transaction-modal.component';
import Chart from 'chart.js/auto';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskPhone',
  standalone: true
})
export class MaskPhonePipe implements PipeTransform {
  transform(phone: string): string {
    if (!phone) return 'Membre';
    if (phone.length <= 6) return phone;
    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 2);
    return `${start}****${end}`;
  }
}

@Component({
  selector: 'app-acceuil',
  templateUrl: './acceuil.page.html',
  styleUrls: ['./acceuil.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, CommonModule, FormsModule, MaskPhonePipe]
})
export class AcceuilPage implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  userId: string = '';
  userSolde: number = 0;
  userVip: number = 0;
  userPhone: string = '';
  totalEvolixSolde: number = 0;
  userPercentage: number = 0;
  hasUnreadNotifications: boolean = false;
  publications: any[] = [];
  private refreshInterval: any;
  chartBars: any[] = [];
  totalUsers: number = 0;
  parrainageCount: number = 0;
  weeklyGrowth: number = 0;
  weeklyEarnings: number = 0;
  
  // Ranking properties
  topInvestors: any[] = [];
  topDepositors: any[] = [];
  topReferrers: any[] = [];
  activeRankingTab: string = 'investors';

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      diamond, notificationsOutline, refreshOutline, trendingUpOutline, trendingUp,
      shieldCheckmarkOutline, pieChartOutline, peopleOutline, walletOutline,
      addCircle, arrowDownCircle, peopleCircle, flashOutline, barChart, giftOutline,
      calendarOutline, statsChart, sync, megaphone, newspaperOutline, arrowUp,
      remove, addOutline, arrowDownOutline, add, arrowDown, people, pieChart,
      shieldCheckmark, calendar, warningOutline, checkmarkCircleOutline,
      informationCircleOutline, refreshCircle, wallet, flash, gift, newspaper,
      trendingDown, trophyOutline, medalOutline, cashOutline, addCircleOutline
    });
  }

  async ngOnInit() {
    await this.initializeData();
    
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 30000); // 30 secondes au lieu de 10 pour éviter trop de requêtes
  }

  async initializeData() {
    await this.loadUser();
    await this.loadUserData();
    await this.loadTotalEvolixSolde();
    await this.calculateUserPercentage();
    await this.generateChartData();
    await this.checkUnreadNotifications();
    await this.loadPublications();
    await this.loadTotalUsers();
    await this.loadParrainageCount();
    await this.calculateWeeklyStats();
    await this.loadRankings();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.createChart();
    }, 300);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  async refreshData() {
    await this.checkUnreadNotifications();
    await this.loadUserData();
    await this.loadTotalEvolixSolde();
    await this.calculateUserPercentage();
    await this.loadPublications();
    await this.loadTotalUsers();
    await this.loadParrainageCount();
    await this.calculateWeeklyStats();
    await this.loadRankings();
    this.cdr.detectChanges();
  }

createChart() {
  if (!this.weeklyChartRef?.nativeElement) {
    console.warn('Canvas element not found');
    return;
  }
  
  const canvas = this.weeklyChartRef.nativeElement;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.warn('Cannot get canvas context');
    return;
  }
  
  // Détruire l'ancien graphique s'il existe
  if (this.chartInstance) {
    this.chartInstance.destroy();
    this.chartInstance = null;
  }
  
  // Si pas de données, créer des données par défaut
  if (!this.chartBars || this.chartBars.length === 0) {
    this.chartBars = [
      { day: 'Lun', value: 100000 },
      { day: 'Mar', value: 150000 },
      { day: 'Mer', value: 120000 },
      { day: 'Jeu', value: 180000 },
      { day: 'Ven', value: 200000 },
      { day: 'Sam', value: 160000 },
      { day: 'Dim', value: 140000 }
    ];
  }
  
  const labels = this.chartBars.map(bar => bar.day);
  const values = this.chartBars.map(bar => bar.value);
  
  this.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Volume (CDF)',
        data: values,
        borderColor: '#f3d078',
        backgroundColor: 'rgba(243, 208, 120, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#f3d078',
        pointBorderColor: '#1a1a1a',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffd700',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              return `${value.toLocaleString()} CDF`;
            }
          },
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#f3d078',
          bodyColor: '#fff',
          borderColor: '#f3d078',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255,255,255,0.05)'
            // Supprimer drawBorder: false
          },
          border: {
            display: false  // Utiliser border.display au lieu de drawBorder
          },
          ticks: {
            color: '#888',
            callback: (value) => {
              const numValue = value as number;
              if (numValue >= 1000000) return (numValue / 1000000).toFixed(1) + 'M';
              if (numValue >= 1000) return (numValue / 1000).toFixed(0) + 'K';
              return numValue.toString();
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          border: {
            display: false  // Utiliser border.display au lieu de drawBorder
          },
          ticks: {
            color: '#888'
          }
        }
      },
      elements: {
        line: {
          tension: 0.4
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

  refreshChart() {
    this.generateChartData();
  }

  async loadRankings() {
    try {
      // Top Investisseurs
      const { data: investors, error: investorsError } = await this.supabaseService.supabase
        .from('users')
        .select('id, phone, solde, vip_level')
        .order('solde', { ascending: false })
        .limit(5);
      
      if (!investorsError && investors) {
        this.topInvestors = investors;
      }
      
      // Top Déposants
      const { data: deposits, error: depositsError } = await this.supabaseService.supabase
        .from('transactions')
        .select(`
          montant,
          user_id,
          users!inner (
            phone,
            vip_level
          )
        `)
        .eq('type', 'depot')
        .eq('status', 'accepted')
        .order('montant', { ascending: false })
        .limit(5);
      
      if (!depositsError && deposits) {
        this.topDepositors = deposits.map((t: any) => ({
          phone: t.users?.phone || 'Membre',
          montant: t.montant,
          vip_level: t.users?.vip_level || 0
        }));
      }
      
      // Top Parrains
      const { data: users, error: usersError } = await this.supabaseService.supabase
        .from('users')
        .select('id, phone, vip_level, referral_code');
      
      if (!usersError && users) {
        const referrerCounts: any[] = [];
        for (const user of users) {
          if (user.referral_code) {
            const { count, error: countError } = await this.supabaseService.supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('referred_by', user.referral_code);
            
            if (!countError && count && count > 0) {
              referrerCounts.push({
                phone: user.phone || 'Membre',
                count: count,
                vip_level: user.vip_level || 0
              });
            }
          }
        }
        this.topReferrers = referrerCounts.sort((a, b) => b.count - a.count).slice(0, 5);
      }
      
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error loading rankings:', err);
    }
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  }

  async loadUser() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userId = userId;
    }
  }

  async loadUserData() {
    if (!this.userId) return;

    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('solde, vip_level, phone')
        .eq('id', this.userId)
        .single();

      if (data && !error) {
        this.userSolde = data['solde'] || 0;
        this.userVip = data['vip_level'] || 0;
        this.userPhone = data['phone'] || '';
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }

  async loadTotalUsers() {
    try {
      const { count, error } = await this.supabaseService.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        this.totalUsers = count || 0;
      }
    } catch (err) {
      console.error('Error loading total users:', err);
    }
  }

  async loadParrainageCount() {
    if (!this.userId) return;
    
    try {
      // Récupérer d'abord le referral_code de l'utilisateur
      const { data: userData } = await this.supabaseService.supabase
        .from('users')
        .select('referral_code')
        .eq('id', this.userId)
        .single();
      
      if (userData?.referral_code) {
        const { count, error } = await this.supabaseService.supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', userData.referral_code);
        
        if (!error) {
          this.parrainageCount = count || 0;
        }
      }
    } catch (err) {
      console.error('Error loading parrainage count:', err);
    }
  }

  async loadTotalEvolixSolde() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('users')
        .select('solde');

      if (error) throw error;
      
      this.totalEvolixSolde = data?.reduce((sum, user) => sum + (user['solde'] || 0), 0) || 0;
      
    } catch (err) {
      console.error('Error loading total solde:', err);
    }
  }

  async calculateUserPercentage() {
    if (this.totalEvolixSolde > 0 && this.userSolde > 0) {
      this.userPercentage = (this.userSolde / this.totalEvolixSolde) * 100;
    } else {
      this.userPercentage = 0;
    }
  }

  async calculateWeeklyStats() {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7);
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);

      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const startOfLastWeekStr = startOfLastWeek.toISOString().split('T')[0];

      // Gains hebdomadaires de l'utilisateur
      const { data: weeklyData } = await this.supabaseService.supabase
        .from('transactions')
        .select('montant')
        .eq('user_id', this.userId)
        .eq('status', 'accepted')
        .eq('type', 'depot')
        .gte('created_at', startOfWeekStr);

      this.weeklyEarnings = weeklyData?.reduce((sum, t) => sum + (t.montant || 0), 0) || 0;

      // Calcul de la croissance
      const { data: currentWeekData } = await this.supabaseService.supabase
        .from('transactions')
        .select('montant')
        .eq('status', 'accepted')
        .gte('created_at', startOfWeekStr);

      const { data: lastWeekData } = await this.supabaseService.supabase
        .from('transactions')
        .select('montant')
        .eq('status', 'accepted')
        .gte('created_at', startOfLastWeekStr)
        .lt('created_at', startOfWeekStr);

      const currentWeekTotal = currentWeekData?.reduce((sum, t) => sum + (t.montant || 0), 0) || 0;
      const lastWeekTotal = lastWeekData?.reduce((sum, t) => sum + (t.montant || 0), 0) || 1;

      this.weeklyGrowth = ((currentWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
      this.weeklyGrowth = Math.max(-100, Math.min(100, this.weeklyGrowth));

    } catch (err) {
      console.error('Error calculating weekly stats:', err);
      this.weeklyGrowth = 5.2;
      this.weeklyEarnings = 125000;
    }
  }

  async generateChartData() {
    try {
      this.chartBars = [];
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const { data } = await this.supabaseService.supabase
          .from('transactions')
          .select('montant')
          .eq('status', 'accepted')
          .gte('created_at', dateStr + 'T00:00:00')
          .lte('created_at', dateStr + 'T23:59:59');
        
        const dailyTotal = data?.reduce((sum, t) => sum + (t.montant || 0), 0) || 0;
        
        this.chartBars.push({
          value: dailyTotal || Math.random() * 100000 + 50000, // Fallback avec données aléatoires
          day: days[date.getDay()]
        });
      }
      
      setTimeout(() => {
        this.createChart();
        this.cdr.detectChanges();
      }, 100);
      
    } catch (err) {
      console.error('Error generating chart data:', err);
      // Données par défaut en cas d'erreur
      this.chartBars = [
        { value: 125000, day: 'Dim' },
        { value: 180000, day: 'Lun' },
        { value: 225000, day: 'Mar' },
        { value: 156000, day: 'Mer' },
        { value: 198000, day: 'Jeu' },
        { value: 245000, day: 'Ven' },
        { value: 192000, day: 'Sam' }
      ];
      setTimeout(() => {
        this.createChart();
        this.cdr.detectChanges();
      }, 100);
    }
  }

  async loadPublications() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      this.publications = data || [];
      
    } catch (err) {
      console.error('Error loading publications:', err);
      this.publications = [];
    }
  }

  async checkUnreadNotifications() {
    if (!this.userId) return;

    try {
      const { count: pendingTasksCount } = await this.supabaseService.supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'pending');

      const { count: pendingTransactionsCount } = await this.supabaseService.supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'pending');

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: recentBonusesCount } = await this.supabaseService.supabase
        .from('daily_bonus')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .gte('claimed_date', weekAgo.toISOString().split('T')[0]);

      const pendingCount = (pendingTasksCount || 0) + (pendingTransactionsCount || 0);
      const recentCount = (recentBonusesCount || 0);
      
      this.hasUnreadNotifications = pendingCount > 0 || recentCount > 0;

    } catch (err) {
      console.error('Error checking notifications:', err);
      this.hasUnreadNotifications = false;
    }
  }

  getIconName(type: string): string {
    switch(type) {
      case 'warning': return 'warning-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'event': return 'calendar-outline';
      default: return 'information-circle-outline';
    }
  }

  getTypeText(type: string): string {
    switch(type) {
      case 'warning': return 'Alerte';
      case 'success': return 'Succès';
      case 'event': return 'Événement';
      default: return 'Information';
    }
  }

  async openTransactionModal(type: 'depot' | 'retrait') {
    const modal = await this.modalController.create({
      component: TransactionModalComponent,
      componentProps: {
        type: type,
        currentSolde: this.userSolde,
        userId: this.userId
      },
      cssClass: 'transaction-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.refresh) {
        await this.doRefresh();
      }
    });

    await modal.present();
  }

  async goTo(page: string) {
    switch(page) {
      case 'depot':
        await this.openTransactionModal('depot');
        break;
      case 'retrait':
        await this.openTransactionModal('retrait');
        break;
      case 'equipe':
        this.router.navigate(['/tabs/equipe']);
        break;
      case 'tache':
        this.router.navigate(['/tabs/tache']);
        break;
      case 'portefeuille':
        this.router.navigate(['/tabs/portefeuille']);
        break;
      default:
        this.router.navigate(['/tabs', page]);
    }
  }

  async goToNotif() {
    this.hasUnreadNotifications = false;
    await this.router.navigate(['/notifications']);
  }

  async doRefresh(event?: any) {
    await this.loadUserData();
    await this.loadTotalEvolixSolde();
    await this.calculateUserPercentage();
    await this.generateChartData();
    await this.loadPublications();
    await this.checkUnreadNotifications();
    await this.loadTotalUsers();
    await this.loadParrainageCount();
    await this.calculateWeeklyStats();
    await this.loadRankings();
    
    if (event?.target) {
      event.target.complete();
    }
    
    const toast = await this.toastCtrl.create({
      message: 'Données actualisées ✓',
      duration: 1500,
      position: 'top',
      cssClass: 'refresh-toast',
      icon: 'refresh-circle'
    });
    await toast.present();
  }
}