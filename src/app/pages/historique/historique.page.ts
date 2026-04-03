import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, NavController, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, arrowDownOutline, arrowUpOutline, 
  timeOutline, receiptOutline 
} from 'ionicons/icons';
import { TransactionService } from '../../services/transactions/transaction.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-historique',
  templateUrl: './historique.page.html',
  styleUrls: ['./historique.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonIcon]
})
export class HistoriquePage implements OnInit {
  transactions: any[] = [];
  type: 'depot' | 'retrait' = 'depot';

  constructor(
    private transactionService: TransactionService,
    private route: ActivatedRoute,
    private navCtrl: NavController
  ) {
    addIcons({ 
      arrowBackOutline, arrowDownOutline, arrowUpOutline, 
      timeOutline, receiptOutline 
    });
  }

  async ngOnInit() {
    const routeType = this.route.snapshot.paramMap.get('type');
    this.type = routeType === 'recharge' ? 'depot' : 'retrait';
    this.loadData();
  }

  // 🔥 AUTO REFRESH rehefa miditra / miverina page
  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    this.transactions = await this.transactionService.getTransactions(this.type);
  }

  // 🔥 RETOUR STABLE
  goToCompte() {
    this.navCtrl.navigateRoot('/tabs/compte'); // ✔️ miasa foana
  }
}