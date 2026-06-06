import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rkbgjyuhntdqcawognjk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, nombre, cargo } = req.body;

  // Validación básica
  if (!email || !nombre || !cargo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // 1. Invitar al usuario via Supabase Auth (envía email oficial)
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { nombre, cargo }
    });

    if (authError) {
      // Si el usuario ya existe en auth, no es error crítico
      if (authError.message?.includes('already been registered')) {
        return res.status(200).json({ ok: true, aviso: 'Usuario ya existía en el sistema de auth' });
      }
      throw authError;
    }

    // 2. Guardar en tabla usuarios de Supabase
    const { error: dbError } = await supabase
      .from('usuarios')
      .upsert({ nombre, email, cargo }, { onConflict: 'email' });

    if (dbError) throw dbError;

    return res.status(200).json({ ok: true, mensaje: `Invitación enviada a ${email}` });

  } catch (err) {
    console.error('Error en /api/invite:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
}
