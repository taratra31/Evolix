import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonNote, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, arrowDownOutline, flashOutline, notificationsOutline, peopleOutline, trendingUpOutline } from 'ionicons/icons';

@Component({
  selector: 'app-acceuil',
  templateUrl: './acceuil.page.html',
  styleUrls: ['./acceuil.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonNote, IonIcon]
})
export class AcceuilPage implements OnInit {

  constructor(private router: Router) {
    addIcons({notificationsOutline,trendingUpOutline,arrowDownOutline,addOutline,peopleOutline,flashOutline});
  }

  goTo(page: string) {
    switch(page) {
      case 'depot':
        this.router.navigate(['/historique', 'depot']);
        break;
      case 'retrait':
        this.router.navigate(['/historique', 'retrait']);
        break;
      case 'equipe':
        this.router.navigate(['/tabs/equipe']);
        break;
      case 'tache':
        this.router.navigate(['/tabs/tache']);
        break;
      default:
        this.router.navigate(['/tabs', page]);
    }
  }

  goToNotif() {
    this.router.navigate(['/notifications']);
  }

  ngOnInit() {
  }
}
