import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { BehaviorSubject } from 'rxjs';
import { NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CompteService {

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private ngZone: NgZone
  ) {}

  getCurrentUserId(): string | null {
    return localStorage.getItem('userId');
  }

  setUser(user: any) {
    this.userSubject.next(user);
  }

  async getUserProfile() {
    const userId = this.getCurrentUserId();
    console.log('🔍 getUserProfile - userId:', userId);
    
    if (!userId) {
      console.log('❌ Aucun userId trouvé');
      return null;
    }

    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ getUserProfile error:', error);
      return null;
    }

    if (data) {
      console.log('✅ User data loaded:', {
        id: data['id'],
        phone: data['phone'],
        is_admin: data['is_admin'],
        vip_level: data['vip_level'],
        solde: data['solde']
      });
      
      // 🔥 Tehirizo ao amin'ny localStorage (mampiasa bracket notation)
      localStorage.setItem('userIsAdmin', String(data['is_admin'] || false));
      localStorage.setItem('userVIP', String(data['vip_level'] || 0));
      localStorage.setItem('userSolde', String(data['solde'] || 0));
      
      this.setUser(data);
    }

    return data;
  }

  async isUserAdmin(): Promise<boolean> {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    const cachedAdmin = localStorage.getItem('userIsAdmin');
    if (cachedAdmin !== null) {
      return cachedAdmin === 'true';
    }

    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return false;
    
    const isAdmin = data['is_admin'] === true;
    localStorage.setItem('userIsAdmin', String(isAdmin));
    
    return isAdmin;
  }

  async getUserSolde(): Promise<number> {
    const userId = this.getCurrentUserId();
    if (!userId) return 0;

    const cachedSolde = localStorage.getItem('userSolde');
    if (cachedSolde !== null) {
      return parseInt(cachedSolde, 10);
    }

    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('solde')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return 0;
    
    const solde = data['solde'] || 0;
    localStorage.setItem('userSolde', String(solde));
    
    return solde;
  }

  listenToUserChanges() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    console.log('👂 Listening to user changes for:', userId);

    this.supabaseService.supabase
      .channel('user-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 User updated:', payload.new);
          this.ngZone.run(() => {
            this.userSubject.next(payload.new);
            // 🔥 Fanavaozana ny localStorage (mampiasa bracket notation)
            localStorage.setItem('userIsAdmin', String(payload.new['is_admin'] || false));
            localStorage.setItem('userVIP', String(payload.new['vip_level'] || 0));
            localStorage.setItem('userSolde', String(payload.new['solde'] || 0));
          });
        }
      )
      .subscribe();
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userVIP');
    localStorage.removeItem('userSolde');
    localStorage.removeItem('userIsAdmin');
    this.userSubject.next(null);
  }
}