import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, homeSharp, listCircleOutline, peopleOutline, peopleSharp, personOutline, personSharp,  walletSharp ,} from 'ionicons/icons';


@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
    IonRouterOutlet
],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss']
})
export class TabsPage implements OnInit {
  constructor() {
    addIcons({ homeOutline,listCircleOutline,peopleOutline,personOutline});
  }

  ngOnInit() {
  }
}