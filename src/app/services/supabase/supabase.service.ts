import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utsmvgremsepclqvnsmo.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0c212Z3JlbXNlcGNscXZuc21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MzU0OTUsImV4cCI6MjA5MDQxMTQ5NX0.xdmSgK_ER-664xDL7Y1dLBNLFfazkXyltKkwTd48mX4';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );
  }

}
