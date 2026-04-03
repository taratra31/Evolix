import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notificationsOutline, checkmarkCircleOutline, warningOutline, informationCircleOutline, giftOutline, trendingUpOutline, notificationsOffOutline } from 'ionicons/icons';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'bonus';
  icon: string;
  time: string;
  unread: boolean;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule, FormsModule]
})
export class NotificationsPage implements OnInit {

  notifications: Notification[] = [
    {
      id: 1,
      title: 'Bonus Reçu',
      message: '+500 FC de commission via votre équipe',
      type: 'bonus',
      icon: 'gift-outline',
      time: 'Il y a 2h',
      unread: true
    },
    {
      id: 2,
      title: 'Inscription Réussie',
      message: 'Nouveau membre ajouté à votre équipe',
      type: 'success',
      icon: 'checkmark-circle-outline',
      time: 'Il y a 5h',
      unread: true
    },
    {
      id: 3,
      title: 'Augmentation VIP',
      message: 'Vous avez atteint le niveau VIP 3',
      type: 'bonus',
      icon: 'trending-up-outline',
      time: 'Il y a 1j',
      unread: false
    },
    {
      id: 4,
      title: 'Info Important',
      message: 'Notez que la limite de retrait a changé',
      type: 'info',
      icon: 'information-circle-outline',
      time: 'Il y a 3j',
      unread: false
    },
    {
      id: 5,
      title: 'Alerte',
      message: 'Accès inhabitual détecté sur votre compte',
      type: 'warning',
      icon: 'warning-outline',
      time: 'Il y a 5j',
      unread: false
    }
  ];

  constructor() {
    addIcons({ notificationsOutline, checkmarkCircleOutline, warningOutline, informationCircleOutline, giftOutline, trendingUpOutline, notificationsOffOutline });
  }

  ngOnInit() {
  }

}
