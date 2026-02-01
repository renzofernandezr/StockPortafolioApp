import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch all acciones
export async function getAcciones() {
  try {
    const { data, error } = await supabase
      .from('acciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching acciones:', error);
    throw error;
  }
}

// Fetch histórico de precios para una acción
export async function getAccionesHistorial(nemonico: string) {
  try {
    const { data, error } = await supabase
      .from('acciones_historial')
      .select('*')
      .eq('nemonico', nemonico)
      .order('fecha_hora', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching acciones_historial:', error);
    throw error;
  }
}

// Fetch all histórico de precios
export async function getAllAccionesHistorial() {
  try {
    const { data, error } = await supabase
      .from('acciones_historial')
      .select('*')
      .order('fecha_hora', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching all acciones_historial:', error);
    throw error;
  }
}

// Fetch todas las operaciones
export async function getAccionesOperaciones() {
  try {
    const { data, error } = await supabase
      .from('acciones_operaciones')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching acciones_operaciones:', error);
    throw error;
  }
}

// Fetch operaciones para una acción específica
export async function getAccionesOperacionesByNemonico(nemonico: string) {
  try {
    const { data, error } = await supabase
      .from('acciones_operaciones')
      .select('*')
      .eq('nemonico', nemonico)
      .order('fecha_hora', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching acciones_operaciones by nemonico:', error);
    throw error;
  }
}
