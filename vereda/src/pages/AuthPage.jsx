// Cadastro e login. Ao concluir, cria o perfil a partir do onboarding e
// preserva a lição feita como visitante (recorrigida no servidor).
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import Icon from '../components/Icon.jsx';
import { Alert, Loading } from '../components/ui.jsx';
import { DemoBanner } from '../components/Layout.jsx';
import { useApp } from '../state/AppState.jsx';
import { backend } from '../api/backend.js';
import { clearGuest, getGuest } from '../lib/guest.js';
import { detectTimeZone } from '../lib/format.js';

async function finishAuth(app) {
  const guest = getGuest();
  const { user } = await app.reloadSession();
  if (!user) throw new Error('Não foi possível confirmar o login.');
  let profile = (await backend.entities.Profile.list())[0] || null;
  if (!profile && guest.onboarded) {
    profile = await backend.entities.Profile.create({
      display_name: (guest.name || user.full_name || user.email.split('@')[0]).slice(0, 40),
      knowledge_level: guest.knowledge_level || 'comecando',
      goal: guest.goal || 'rotina',
      daily_minutes: Number(guest.daily_minutes) || 5,
      tradition_pref: guest.tradition_pref || 'geral',
      timezone: detectTimeZone(),
      avatar: 'ovelha',
      sound_on: true,
      reduced_motion: false,
      onboarded: true,
    });
  }
  let claimed = false;
  if (profile && guest.trial?.completed) {
    try {
      await backend.fn('claim-guest-progress', { trial: guest.trial });
      claimed = true;
    } catch {
      claimed = false; // conteúdo mudou ou a lição já estava registrada: segue sem bloquear
    }
    if (guest.reflection?.text) {
      await backend.entities.Note.create({ kind: 'reflexao', title: guest.reflection.lesson_title, body: guest.reflection.text, prompt: guest.reflection.prompt, reference: guest.reflection.reference, lesson_id: guest.reflection.lesson_id, lesson_title: guest.reflection.lesson_title });
    }
  }
  if (profile) clearGuest();
  await app.reloadSession();
  return { profile, claimed };
}

export default function AuthPage() {
  const app = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('modo') === 'cadastro' ? 'cadastro' : 'entrar');
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [stage, setStage] = useState('form'); // form | verificar
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  if (app.session.status === 'loading') return <Loading />;
  if (app.user && app.profile && !busy) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const guest = getGuest();

  async function done() {
    const { profile, claimed } = await finishAuth(app);
    if (!profile) return navigate('/bem-vindo');
    app.toast(claimed ? 'Conta criada! Seu progresso da primeira lição foi salvo.' : 'Bem-vindo de volta!');
    navigate('/');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (stage === 'verificar') {
        await backend.auth.verify({ email: form.email, code: form.code.trim(), password: form.password });
        await done();
      } else if (mode === 'cadastro') {
        if (form.password.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        const res = await backend.auth.register({ email: form.email.trim(), password: form.password, full_name: guest.name || '' });
        if (res.needsVerification) {
          setStage('verificar');
          setInfo(`Enviamos um código de verificação para ${form.email}.`);
        } else await done();
      } else {
        await backend.auth.login(form.email.trim(), form.password);
        await done();
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <DemoBanner />
      <main className="page no-nav stack" id="conteudo">
        <div className="row">
          <Link to="/bem-vindo" className="icon-btn" aria-label="Voltar">
            <Icon name="chevronLeft" />
          </Link>
        </div>
        <div className="center">
          <Mascot size={96} mood="feliz" />
          <h1>{stage === 'verificar' ? 'Confirme seu e-mail' : mode === 'cadastro' ? 'Criar sua conta' : 'Entrar'}</h1>
          {mode === 'cadastro' && guest.trial?.completed && stage === 'form' && <p className="muted">Sua primeira lição será salva na sua conta.</p>}
        </div>

        {stage === 'form' && (
          <div className="tabs" role="tablist" aria-label="Acesso">
            <button role="tab" aria-selected={mode === 'cadastro'} onClick={() => setMode('cadastro')}>
              Criar conta
            </button>
            <button role="tab" aria-selected={mode === 'entrar'} onClick={() => setMode('entrar')}>
              Entrar
            </button>
          </div>
        )}

        <form className="card stack" onSubmit={onSubmit} noValidate>
          {info && <Alert kind="info">{info}</Alert>}
          {error && <Alert kind="error">{error.message}</Alert>}
          {stage === 'form' ? (
            <>
              <label className="field">
                <span>E-mail</span>
                <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
              </label>
              <label className="field">
                <span>Senha</span>
                <input className="input" type="password" autoComplete={mode === 'cadastro' ? 'new-password' : 'current-password'} required minLength={8} value={form.password} onChange={set('password')} />
                {mode === 'cadastro' && <span className="hint">Pelo menos 8 caracteres.</span>}
              </label>
            </>
          ) : (
            <label className="field">
              <span>Código de verificação</span>
              <input className="input" inputMode="numeric" autoComplete="one-time-code" value={form.code} onChange={set('code')} />
              {backend.auth.resendCode && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => backend.auth.resendCode(form.email).then(() => setInfo('Código reenviado.'))}>
                  Reenviar código
                </button>
              )}
            </label>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !form.email || !form.password}>
            {busy ? 'Aguarde…' : stage === 'verificar' ? 'Confirmar' : mode === 'cadastro' ? 'Criar conta' : 'Entrar'}
          </button>
        </form>
        <p className="small muted center">Suas anotações e seu progresso são privados e ficam visíveis apenas para você.</p>
        {backend.mode === 'local' && (
          <Alert kind="warn">
            Modo de demonstração local: as contas e os dados ficam apenas neste navegador. Para usar contas reais, configure o Base44 (veja o README).
          </Alert>
        )}
      </main>
    </div>
  );
}
