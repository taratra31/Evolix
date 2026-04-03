import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, IonContent, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { copyOutline, checkmarkCircleOutline, cashOutline } from 'ionicons/icons';

import { TransactionService } from '../services/transactions/transaction.service'; // 🔥 add

@Component({
  selector: 'app-transaction-modal',
  templateUrl: './transaction-modal.component.html',
  styleUrls: ['./transaction-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class TransactionModalComponent {
  @Input() type: 'depot' | 'retrait' = 'depot';

  operateur: string = '';
  montant: number | null = null;
  transactionId: string = '';
  userPhone: string = '';

  numeros: Record<string, string> = {
    orange: '0854267738',
    airtel: '0983343571',
    vodacom: '0822443493'
  };

  constructor(
    private modalCtrl: ModalController,
    private transactionService: TransactionService // 🔥 add
  ) {
    addIcons({ copyOutline, checkmarkCircleOutline, cashOutline });
  }

  selectOperateur(op: string) { this.operateur = op; }
  getNumero(op: string): string { return this.numeros[op] || ''; }

  copyNumber() {
    const num = this.getNumero(this.operateur);
    navigator.clipboard.writeText(num);
  }

  close() { this.modalCtrl.dismiss(); }

  // 🔥 MODIFICATION ICI (tsy mamafa logique)
  async confirm() {

    const data = {
      operateur: this.operateur,
      montant: this.montant,
      transactionId: this.transactionId,
      userPhone: this.userPhone
    };

    // 🔥 appel service
    if (this.type === 'depot') {
      await this.transactionService.createDepot(data);
    } else {
      await this.transactionService.createRetrait(data);
    }

    // mbola miasa toy ny taloha
    this.modalCtrl.dismiss({
      operateur: this.operateur,
      montant: this.montant,
      transactionId: this.type === 'depot' ? this.transactionId : null,
      userPhone: this.type === 'retrait' ? this.userPhone : null,
      type: this.type
    });
  }
}