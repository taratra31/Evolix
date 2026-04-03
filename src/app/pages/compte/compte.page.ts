import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  walletOutline, arrowBackOutline, logoWhatsapp, 
  chevronForwardOutline, arrowDownCircleOutline, 
  arrowUpCircleOutline, logOutOutline 
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
  transactions: any[] = []; // 🔥 ADD

  constructor(
    private modalCtrl: ModalController,
    private compteService: CompteService,
    private transactionService: TransactionService,
    private router: Router
  ) {
    addIcons({ 
      walletOutline, arrowBackOutline, logoWhatsapp, 
      chevronForwardOutline, arrowDownCircleOutline, 
      arrowUpCircleOutline, logOutOutline 
    });
  }

  async loadUser() {
    this.user = await this.compteService.getUserProfile();
  }

  async loadTransactions() {
    this.transactions = await this.transactionService.getLastTransactions();
  }

  ngOnInit() {
    this.compteService.user$.subscribe(user => {
      this.user = user;
    });

    this.loadUser();
    this.loadTransactions();

    setInterval(() => {
      this.loadUser();
      this.loadTransactions();
    }, 3000);

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
  logout() {
    this.compteService.logout();
    this.router.navigateByUrl('/login');
  }
}