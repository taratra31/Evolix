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
    if (!userId) return null;

    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ getUserProfile:', error);
      return null;
    }

    this.setUser(data); // 🔥 sync global state
    return data;
  }

  listenToUserChanges() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

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
          this.ngZone.run(() => {
            this.userSubject.next(payload.new);
          });
        }
      )
      .subscribe();
  }

  logout() {
    localStorage.removeItem('userId');
    this.userSubject.next(null);
  }
}