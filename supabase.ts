
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbkpzrjgxkmnoxfhwwlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia3B6cmpneGttbm94Zmh3d2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDEyMjIsImV4cCI6MjA4NTk3NzIyMn0.dZiTxmhXFsiGig5v6Igf00MxJgdFGz-o5iv1skMpj-4';

export const supabase = createClient(supabaseUrl, supabaseKey);
