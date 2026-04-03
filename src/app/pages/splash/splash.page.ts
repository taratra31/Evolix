import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router'; // 1. Ampio ity import ity
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { Router } from '@angular/router';


@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonIcon, 
    CommonModule, 
    RouterLink 
  ]
})
export class SplashPage {
  constructor(private router: Router) {
    addIcons({ arrowForwardOutline });
  }
  goToLogin() {
  this.router.navigate(['/login']);
}
}