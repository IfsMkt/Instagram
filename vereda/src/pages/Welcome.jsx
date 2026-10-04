// Boas-vindas e onboarding. Funciona para visitantes (respostas guardadas
// localmente até o cadastro) e para quem já entrou mas ainda não tem perfil.
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Mascot, { MascotSays } from '../components/Mascot.jsx';
import Icon from '../components/Icon.jsx';
import { Alert, Loading, Progress } from '../components/ui.jsx';
import { DemoBanner } from '../components/Layout.jsx';
import { useApp } from '../state/AppState.jsx';
import { getGuest, setGuest } from '../lib/guest.js';
import { GOALS, KNOWLEDGE, TRADITIONS, detectTimeZone } from '../lib/format.js';
import { backend } from '../api/backend.js';

function Options({ value, onChange, options, label }) {
  return (
    <div className="choice-list" role="radiogroup" aria-label={label}>
      {Object.entries(options).map(([k, text]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className="choice" onClick={() => onChange(k)}>
          <span className="key" aria-hidden="true">
            {value === k ? <Icon name="check" size={16} /> : ''}
          </span>
          {text}
        </button>
      ))}
    </div>
  );
}

const STEPS = ['intro', 'nome', 'nivel', 'objetivo', 'tempo', 'tradicao', 'pronto'];

export default function Welcome() {
  const app = useApp();
  const navigate = useNavigate();
  const guest = getGuest();
  const [step, setStep] = useState(app.user ? 1 : 0);
  const [form, setForm] = useState({
    name: guest.name || '',
    knowledge_level: guest.knowledge_level || '',
    goal: guest.goal || '',
    daily_minutes: guest.daily_minutes || 5,
    tradition_pref: guest.tradition_pref || 'geral',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (app.user && step === 0) setStep(1);
  }, [app.user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (app.session.status === 'loading') return <Loading />;
  if (app.user && app.profile) return <Navigate to="/" replace />;

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setGuest(patch);
  };
  const name = form.name.trim();
  const canNext = {
    intro: true,
    nome: name.length >= 1,
    nivel: !!form.knowledge_level,
    objetivo: !!form.goal,
    tempo: !!form.daily_minutes,
    tradicao: true,
    pronto: true,
  }[STEPS[step]];

  async function createProfile() {
    setSaving(true);
    setError(null);
    try {
      const profile = await backend.entities.Profile.create({
        display_name: name,
        knowledge_level: form.knowledge_level,
        goal: form.goal,
        daily_minutes: Number(form.daily_minutes),
        tradition_pref: form.tradition_pref,
        timezone: detectTimeZone(),
        avatar: 'ovelha',
        sound_on: true,
        reduced_motion: false,
        onboarded: true,
      });
      setGuest({ onboarded: true });
      app.setProfile(profile);
      navigate('/');
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  const next = () => {
    if (STEPS[step] === 'tradicao') setGuest({ onboarded: true });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, app.user ? 1 : 0));
  const current = STEPS[step];

  return (
    <div className="app-shell">
      <DemoBanner />
      <main className="page no-nav" id="conteudo">
        {current !== 'intro' && (
          <div className="row" style={{ marginBottom: 18 }}>
            <button className="icon-btn" onClick={back} aria-label="Voltar" disabled={step <= (app.user ? 1 : 0)}>
              <Icon name="chevronLeft" />
            </button>
            <div className="grow">
              <Progress value={step / (STEPS.length - 1)} label="Progresso das boas-vindas" />
            </div>
          </div>
        )}

        {current === 'intro' && (
          <div className="stack center" style={{ paddingTop: 24 }}>
            <Mascot size={140} mood="feliz" />
            <h1 style={{ fontSize: '2.3rem', marginBottom: 0 }}>Vereda</h1>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--sage-700)' }}>Aprenda a Bíblia, um passo por dia.</p>
            <div className="card" style={{ textAlign: 'left' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
                <li className="row"><Icon name="leaf" /> Lições curtas, de cerca de cinco minutos.</li>
                <li className="row"><Icon name="map" /> Uma jornada com progresso que você enxerga.</li>
                <li className="row"><Icon name="review" /> Revisões no momento certo para lembrar melhor.</li>
                <li className="row"><Icon name="book" /> Um caderno privado para suas anotações.</li>
              </ul>
            </div>
            <button className="btn btn-primary btn-block" onClick={next}>
              Começar
            </button>
            <Link className="btn btn-secondary btn-block" to="/entrar">
              Já tenho conta
            </Link>
          </div>
        )}

        {current === 'nome' && (
          <div className="stack">
            <MascotSays>Olá! Eu sou a Lume e vou caminhar com você.</MascotSays>
            <label className="field">
              <span>Como você gostaria de ser chamado?</span>
              <input className="input" value={form.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} autoComplete="given-name" placeholder="Seu nome ou apelido" autoFocus />
            </label>
          </div>
        )}

        {current === 'nivel' && (
          <div className="stack">
            <h1>Quanto você conhece da Bíblia?</h1>
            <p className="muted">Qualquer resposta é um ótimo ponto de partida.</p>
            <Options label="Quanto você conhece da Bíblia" value={form.knowledge_level} onChange={(v) => set({ knowledge_level: v })} options={KNOWLEDGE} />
          </div>
        )}

        {current === 'objetivo' && (
          <div className="stack">
            <h1>Qual é seu objetivo?</h1>
            <Options label="Seu objetivo" value={form.goal} onChange={(v) => set({ goal: v })} options={GOALS} />
          </div>
        )}

        {current === 'tempo' && (
          <div className="stack">
            <h1>Quanto tempo deseja dedicar por dia?</h1>
            <p className="muted">Você pode mudar isso quando quiser no seu perfil.</p>
            <Options
              label="Tempo por dia"
              value={String(form.daily_minutes)}
              onChange={(v) => set({ daily_minutes: Number(v) })}
              options={{ 5: '5 minutos · cerca de uma lição', 10: '10 minutos · cerca de duas lições', 15: '15 minutos · cerca de três lições' }}
            />
          </div>
        )}

        {current === 'tradicao' && (
          <div className="stack">
            <h1>Prefere conteúdo cristão geral, católico ou protestante?</h1>
            <p className="muted">Esta resposta é opcional e pode ser alterada depois.</p>
            <Options label="Preferência de conteúdo" value={form.tradition_pref} onChange={(v) => set({ tradition_pref: v })} options={TRADITIONS} />
            <Alert kind="info">
              Nesta primeira versão, todas as pessoas seguem a trilha cristã geral. Quando houver diferenças entre tradições, elas aparecem identificadas nas lições. Conteúdos específicos por tradição só serão oferecidos depois de revisados.
            </Alert>
          </div>
        )}

        {current === 'pronto' && (
          <div className="stack center">
            <Mascot size={120} mood="feliz" />
            <h1>Tudo pronto, {name || 'amigo'}!</h1>
            <p className="muted">Sua meta: {form.daily_minutes} minutos por dia. Pontos e níveis medem as atividades que você realiza — nunca a sua fé.</p>
            {error && <Alert kind="error">{error.message}</Alert>}
            {app.user ? (
              <button className="btn btn-primary btn-block" onClick={createProfile} disabled={saving}>
                {saving ? 'Salvando…' : 'Começar minha jornada'}
              </button>
            ) : (
              <>
                <Link className="btn btn-primary btn-block" to="/experimentar">
                  Experimentar a primeira lição
                </Link>
                <Link className="btn btn-secondary btn-block" to="/entrar?modo=cadastro">
                  Criar conta agora
                </Link>
                <p className="small muted">Você pode fazer a primeira lição sem conta. Ao se cadastrar, seu progresso é guardado.</p>
              </>
            )}
          </div>
        )}

        {current !== 'intro' && current !== 'pronto' && (
          <div style={{ marginTop: 22 }}>
            <button className="btn btn-primary btn-block" onClick={next} disabled={!canNext}>
              Continuar
            </button>
            {current === 'tradicao' && (
              <button className="btn btn-ghost btn-block" onClick={() => (set({ tradition_pref: 'nao_informar' }), next())}>
                Pular esta pergunta
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
