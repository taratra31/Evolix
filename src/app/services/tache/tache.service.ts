import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class TacheService {

  constructor(private supabaseService: SupabaseService) {}

  // ================= BONUS JOURNALIER =================
  async claimDailyBonus(userId: string, amount: number) {
    const today = new Date().toISOString().split('T')[0];

    const { data: existing, error: checkError } = await this.supabaseService.supabase
      .from('daily_bonus')
      .select('id')
      .eq('user_id', userId)
      .eq('claimed_date', today)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      throw new Error('Déjà récupéré aujourd\'hui');
    }

    const { error } = await this.supabaseService.supabase
      .from('daily_bonus')
      .insert({
        user_id: userId,
        amount,
        claimed_date: today
      });

    if (error) throw error;

    return true;
  }

  // ================= SAUVEGARDE TÂCHE =================
  async saveCompletedTask(userId: string, task: any) {
    // Vérifier si la tâche a déjà été faite aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await this.supabaseService.supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', task.id)
      .gte('created_at', today + 'T00:00:00')
      .maybeSingle();

    if (existing) {
      throw new Error('Tâche déjà effectuée aujourd\'hui');
    }

    const { error } = await this.supabaseService.supabase
      .from('tasks')
      .insert({
        user_id: userId,
        task_id: task.id,
        title: task.title,
        price: task.price,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    return true;
  }
}