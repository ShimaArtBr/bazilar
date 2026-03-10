/**
 * @file src/components/push-banner.js
 * @description Banner de permissão Web Push VAPID.
 *
 * Exibe um banner discreto (DS v2.3) solicitando permissão para notificações
 * de transição de Da Yun. Registra a PushSubscription no Supabase.
 *
 * USO:
 *   import { PushBanner } from './components/push-banner.js';
 *   const banner = new PushBanner({ userId });
 *   banner.show(); // exibe se permissão ainda não concedida
 *
 * @sprint S5
 */

import { db } from '../lib/supabase.js';

const VAPID_PUBLIC_KEY = 'BFgMHYkCn4MIIl1RlhmRqsTUCQt_0dFiiLtFN_38ZJJYQxDSwWCb4qnqXWct0suZa2IagPejXhqzK3pKb9asvL4';
const SW_PATH          = '/sw.js';
const STORAGE_KEY      = 'bazi_push_dismissed';

const CSS = `
  .push-banner {
    position: fixed; bottom: 1.5rem; left: 50%;
    transform: translateX(-50%) translateY(120%);
    transition: transform 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    z-index: 8000;
    width: min(480px, 92vw);
    background: var(--color-surface, #1A1916);
    border: 1px solid rgba(192,154,74,0.22);
    border-radius: 10px;
    padding: 1rem 1.25rem;
    display: flex; align-items: center; gap: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .push-banner.visible {
    transform: translateX(-50%) translateY(0);
  }
  .push-banner-icon {
    font-size: 1.5rem; flex-shrink: 0;
  }
  .push-banner-body {
    flex: 1; min-width: 0;
  }
  .push-banner-title {
    font-family: var(--font-display, 'Lora', serif);
    font-size: 0.9375rem;
    color: var(--color-text, #E8E4DC);
    margin: 0 0 0.2rem;
  }
  .push-banner-desc {
    font-size: 0.8125rem;
    color: var(--color-text-muted, #9E9C9C);
    margin: 0; line-height: 1.45;
  }
  .push-banner-actions {
    display: flex; gap: 0.5rem; flex-shrink: 0;
  }
  .push-btn-allow {
    padding: 0.4rem 0.9rem;
    background: var(--clr-ouro, #C09A4A);
    color: #0F0E0A;
    border: none; border-radius: 5px;
    font-family: var(--font-body, 'Noto Sans', sans-serif);
    font-size: 0.8125rem; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: opacity 150ms;
  }
  .push-btn-allow:hover { opacity: 0.88; }
  .push-btn-dismiss {
    padding: 0.4rem 0.6rem;
    background: transparent;
    border: 1px solid rgba(192,154,74,0.2);
    border-radius: 5px;
    color: var(--color-text-muted, #9E9C9C);
    font-size: 0.8125rem; cursor: pointer;
    transition: border-color 150ms;
  }
  .push-btn-dismiss:hover { border-color: rgba(192,154,74,0.5); }
`;

export class PushBanner {
  constructor({ userId } = {}) {
    this.userId = userId;
    this._el    = null;
    this._inject();
  }

  _inject() {
    if (!document.getElementById('push-banner-style')) {
      const style = document.createElement('style');
      style.id = 'push-banner-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }

  /**
   * Exibe o banner se:
   * - Notificações suportadas
   * - Permissão ainda não concedida nem negada
   * - Usuário não dispensou antes
   */
  show() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    this._el = document.createElement('div');
    this._el.className = 'push-banner';
    this._el.setAttribute('role', 'status');
    this._el.setAttribute('aria-live', 'polite');
    this._el.innerHTML = `
      <span class="push-banner-icon" aria-hidden="true">🌙</span>
      <div class="push-banner-body">
        <p class="push-banner-title">Notificações de Da Yun</p>
        <p class="push-banner-desc">Avise-me quando meu Grande Ciclo mudar.</p>
      </div>
      <div class="push-banner-actions">
        <button class="push-btn-allow">Ativar</button>
        <button class="push-btn-dismiss" aria-label="Dispensar">Agora não</button>
      </div>
    `;
    document.body.appendChild(this._el);
    requestAnimationFrame(() => this._el.classList.add('visible'));

    this._el.querySelector('.push-btn-allow').addEventListener('click', () => this._requestPermission());
    this._el.querySelector('.push-btn-dismiss').addEventListener('click', () => this._dismiss());
  }

  hide() {
    if (!this._el) return;
    this._el.classList.remove('visible');
    setTimeout(() => { this._el?.remove(); this._el = null; }, 340);
  }

  _dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    this.hide();
  }

  async _requestPermission() {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      this.hide();
      return;
    }

    // Registrar SW e criar subscription
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH);
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      if (this.userId) {
        await db.salvarPushSubscription(sub);
      }

      this._renderSuccess();
    } catch (err) {
      console.error('[push-banner] Erro ao registrar subscription:', err);
      this.hide();
    }
  }

  _renderSuccess() {
    if (!this._el) return;
    this._el.innerHTML = `
      <span class="push-banner-icon" aria-hidden="true">✓</span>
      <div class="push-banner-body">
        <p class="push-banner-title">Notificações ativas</p>
        <p class="push-banner-desc">Você será avisado sobre seu próximo Grande Ciclo.</p>
      </div>
    `;
    setTimeout(() => this.hide(), 3000);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
