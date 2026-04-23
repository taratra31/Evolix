import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userId = localStorage.getItem('userId');
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    
    if (!userId) {
      this.router.navigate(['/login']);
      return false;
    }
    
    if (sessionExpiry) {
      const expiryDate = new Date(sessionExpiry);
      const now = new Date();
      
      if (expiryDate <= now) {
        localStorage.removeItem('userId');
        localStorage.removeItem('sessionExpiry');
        this.router.navigate(['/login']);
        return false;
      }
    }
    
    return true;
  }
}
