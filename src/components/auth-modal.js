/**
 * @file src/components/auth-modal.js
 * @description Modal de autenticação — Magic Link.
 *
 * Design System v2.3 Quiet Luxury Tupiniquim.
 * Tokens CSS: --color-surface, --color-text, --clr-ouro, --sp-*.
 *
 * Estados:
 *   idle      → formulário de email
 *   sending   → loading skeleton
 *   sent      → confirmação "verifique seu email"
 *   error     → mensagem de erro + retry
 *
 * USO:
 *   import { AuthModal } from './components/auth-modal.js';
 *   const modal = new AuthModal();
 *   modal.open();
 *   modal.onLogin = (session) => { ... };
 *
 * @sprint S5
 */

import { auth } from '../lib/supabase.js';

const CSS = `
  .auth-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(15, 14, 10, 0.72);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 200ms ease;
  }
  .auth-overlay.visible { opacity: 1; }

  .auth-card {
    background: var(--color-surface, #1A1916);
    border: 1px solid var(--color-border, rgba(192,154,74,0.18));
    border-radius: 12px;
    padding: var(--sp-40, 2.5rem) var(--sp-48, 3rem);
    width: min(420px, 92vw);
    display: flex; flex-direction: column; gap: var(--sp-24, 1.5rem);
  }

  .auth-title {
    font-family: var(--font-display, 'Lora', serif);
    font-size: 1.375rem;
    color: var(--color-text, #E8E4DC);
    margin: 0;
    line-height: 1.3;
  }

  .auth-subtitle {
    font-family: var(--font-body, 'Noto Sans', sans-serif);
    font-size: 0.875rem;
    color: var(--color-text-muted, #9E9C9C);
    margin: 0;
    line-height: 1.55;
  }

  .auth-input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--sp-12, 0.75rem) var(--sp-16, 1rem);
    background: var(--color-surface-raised, #222019);
    border: 1px solid var(--color-border, rgba(192,154,74,0.22));
    border-radius: 6px;
    color: var(--color-text, #E8E4DC);
    font-family: var(--font-body, 'Noto Sans', sans-serif);
    font-size: 1rem;
    outline: none;
    transition: border-color 150ms ease;
  }
  .auth-input:focus {
    border-color: var(--clr-ouro, #C09A4A);
    box-shadow: 0 0 0 2px rgba(192,154,74,0.18);
  }
  .auth-input::placeholder { color: var(--color-text-muted, #9E9C9C); }

  .auth-btn {
    width: 100%;
    padding: var(--sp-12, 0.75rem);
    background: var(--clr-ouro, #C09A4A);
    color: #0F0E0A;
    border: none; border-radius: 6px;
    font-family: var(--font-body, 'Noto Sans', sans-serif);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 150ms ease;
  }
  .auth-btn:hover:not(:disabled) { opacity: 0.88; }
  .auth-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .auth-sent {
    text-align: center;
    display: flex; flex-direction: column;
    align-items: center; gap: var(--sp-16, 1rem);
  }
  .auth-sent-icon { font-size: 2rem; }
  .auth-sent-title {
    font-family: var(--font-display, 'Lora', serif);
    font-size: 1.125rem;
    color: var(--color-text, #E8E4DC);
    margin: 0;
  }
  .auth-sent-body {
    font-size: 0.875rem;
    color: var(--color-text-muted, #9E9C9C);
    margin: 0; line-height: 1.55;
  }
  .auth-spam {
    font-size: 0.8125rem;
    color: var(--color-text-muted, #9E9C9C);
    border-top: 1px solid var(--color-border, rgba(192,154,74,0.12));
    padding-top: var(--sp-16, 1rem);
    margin: 0;
  }

  .auth-error {
    font-size: 0.8125rem;
    color: #F0D5C8;
    background: rgba(122,53,32,0.25);
    border: 1px solid rgba(122,53,32,0.4);
    border-radius: 6px;
    padding: var(--sp-8, 0.5rem) var(--sp-12, 0.75rem);
    margin: 0;
  }

  .auth-close {
    position: absolute; top: var(--sp-16, 1rem); right: var(--sp-16, 1rem);
    background: none; border: none;
    color: var(--color-text-muted, #9E9C9C);
    font-size: 1.25rem; cursor: pointer; padding: 4px;
    line-height: 1;
  }
  .auth-close:hover { color: var(--color-text, #E8E4DC); }
`;

export class AuthModal {
  constructor() {
    this.onLogin = null; // callback(session)
    this._el = null;
    this._unsubscribe = null;
    this._inject();
  }

  _inject() {
    // Injetar CSS uma vez
    if (!document.getElementById('auth-modal-style')) {
      const style = document.createElement('style');
      style.id = 'auth-modal-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }

  open() {
    if (this._el) return;

    // Ouvir sessão — callback quando magic link é clicado em outra aba
    this._unsubscribe = auth.onSessionChange((session) => {
      if (session) {
        this._handleLogin(session);
      }
    });

    this._el = document.createElement('div');
    this._el.className = 'auth-overlay';
    this._el.setAttribute('role', 'dialog');
    this._el.setAttribute('aria-modal', 'true');
    this._el.setAttribute('aria-label', 'Entrar no BaZi');
    this._el.innerHTML = this._renderIdle('');
    document.body.appendChild(this._el);

    requestAnimationFrame(() => this._el.classList.add('visible'));
    this._el.querySelector('.auth-input')?.focus();
    this._bindEvents();
  }

  close() {
    if (!this._el) return;
    this._el.classList.remove('visible');
    setTimeout(() => {
      this._el?.remove();
      this._el = null;
    }, 200);
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  _renderIdle(email, errorMsg = '') {
    return `
      <div class="auth-card" style="position:relative">
        <button class="auth-close" aria-label="Fechar">&times;</button>
        <div>
          <h2 class="auth-title">Entrar no BaZi</h2>
          <p class="auth-subtitle">Informe seu email. Enviaremos um link de acesso — sem senha.</p>
        </div>
        ${errorMsg ? `<p class="auth-error" role="alert">${errorMsg}</p>` : ''}
        <input
          class="auth-input"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="seu@email.com"
          value="${email}"
          aria-label="Email"
        />
        <button class="auth-btn" type="button">Enviar link de acesso</button>
      </div>
    `;
  }

  _renderSending() {
    return `
      <div class="auth-card">
        <p class="auth-subtitle" aria-live="polite">Enviando…</p>
      </div>
    `;
  }

  _renderSent(email) {
    return `
      <div class="auth-card">
        <div class="auth-sent">
          <span class="auth-sent-icon" aria-hidden="true">✉️</span>
          <h2 class="auth-sent-title">Link enviado</h2>
          <p class="auth-sent-body">
            Enviamos um link de acesso para<br>
            <strong>${email}</strong>.<br>
            Clique no link para entrar.
          </p>
          <p class="auth-spam">Não recebeu? Verifique a pasta de spam.</p>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    if (!this._el) return;

    // Fechar ao clicar fora do card
    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this.close();
    });

    // Fechar com Escape
    this._onKeyDown = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this._onKeyDown);

    this._bindFormEvents();
  }

  _bindFormEvents() {
    const btn   = this._el?.querySelector('.auth-btn');
    const input = this._el?.querySelector('.auth-input');
    const close = this._el?.querySelector('.auth-close');

    close?.addEventListener('click', () => this.close());

    const submit = async () => {
      const email = input?.value?.trim();
      if (!email || !email.includes('@')) {
        this._el.innerHTML = this._renderIdle(email || '', 'Email inválido.');
        this._bindFormEvents();
        return;
      }

      this._el.innerHTML = this._renderSending();

      const { error } = await auth.sendMagicLink(email);

      if (error) {
        this._el.innerHTML = this._renderIdle(email, 'Erro ao enviar. Tente novamente.');
        this._bindFormEvents();
        return;
      }

      this._el.innerHTML = this._renderSent(email);
    };

    btn?.addEventListener('click', submit);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  _handleLogin(session) {
    this.close();
    this.onLogin?.(session);
  }
}
