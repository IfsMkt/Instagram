// Componentes dos cinco tipos de exercício. Todos funcionam com teclado e
// indicam acerto/erro com ícone e texto (não apenas cor).
import { useId, useState } from 'react';
import Icon from './Icon.jsx';
import { EXERCISE_TYPES } from '../../base44/shared/engine.js';

const LETTERS = 'ABCDEFGH';

export function initialResponse(ex) {
  if (ex.type === 'ordenar') return ex.items.map((i) => i.id);
  if (ex.type === 'associar') return {};
  return null;
}

export function isComplete(ex, resp) {
  if (ex.type === 'verdadeiro_falso') return typeof resp === 'boolean';
  if (ex.type === 'ordenar') return Array.isArray(resp) && resp.length === ex.items.length;
  if (ex.type === 'associar') return !!resp && ex.left.every((l) => !!resp[l.id]);
  return typeof resp === 'string';
}

/** Texto legível da resposta correta. */
export function describeAnswer(ex) {
  switch (ex.type) {
    case 'multipla_escolha':
      return ex.options.find((o) => o.id === ex.answer)?.text;
    case 'completar':
      return ex.prompt.replace('___', ex.options.find((o) => o.id === ex.answer)?.text || '___');
    case 'verdadeiro_falso':
      return ex.answer ? 'Verdadeiro' : 'Falso';
    case 'ordenar': {
      const byId = Object.fromEntries(ex.items.map((i) => [i.id, i.text]));
      return ex.answer.map((id, i) => `${i + 1}. ${byId[id]}`).join(' · ');
    }
    case 'associar': {
      const r = Object.fromEntries(ex.right.map((i) => [i.id, i.text]));
      return ex.left.map((l) => `${l.text} → ${r[ex.answer[l.id]]}`).join(' · ');
    }
    default:
      return '';
  }
}

function Mark({ correct }) {
  return correct ? (
    <span className="row" style={{ gap: 4, color: 'var(--sage-700)', fontWeight: 800, fontSize: '0.85rem' }}>
      <Icon name="check" size={18} /> Correta
    </span>
  ) : (
    <span className="row" style={{ gap: 4, color: 'var(--clay-700)', fontWeight: 800, fontSize: '0.85rem' }}>
      <Icon name="x" size={18} /> Sua resposta
    </span>
  );
}

function Choices({ ex, value, onChange, checked, labelId }) {
  return (
    <div className="choice-list" role="group" aria-labelledby={labelId}>
      {ex.options.map((o, i) => {
        const selected = value === o.id;
        const isAnswer = o.id === ex.answer;
        const cls = checked ? (isAnswer ? ' is-correct' : selected ? ' is-wrong' : '') : '';
        return (
          <button key={o.id} type="button" className={`choice${cls}`} aria-pressed={selected} disabled={checked} onClick={() => onChange(o.id)}>
            <span className="key" aria-hidden="true">
              {LETTERS[i]}
            </span>
            <span className="grow">{o.text}</span>
            {checked && isAnswer && <Mark correct />}
            {checked && selected && !isAnswer && <Mark correct={false} />}
          </button>
        );
      })}
    </div>
  );
}

function TrueFalse({ ex, value, onChange, checked, labelId }) {
  const opts = [
    [true, 'Verdadeiro', 'check'],
    [false, 'Falso', 'x'],
  ];
  return (
    <div className="grid-2" role="group" aria-labelledby={labelId}>
      {opts.map(([v, label, icon]) => {
        const selected = value === v;
        const isAnswer = ex.answer === v;
        const cls = checked ? (isAnswer ? ' is-correct' : selected ? ' is-wrong' : '') : '';
        return (
          <button key={label} type="button" className={`choice${cls}`} style={{ justifyContent: 'center', minHeight: 72 }} aria-pressed={selected} disabled={checked} onClick={() => onChange(v)}>
            <Icon name={icon} />
            {label}
            {checked && isAnswer && <span className="sr-only">(resposta correta)</span>}
          </button>
        );
      })}
    </div>
  );
}

function Ordering({ ex, value, onChange, checked }) {
  const [announce, setAnnounce] = useState('');
  const byId = Object.fromEntries(ex.items.map((i) => [i.id, i]));
  const move = (idx, dir) => {
    const next = [...value];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
    setAnnounce(`"${byId[value[idx]].text}" agora está na posição ${j + 1}.`);
  };
  return (
    <>
      <p className="muted small">Use as setas para colocar os itens na ordem certa (do primeiro ao último).</p>
      <ol className="order-list">
        {value.map((id, idx) => {
          const ok = checked && ex.answer[idx] === id;
          return (
            <li key={id} className={`order-item${checked ? (ok ? ' is-correct' : ' is-wrong') : ''}`}>
              <span className="pos" aria-hidden="true">
                {idx + 1}
              </span>
              <span className="grow">{byId[id].text}</span>
              {checked ? (
                ok ? (
                  <Icon name="check" label="posição correta" />
                ) : (
                  <span className="small" style={{ color: 'var(--clay-700)', fontWeight: 800 }}>
                    deveria ser {ex.answer.indexOf(id) + 1}º
                  </span>
                )
              ) : (
                <>
                  <button type="button" className="icon-btn" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label={`Mover "${byId[id].text}" para cima`}>
                    <Icon name="up" />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => move(idx, 1)} disabled={idx === value.length - 1} aria-label={`Mover "${byId[id].text}" para baixo`}>
                    <Icon name="down" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </>
  );
}

function Matching({ ex, value, onChange, checked }) {
  const base = useId();
  const used = new Set(Object.values(value || {}));
  return (
    <div className="stack">
      {ex.left.map((l) => {
        const sel = value?.[l.id] || '';
        const ok = checked && ex.answer[l.id] === sel;
        const correctText = ex.right.find((r) => r.id === ex.answer[l.id])?.text;
        return (
          <div key={l.id} className={`match-row${checked ? (ok ? ' is-correct' : ' is-wrong') : ''}`}>
            <label htmlFor={`${base}-${l.id}`} style={{ fontWeight: 800 }}>
              {l.text}
            </label>
            <select id={`${base}-${l.id}`} className="select" value={sel} disabled={checked} onChange={(e) => onChange({ ...value, [l.id]: e.target.value })}>
              <option value="">Escolha…</option>
              {ex.right.map((r) => (
                <option key={r.id} value={r.id} disabled={used.has(r.id) && sel !== r.id}>
                  {r.text}
                </option>
              ))}
            </select>
            {checked && (
              <span className="small row" style={{ gap: 4, fontWeight: 700, color: ok ? 'var(--sage-700)' : 'var(--clay-700)' }}>
                <Icon name={ok ? 'check' : 'x'} size={16} />
                {ok ? 'Par correto' : `Par correto: ${correctText}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Fill({ ex, value, onChange, checked, labelId }) {
  const [before, after] = ex.prompt.split('___');
  const chosen = ex.options.find((o) => o.id === value);
  return (
    <>
      <p className="fill-sentence" aria-live="polite">
        {before}
        <span className="blank">{chosen ? chosen.text : <span className="sr-only">lacuna</span>}</span>
        {after}
      </p>
      <Choices ex={ex} value={value} onChange={onChange} checked={checked} labelId={labelId} />
    </>
  );
}

export function ExerciseView({ exercise: ex, response, onChange, checked }) {
  const labelId = useId();
  const props = { ex, value: response, onChange, checked, labelId };
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">{EXERCISE_TYPES[ex.type]}</div>
        <h2 id={labelId}>{ex.type === 'completar' ? 'Complete a frase' : ex.prompt}</h2>
      </div>
      {ex.type === 'multipla_escolha' && <Choices {...props} />}
      {ex.type === 'verdadeiro_falso' && <TrueFalse {...props} />}
      {ex.type === 'ordenar' && <Ordering {...props} />}
      {ex.type === 'associar' && <Matching {...props} />}
      {ex.type === 'completar' && <Fill {...props} />}
    </div>
  );
}

export function Feedback({ exercise: ex, correct }) {
  return (
    <div className={`feedback ${correct ? 'ok' : 'no'}`} role="status" aria-live="polite">
      <h3>
        <Icon name={correct ? 'check' : 'info'} />
        {correct ? 'Isso mesmo!' : 'Ainda não — vamos entender'}
      </h3>
      {!correct && (
        <p>
          <strong>Resposta correta:</strong> {describeAnswer(ex)}
        </p>
      )}
      <p style={{ marginBottom: 6 }}>{ex.explanation}</p>
      <p className="ref" style={{ margin: 0 }}>
        <Icon name="book" size={16} /> Referência: {ex.reference}
      </p>
    </div>
  );
}
