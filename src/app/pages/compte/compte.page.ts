import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
walletOutline, arrowBackOutline, logoWhatsapp, 
  chevronForwardOutline, arrowDownCircleOutline, 
  arrowUpCircleOutline, logOutOutline, 
  shieldOutline, paperPlaneOutline, receiptOutline,
  pieChartOutline, personOutline, arrowDownOutline,
  arrowUpOutline,
  logoYoutube,
  logoFacebook
} from 'ionicons/icons';

import { TransactionModalComponent } from '../../transaction-modal/transaction-modal.component';
import { CompteService } from '../../services/compte/compte.service';
import { TransactionService } from '../../services/transactions/transaction.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compte',
  templateUrl: './compte.page.html',
  styleUrls: ['./compte.page.scss'],  
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonButton, IonIcon]
})
export class ComptePage implements OnInit {

  user: any;
  transactions: any[] = [];
  isAdmin: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private compteService: CompteService,
    private transactionService: TransactionService,
    private toastCtrl: ToastController,
    public router: Router
  ) {
    addIcons({ 
      walletOutline, 
      arrowBackOutline, 
      logoWhatsapp, 
      chevronForwardOutline, 
      arrowDownCircleOutline, 
      arrowUpCircleOutline, 
      logOutOutline,
      shieldOutline,
      paperPlaneOutline,
      receiptOutline,
      pieChartOutline,
      personOutline,
      arrowDownOutline,
      arrowUpOutline,logoYoutube,logoFacebook
    });
  }

  async loadUser() {
    this.user = await this.compteService.getUserProfile();
    
    console.log('🔍 User data:', this.user);
    console.log('📞 User phone:', this.user?.['phone']);
    console.log('👑 User is_admin:', this.user?.['is_admin']);
    console.log('💰 User solde:', this.user?.['solde']);
    console.log('⭐ User vip_level:', this.user?.['vip_level']);
    
    // 🔥 Mampiasa bracket notation
    this.isAdmin = this.user?.['is_admin'] === true;
    
    // console.log('👑 Is Admin final:', this.isAdmin);
    
    // if (this.isAdmin) {
    //   console.log('🛡️ Mode Admin activé pour', this.user?.['phone']);
    //   this.showToast('Mode Admin activé', 'success');
    // }
  }

  async loadTransactions() {
    this.transactions = await this.transactionService.getLastTransactions();
  }

  async ngOnInit() {
    this.compteService.user$.subscribe(user => {
      this.user = user;
      if (user) {
        // 🔥 Mampiasa bracket notation
        this.isAdmin = user['is_admin'] === true;
        console.log('🔄 User updated via subscription, is_admin:', this.isAdmin);
      }
    });

    await this.loadUser();
    await this.loadTransactions();

    // Refresh isaky ny 5 segondra
    setInterval(async () => {
      await this.loadUser();
      await this.loadTransactions();
    }, 5000);

    this.compteService.listenToUserChanges();
  }

  async openModal(type: 'depot' | 'retrait') {
    const modal = await this.modalCtrl.create({
      component: TransactionModalComponent,
      componentProps: { type }
    });
    await modal.present();
  }

  goToHistory(type: 'recharge' | 'retrait') {
    this.router.navigate(['/tabs/historique', type]);
  }

  goToAdmin() {
    console.log('🛡️ Navigation vers Admin Dashboard');
    this.router.navigate(['/home']);
  }

  logout() {
    this.compteService.logout();
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