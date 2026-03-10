/**
 * @file src/lib/supabase.js
 * @description Client Supabase para BaZi PWA.
 *
 * AUTH: Magic Link (OTP por email) — sem senha.
 * RLS: todas as operações respeitam auth.uid() do usuário autenticado.
 *
 * USO:
 *   import { auth, db } from './lib/supabase.js';
 *
 *   // Enviar magic link
 *   await auth.sendMagicLink('usuario@email.com');
 *
 *   // Ouvir mudanças de sessão
 *   auth.onSessionChange((session) => { ... });
 *
 *   // Buscar perfil do usuário atual
 *   const perfil = await db.getPerfil();
 *
 * @sprint S5
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ── Configuração ──────────────────────────────────────────────────────────────

const SUPABASE_URL     = 'https://zgyyvjfckxpwnsucrvfg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RuRarqNhbaZtpWsiOPno_Q_pSYdHdBG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,   // necessário para magic link callback
  },
});

// ── auth ──────────────────────────────────────────────────────────────────────

export const auth = {

  /**
   * Envia magic link para o email informado.
   * O usuário clica no link e é redirecionado de volta com sessão ativa.
   *
   * @param {string} email
   * @param {string} [redirectTo] - URL de retorno após click (padrão: origem atual)
   * @returns {Promise<{ error: Error|null }>}
   */
  async sendMagicLink(email, redirectTo = window.location.origin) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,   // cria conta se não existir
      },
    });
    return { error };
  },

  /**
   * Retorna a sessão atual (null se não autenticado).
   * @returns {Promise<import('@supabase/supabase-js').Session|null>}
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Retorna o usuário autenticado atual (null se não autenticado).
   * @returns {Promise<import('@supabase/supabase-js').User|null>}
   */
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /**
   * Registra listener para mudanças de sessão (login, logout, token refresh).
   * @param {function(import('@supabase/supabase-js').Session|null): void} callback
   * @returns {function} unsubscribe — chame para remover o listener
   */
  onSessionChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => callback(session)
    );
    return () => subscription.unsubscribe();
  },

  /**
   * Encerra a sessão do usuário.
   * @returns {Promise<{ error: Error|null }>}
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};

// ── db ────────────────────────────────────────────────────────────────────────

export const db = {

  // ── users ──────────────────────────────────────────────────────────────────

  /**
   * Busca o perfil do usuário autenticado.
   * @returns {Promise<{ data: object|null, error: Error|null }>}
   */
  async getPerfil() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, tier, dayun_next_transition, lgpd_consent, created_at')
      .single();
    return { data, error };
  },

  /**
   * Registra consentimento LGPD.
   * Deve ser chamado na primeira vez que o usuário aceita os termos.
   * @returns {Promise<{ error: Error|null }>}
   */
  async registrarConsentimentoLGPD() {
    const { error } = await supabase
      .from('users')
      .update({ lgpd_consent: true, lgpd_consent_at: new Date().toISOString() });
    return { error };
  },

  /**
   * Atualiza a data da próxima transição de Da Yun.
   * @param {string} data - ISO date string (ex: '2027-04-15')
   * @returns {Promise<{ error: Error|null }>}
   */
  async atualizarDayunTransition(data) {
    const { error } = await supabase
      .from('users')
      .update({ dayun_next_transition: data });
    return { error };
  },

  // ── premium_access ─────────────────────────────────────────────────────────

  /**
   * Verifica se o usuário tem acesso premium ativo.
   * @returns {Promise<{ ativo: boolean, expiraEm: Date|null, error: Error|null }>}
   */
  async verificarPremium() {
    const { data, error } = await supabase
      .from('premium_access')
      .select('expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { ativo: false, expiraEm: null, error };
    return {
      ativo:    !!data,
      expiraEm: data ? new Date(data.expires_at) : null,
      error:    null,
    };
  },

  // ── push_subscriptions ─────────────────────────────────────────────────────

  /**
   * Salva ou atualiza uma PushSubscription VAPID para o dispositivo atual.
   * @param {PushSubscription} subscription - objeto nativo da Push API
   * @returns {Promise<{ error: Error|null }>}
   */
  async salvarPushSubscription(subscription) {
    const sub = subscription.toJSON();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: sub.endpoint,
        keys:     sub.keys,
        active:   true,
      }, { onConflict: 'endpoint' });
    return { error };
  },

  /**
   * Desativa a push subscription do dispositivo atual.
   * @param {string} endpoint
   * @returns {Promise<{ error: Error|null }>}
   */
  async desativarPushSubscription(endpoint) {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('endpoint', endpoint);
    return { error };
  },

  // ── donations ──────────────────────────────────────────────────────────────

  /**
   * Busca o histórico de doações do usuário.
   * @returns {Promise<{ data: object[]|null, error: Error|null }>}
   */
  async getDoações() {
    const { data, error } = await supabase
      .from('donations')
      .select('id, valor, txid, created_at')
      .order('created_at', { ascending: false });
    return { data, error };
  },
};
