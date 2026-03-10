/**
 * @file src/components/pix-modal.js
 * @description Modal de pagamento Pix — QR Code + Copia e Cola.
 *
 * Design System v2.3 Quiet Luxury Tupiniquim.
 * Polling de status via Supabase Realtime (premium_access).
 *
 * USO:
 *   import { PixModal } from './components/pix-modal.js';
 *   const modal = new PixModal({ valorCentavos: 1990, email: 'x@y.com', userId: '...' });
 *   modal.open();
 *   modal.onSuccess = (expiresAt) => { ... };
 *
 * @sprint S5
 */

import { supabase, db } from '../lib/supabase.js';

const VALOR_DEFAULT = 1990; // R$ 19,90 em centavos

const CSS = `
  .pix-overlay {
    position: fixed; inset: 0; z-index: 9100;
    background: rgba(15,14,10,0.78);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 200ms ease;
  }
  .pix-overlay.visible { opacity: 1; }

  .pix-card {
    background: var(--color-surface, #1A1916);
    border: 1px solid rgba(192,154,74,0.18);
    border-radius: 12px;
    padding: 2rem 2.5rem;
    width: min(400px, 94vw);
    display: flex; flex-direction: column;
    gap: 1.25rem; position: relative;
    text-align: center;
  }

  .pix-close {
    position: absolute; top: 1rem; right: 1rem;
    background: none; border: none;
    color: var(--color-text-muted, #9E9C9C);
    font-size: 1.25rem; cursor: pointer;
  }
  .pix-close:hover { color: var(--color-text, #E8E4DC); }

  .pix-title {
    font-family: var(--font-display, 'Lora', serif);
    font-size: 1.25rem;
    color: var(--color-text, #E8E4DC);
    margin: 0;
  }
  .pix-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-muted, #9E9C9C);
    margin: 0; line-height: 1.5;
  }
  .pix-valor {
    font-family: var(--font-display, 'Lora', serif);
    font-size: 1.75rem;
    color: var(--clr-ouro, #C09A4A);
    margin: 0;
  }

  .pix-qr {
    width: 200px; height: 200px;
    margin: 0 auto;
    border-radius: 8px;
    border: 2px solid rgba(192,154,74,0.2);
    display: block;
  }
  .pix-qr-skeleton {
    width: 200px; height: 200px;
    margin: 0 auto;
    border-radius: 8px;
    background: linear-gradient(90deg, #222 25%, #2a2a2a 50%, #222 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .pix-copy-btn {
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid var(--clr-ouro, #C09A4A);
    border-radius: 6px;
    color: var(--clr-ouro, #C09A4A);
    font-family: var(--font-body, 'Noto Sans', sans-serif);
    font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: background 150ms ease;
  }
  .pix-copy-btn:hover { background: rgba(192,154,74,0.08); }
  .pix-copy-btn.copiado { color: #7BA87D; border-color: #7BA87D; }

  .pix-expira {
    font-size: 0.8rem;
    color: var(--color-text-muted, #9E9C9C);
    margin: 0;
  }

  .pix-success {
    display: flex; flex-direction: column;
    align-items: center; gap: 1rem;
  }
  .pix-success-icon { font-size: 2.5rem; }
  .pix-success-title {
    font-family: var(--font-display, 'Lora', serif);
    font-size: 1.25rem;
    color: var(--color-text, #E8E4DC);
    margin: 0;
  }
  .pix-success-body {
    font-size: 0.875rem;
    color: var(--color-text-muted, #9E9C9C);
    margin: 0; line-height: 1.5;
  }

  .pix-error {
    font-size: 0.8125rem;
    color: #F0D5C8;
    background: rgba(122,53,32,0.25);
    border: 1px solid rgba(122,53,32,0.4);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin: 0;
  }
`;

export class PixModal {
  constructor({ valorCentavos = VALOR_DEFAULT, email, userId } = {}) {
    this.valorCentavos = valorCentavos;
    this.email         = email;
    this.userId        = userId;
    this.onSuccess     = null;
    this._el           = null;
    this._realtimeSub  = null;
    this._copiado      = false;
    this._inject();
  }

  _inject() {
    if (!document.getElementById('pix-modal-style')) {
      const style = document.createElement('style');
      style.id = 'pix-modal-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }

  async open() {
    if (this._el) return;

    this._el = document.createElement('div');
    this._el.className = 'pix-overlay';
    this._el.setAttribute('role', 'dialog');
    this._el.setAttribute('aria-modal', 'true');
    this._el.setAttribute('aria-label', 'Pagamento via Pix');
    this._el.innerHTML = this._renderLoading();
    document.body.appendChild(this._el);
    requestAnimationFrame(() => this._el.classList.add('visible'));

    this._el.querySelector('.pix-close')?.addEventListener('click', () => this.close());
    this._el.addEventListener('click', (e) => { if (e.target === this._el) this.close(); });

    // Criar cobrança
    await this._criarCobranca();

    // Ouvir aprovação via Supabase Realtime
    this._ouvirAprovacao();
  }

  close() {
    if (!this._el) return;
    this._realtimeSub?.unsubscribe();
    this._el.classList.remove('visible');
    setTimeout(() => { this._el?.remove(); this._el = null; }, 200);
  }

  async _criarCobranca() {
    try {
      const resp = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_centavos: this.valorCentavos,
          user_id:        this.userId,
          email:          this.email,
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      this._txid       = data.txid;
      this._copiaCola  = data.copia_e_cola;
      this._expiracao  = data.expiracao;

      this._render(data);

    } catch (err) {
      console.error('[pix-modal] Erro:', err);
      this._renderError('Não foi possível gerar o Pix. Tente novamente.');
    }
  }

  _ouvirAprovacao() {
    if (!this.userId) return;

    this._realtimeSub = supabase
      .channel('premium-status')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'premium_access',
        filter: `user_id=eq.${this.userId}`,
      }, (payload) => {
        const expiresAt = new Date(payload.new.expires_at);
        this._renderSuccess(expiresAt);
        this.onSuccess?.(expiresAt);
      })
      .subscribe();
  }

  _render(data) {
    if (!this._el) return;
    const valorReais = (this.valorCentavos / 100).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL',
    });
    const expiraStr = data.expiracao
      ? new Date(data.expiracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '';

    this._el.innerHTML = `
      <div class="pix-card">
        <button class="pix-close" aria-label="Fechar">&times;</button>
        <h2 class="pix-title">Pagamento via Pix</h2>
        <p class="pix-valor">${valorReais}</p>
        <p class="pix-subtitle">Acesso Premium por 30 dias.<br>Escaneie o QR Code ou use Copia e Cola.</p>
        ${data.qrcode_b64
          ? `<img class="pix-qr" src="data:image/png;base64,${data.qrcode_b64}" alt="QR Code Pix" />`
          : `<div class="pix-qr-skeleton" aria-label="Carregando QR Code"></div>`
        }
        <button class="pix-copy-btn" id="pix-copy">Copiar código Pix</button>
        ${expiraStr ? `<p class="pix-expira">Expira às ${expiraStr}</p>` : ''}
        <p class="pix-subtitle" style="font-size:0.8rem">
          Após o pagamento, o acesso é ativado automaticamente.
        </p>
      </div>
    `;

    this._el.querySelector('.pix-close')?.addEventListener('click', () => this.close());
    this._el.querySelector('#pix-copy')?.addEventListener('click', () => this._copiar());
  }

  _renderLoading() {
    return `
      <div class="pix-card">
        <button class="pix-close" aria-label="Fechar">&times;</button>
        <h2 class="pix-title">Gerando Pix…</h2>
        <div class="pix-qr-skeleton" aria-label="Carregando"></div>
      </div>
    `;
  }

  _renderSuccess(expiresAt) {
    if (!this._el) return;
    const dataStr = expiresAt.toLocaleDateString('pt-BR');
    this._el.innerHTML = `
      <div class="pix-card">
        <div class="pix-success">
          <span class="pix-success-icon">✨</span>
          <h2 class="pix-success-title">Pagamento confirmado!</h2>
          <p class="pix-success-body">
            Seu acesso Premium está ativo.<br>
            Válido até <strong>${dataStr}</strong>.
          </p>
        </div>
      </div>
    `;
    setTimeout(() => this.close(), 3000);
  }

  _renderError(msg) {
    if (!this._el) return;
    this._el.innerHTML = `
      <div class="pix-card">
        <button class="pix-close" aria-label="Fechar">&times;</button>
        <p class="pix-error" role="alert">${msg}</p>
      </div>
    `;
    this._el.querySelector('.pix-close')?.addEventListener('click', () => this.close());
  }

  async _copiar() {
    if (!this._copiaCola) return;
    try {
      await navigator.clipboard.writeText(this._copiaCola);
      const btn = this._el?.querySelector('#pix-copy');
      if (btn) {
        btn.textContent = 'Copiado!';
        btn.classList.add('copiado');
        setTimeout(() => {
          btn.textContent = 'Copiar código Pix';
          btn.classList.remove('copiado');
        }, 2500);
      }
    } catch {
      // fallback: selecionar texto
    }
  }
}
