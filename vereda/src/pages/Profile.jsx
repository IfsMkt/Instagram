import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar, { AVATARS } from '../components/Avatar.jsx';
import Icon, { ACHIEVEMENT_ICONS } from '../components/Icon.jsx';
import { Alert, ConfirmDialog, Dialog, ErrorState, Loading, Progress, Switch } from '../components/ui.jsx';
import { useApp } from '../state/AppState.jsx';
import { ACHIEVEMENTS, LEVELS, addDays } from '../../base44/shared/engine.js';
import { GOALS, KNOWLEDGE, TIMEZONES, TRADITIONS, formatDate, plural } from '../lib/format.js';
import { buildReminderIcs, downloadFile } from '../lib/ics.js';
import { backend } from '../api/backend.js';

const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function Calendar({ activity, today }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const byDate = Object.fromEntries(activity.map((a) => [a.local_date, a]));
  const first = `${month}-01`;
  const startDow = new Date(`${first}T12:00:00Z`).getUTCDay();
  const days = [];
  for (let d = first; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  const shift = (n) => {
    const [y, m] = month.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonth(dt.toISOString().slice(0, 7));
  };
  const studied = days.filter((d) => byDate[d]).length;
  return (
    <section className="card" aria-labelledby="cal-title">
      <div className="row spread">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mês anterior">
          <Icon name="chevronLeft" />
        </button>
        <h2 id="cal-title" style={{ margin: 0, textTransform: 'capitalize' }}>
          {formatDate(first, { month: 'long', year: 'numeric' })}
        </h2>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="Próximo mês" disabled={month >= today.slice(0, 7)}>
          <Icon name="chevronRight" />
        </button>
      </div>
      <p className="small muted center">{plural(studied, 'dia de estudo', 'dias de estudo')} neste mês</p>
      <div className="calendar" role="grid" aria-label="Calendário de estudo">
        {DOW.map((d, i) => (
          <div key={i} className="dow" aria-hidden="true">
            {d}
          </div>
        ))}
        {Array.from({ length: startDow }, (_, i) => (
          <div key={`e${i}`} aria-hidden="true" />
        ))}
        {days.map((d) => {
          const a = byDate[d];
          const label = `${formatDate(d)}: ${a ? `estudou (${a.xp} XP${a.goal_met ? ', meta alcançada' : ''})` : 'sem estudo'}${d === today ? ', hoje' : ''}`;
          return (
            <div key={d} role="gridcell" aria-label={label} className={`day${a ? ' studied' : ''}${a?.goal_met ? ' goal' : ''}${d === today ? ' today' : ''}`}>
              {a ? <Icon name="check" size={16} strokeWidth={2.6} /> : Number(d.slice(8))}
            </div>
          );
        })}
      </div>
      <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
        <Icon name="check" size={14} /> dia com estudo · ponto dourado: meta alcançada
      </p>
    </section>
  );
}

function EditProfileDialog({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.display_name);
  const [avatar, setAvatar] = useState(profile.avatar || 'ovelha');
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title="Editar perfil" onClose={onClose}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          await onSave({ display_name: name.trim(), avatar });
        }}
      >
        <label className="field">
          <span>Como você gostaria de ser chamado?</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        <div>
          <span className="field-label" id="avatar-label">
            Avatar
          </span>
          <div className="avatar-grid" role="radiogroup" aria-labelledby="avatar-label">
            {Object.entries(AVATARS).map(([id, a]) => (
              <button type="button" key={id} role="radio" aria-checked={avatar === id} className="avatar-option" onClick={() => setAvatar(id)} aria-label={a.label}>
                <Avatar id={id} size={56} />
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy || !name.trim()}>
          Salvar
        </button>
      </form>
    </Dialog>
  );
}

function SelectRow({ label, value, options, onChange, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

export default function Profile() {
  const app = useApp();
  const navigate = useNavigate();
  const { profile, user, data } = app;
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [reminderTime, setReminderTime] = useState(profile.reminder_time || '20:00');

  if (data.status === 'loading' || data.status === 'idle') return <Loading />;
  if (data.status === 'error') return <ErrorState error={data.error} onRetry={app.reloadData} />;

  const stats = data.stats || {};
  const level = app.level;
  const earned = Object.fromEntries(data.achievements.map((a) => [a.key, a]));
  const save = async (patch) => {
    try {
      await app.updateProfile(patch);
      app.toast('Preferências salvas.');
    } catch (e) {
      app.toast(`Não foi possível salvar: ${e.message}`);
    }
  };
  const timezones = Object.fromEntries(TIMEZONES);
  if (profile.timezone && !timezones[profile.timezone]) timezones[profile.timezone] = profile.timezone;

  async function deleteAccount() {
    setBusy(true);
    setDeleteError(null);
    try {
      const res = await backend.fn('delete-account', { confirm: 'EXCLUIR' });
      if (!res.account_removed) {
        setDeleteError(new Error('Seus dados de estudo foram apagados, mas não foi possível remover o acesso da conta automaticamente. Fale com o suporte para concluir a exclusão.'));
        setBusy(false);
        return;
      }
      await backend.auth.logout();
      await app.reloadSession();
      navigate('/bem-vindo');
    } catch (e) {
      setDeleteError(e);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Perfil</h1>
        {app.isAdmin && (
          <Link className="btn btn-secondary btn-sm" to="/admin">
            <Icon name="settings" size={18} /> Administração
          </Link>
        )}
      </div>

      <section className="card row">
        <Avatar id={profile.avatar} size={68} name={profile.display_name} />
        <div className="grow">
          <h2 style={{ margin: 0 }}>{profile.display_name}</h2>
          <p className="small muted" style={{ margin: 0 }}>
            {user.email}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
          <Icon name="edit" size={18} /> Editar
        </button>
      </section>

      <section className="card gold" aria-labelledby="level-title">
        <div className="row spread">
          <h2 id="level-title" style={{ margin: 0 }}>
            Nível {level.level} · {level.name}
          </h2>
          <strong>{stats.total_xp || 0} XP</strong>
        </div>
        <div style={{ margin: '10px 0 6px' }}>
          <Progress gold value={level.progress} label="Progresso até o próximo nível" />
        </div>
        <p className="small" style={{ margin: 0 }}>
          {level.isMax ? 'Você chegou ao nível mais alto desta versão.' : `Faltam ${level.xpForNext} XP para o nível ${level.level + 1} (${LEVELS[level.level]?.name}).`} Pontos medem atividades realizadas — não fé ou proximidade com Deus.
        </p>
      </section>

      <div className="grid-2">
        <div className="stat">
          <strong>{stats.lessons_completed || 0}</strong>
          <span>lições concluídas</span>
        </div>
        <div className="stat">
          <strong>{stats.units_completed || 0}</strong>
          <span>unidades concluídas</span>
        </div>
        <div className="stat">
          <strong>{app.streak.days}</strong>
          <span>dias seguidos agora</span>
        </div>
        <div className="stat">
          <strong>{stats.streak_best || 0}</strong>
          <span>melhor sequência</span>
        </div>
      </div>

      <section aria-labelledby="ach-title">
        <h2 id="ach-title">Conquistas</h2>
        <ul className="achievements" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {ACHIEVEMENTS.map((a) => {
            const got = earned[a.key];
            return (
              <li key={a.key} className={`achievement ${got ? 'earned' : 'locked'}`}>
                <div className="medal" aria-hidden="true">
                  <Icon name={got ? ACHIEVEMENT_ICONS[a.icon] : 'lock'} size={26} />
                </div>
                <strong style={{ display: 'block', fontSize: '0.92rem' }}>{a.title}</strong>
                <span className="small muted" style={{ display: 'block' }}>
                  {a.description}
                </span>
                <span className="small" style={{ fontWeight: 800, color: got ? 'var(--gold-700)' : 'var(--muted)' }}>
                  {got ? `Conquistada em ${formatDate(got.earned_at, { day: 'numeric', month: 'short' })}` : 'Ainda não conquistada'}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Calendar activity={data.activity} today={app.today} />

      <section className="card stack" aria-labelledby="pref-title">
        <h2 id="pref-title">Meta diária e preferências</h2>
        <div>
          <span className="field-label" id="goal-label">
            Tempo por dia
          </span>
          <div className="segmented" role="radiogroup" aria-labelledby="goal-label">
            {[5, 10, 15].map((m) => (
              <button key={m} type="button" role="radio" aria-checked={Number(profile.daily_minutes) === m} className="choice" style={{ justifyContent: 'center' }} onClick={() => save({ daily_minutes: m })}>
                {m} min
              </button>
            ))}
          </div>
          <span className="hint">Meta de {app.goalXp} XP por dia.</span>
        </div>
        <SelectRow label="Quanto você conhece da Bíblia" value={profile.knowledge_level} options={KNOWLEDGE} onChange={(v) => save({ knowledge_level: v })} />
        <SelectRow label="Seu objetivo" value={profile.goal} options={GOALS} onChange={(v) => save({ goal: v })} />
        <SelectRow
          label="Preferência de conteúdo (opcional)"
          value={profile.tradition_pref || 'geral'}
          options={TRADITIONS}
          onChange={(v) => save({ tradition_pref: v })}
          hint="Nesta versão, todas as pessoas seguem a trilha cristã geral. Diferenças entre tradições aparecem identificadas nas lições."
        />
        <SelectRow label="Fuso horário (usado para contar seus dias de estudo)" value={profile.timezone} options={timezones} onChange={(v) => save({ timezone: v })} />
      </section>

      <section className="card" aria-labelledby="settings-title">
        <h2 id="settings-title">Configurações</h2>
        <div className="toggle">
          <span className="row">
            <Icon name="sound" /> Sons
          </span>
          <Switch label="Sons" checked={profile.sound_on !== false} onChange={(v) => save({ sound_on: v })} />
        </div>
        <div className="toggle">
          <span className="row">
            <Icon name="leaf" /> Animações reduzidas
          </span>
          <Switch label="Animações reduzidas" checked={!!profile.reduced_motion} onChange={(v) => save({ reduced_motion: v })} />
        </div>
      </section>

      <section className="card stack" aria-labelledby="rem-title">
        <h2 id="rem-title" className="row">
          <Icon name="bell" /> Lembretes
        </h2>
        <Alert kind="info">O Vereda ainda não envia notificações. Se quiser um lembrete, adicione um evento diário ao calendário do seu celular — é opcional e você controla tudo por lá.</Alert>
        <label className="field">
          <span>Horário do lembrete</span>
          <input className="input" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
        </label>
        <button
          className="btn btn-secondary btn-block"
          onClick={() => {
            downloadFile('vereda-lembrete.ics', buildReminderIcs({ time: reminderTime, timeZone: profile.timezone, minutes: profile.daily_minutes, url: window.location.origin }));
            save({ reminder_time: reminderTime });
          }}
        >
          <Icon name="download" size={18} /> Baixar lembrete para o calendário
        </button>
      </section>

      <section className="card stack" aria-labelledby="account-title">
        <h2 id="account-title">Conta</h2>
        <button
          className="btn btn-secondary btn-block"
          onClick={async () => {
            await backend.auth.logout();
            await app.reloadSession();
            navigate('/bem-vindo');
          }}
        >
          <Icon name="logout" size={18} /> Sair
        </button>
        <button className="btn btn-ghost btn-block" style={{ color: 'var(--clay-700)' }} onClick={() => setDeleting(true)}>
          <Icon name="trash" size={18} /> Excluir conta
        </button>
      </section>

      {editing && (
        <EditProfileDialog
          profile={profile}
          onClose={() => setEditing(false)}
          onSave={async (patch) => {
            await save(patch);
            setEditing(false);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Excluir conta?"
          danger
          confirmLabel="Excluir definitivamente"
          busy={busy}
          disabled={confirmText !== 'EXCLUIR'}
          onCancel={() => (setDeleting(false), setConfirmText(''), setDeleteError(null))}
          onConfirm={deleteAccount}
        >
          <p>Isso apaga seu progresso, XP, conquistas, revisões, anotações e favoritos. Não é possível desfazer.</p>
          {deleteError && <Alert kind="error">{deleteError.message}</Alert>}
          <label className="field">
            <span>Digite EXCLUIR para confirmar</span>
            <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          </label>
        </ConfirmDialog>
      )}
    </div>
  );
}
