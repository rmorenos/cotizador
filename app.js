const $ = id => document.getElementById(id);
const money = v => '$' + Math.round(v).toLocaleString('en-US');
const UNIT_EN = u => u.replace('pie lineal', 'linear ft').replace('pie² pared', 'sq ft wall').replace('pie²', 'sq ft').replace('pieza', 'unit(s)');
const REC_EN = { Trimestral: 'quarterly', Mensual: 'monthly', 'Semanal/quincenal': 'weekly/biweekly', Anual: 'annual', Cada: 'recurring', Vecino: 'referral' };
let cur = null;

function template(c) {
  const rows = c.sv.map(s => s.g
    ? `<tr class="grp"><td colspan="5">${s.g}</td></tr>`
    : `<tr id="tr-${s.k}"><td class="svc">${s.n}${s.d ? `<small>${s.d}</small>` : ''}</td>
       <td><input id="q-${s.k}" type="number" min="0" step="any" value="${s.q}" aria-label="Cantidad ${s.n}"></td>
       <td class="note">${s.u}</td>
       <td><input id="r-${s.k}" type="number" min="0" step="0.01" value="${s.r}" aria-label="Precio ${s.n}"></td>
       <td class="sub" id="sub-${s.k}">$0</td></tr>`).join('');
  return `<div class="grid">
  <main style="display:grid;gap:20px;min-width:0">
    <section class="panel"><h2>Cliente</h2>
      <p class="note" style="margin:0 0 8px">Ejemplo cargado: ${c.ex}</p>
      <div class="client">
        <label class="f">Negocio / cliente<input id="cli" value="${c.cli}"></label>
        <label class="f">Dirección<input id="dir" value="Louisville, KY"></label>
        <label class="f">Fecha<input id="fecha" type="date"></label>
      </div></section>
    <section class="panel"><h2>Servicios</h2>
      <div class="tablewrap"><table>
        <thead><tr><th>Servicio</th><th>Cantidad</th><th>Unidad</th><th>Precio por unidad ($)</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody></table></div></section>
    <section class="panel"><h2>Ajustes del trabajo</h2>
      <div class="opts">
        <label class="f">Suciedad<select id="suc"><option value="0.9">Ligera (−10%)</option><option value="1" selected>Normal</option><option value="1.2">Muy sucio (+20%)</option><option value="1.35">Extremo (+35%)</option></select></label>
        <label class="f">Recargo nocturno (%)<input id="noche" type="number" min="0" step="5" value="${c.noche}"></label>
        <label class="f">Contrato / descuento<select id="rec">${c.rec}</select></label>
        <label class="f">Mínimo ($)<input id="min" type="number" min="0" step="25" value="${c.min}"></label>
      </div></section>
    <section class="panel"><h2>Tus costos (para saber cuánto ganas)</h2>
      <div class="opts">
        <label class="f">Horas estimadas<input id="hrs" type="number" min="0" step="0.5" value="${c.hrs}"></label>
        <label class="f">Personas<input id="pers" type="number" min="1" step="1" value="${c.pers}"></label>
        <label class="f">Pago por hora a ayudante ($)<input id="pago" type="number" min="0" step="1" value="20"></label>
        <label class="f">Gasolina + químicos ($)<input id="gas" type="number" min="0" step="5" value="${c.gas}"></label>
      </div>
      <p class="note">Química aproximada: hidróxido ≈ $0.01 por pie² (cubeta de 50 lb en $165; 2 vasos por cubeta de 5 gal). Cloro 12.5% para soft wash ≈ $0.02–0.04 por pie² de pared.</p></section>
    <section class="panel tips"><h2>Recordatorios</h2><ul class="note">${c.tips}</ul></section>
  </main>
  <aside>
    <section class="panel"><h2>Resumen</h2><div style="display:grid;gap:6px">
      <div class="row"><span>Servicios</span><span id="s-serv">$0</span></div>
      <div class="row"><span>Ajuste por suciedad</span><span id="s-suc">$0</span></div>
      <div class="row"><span>Recargo nocturno</span><span id="s-noche">$0</span></div>
      <div class="row"><span>Descuento</span><span id="s-rec">$0</span></div>
      <div class="total"><div class="note">Precio al cliente</div><div class="big" id="s-total">$0</div><div id="s-min" class="note"></div></div>
    </div></section>
    <section class="panel"><h2>Tu ganancia</h2><div style="display:grid;gap:6px">
      <div class="row"><span>Costos</span><span id="g-cost">$0</span></div>
      <div class="row"><span>Ganancia</span><span id="g-gan">$0</span></div>
      <div class="row"><span>Por hora del equipo</span><span id="g-hora">$0</span></div>
      <div id="g-pill"></div>
      <p class="note" style="margin:0">Meta: $100–150 por hora de equipo. Si sale menos, súbele al precio.</p>
    </div></section>
    <section class="panel"><h2>Cotización para el cliente (inglés)</h2>
      <textarea id="txt" readonly aria-label="Cotización en inglés"></textarea>
      <div class="btns" style="margin-top:8px">
        <button id="copy" type="button">Copiar cotización</button>
        <button id="reset" type="button" class="ghost">Limpiar todo</button>
      </div>
      <p class="note" id="copied" style="margin:6px 0 0"></p></section>
  </aside></div>`;
}

const fields = () => [...document.querySelectorAll('#app input, #app select')].filter(e => e.id);
const key = () => 'cotiz-' + cur;
function load() { try { const d = JSON.parse(localStorage.getItem(key()) || 'null'); if (d) fields().forEach(e => { if (d[e.id] !== undefined) e.value = d[e.id]; }); } catch (e) {} }
function save() { try { const d = {}; fields().forEach(e => d[e.id] = e.value); localStorage.setItem(key(), JSON.stringify(d)); } catch (e) {} }
const num = id => parseFloat($(id).value) || 0;

function calc() {
  const c = CONFIGS[cur];
  let serv = 0; const lines = [];
  c.sv.forEach(s => {
    if (s.g) return;
    const q = num('q-' + s.k), v = q * num('r-' + s.k);
    serv += v;
    $('sub-' + s.k).textContent = money(v);
    $('tr-' + s.k).classList.toggle('on', v > 0);
    if (v > 0) lines.push({ s, q, v });
  });
  const aSuc = serv * (parseFloat($('suc').value) - 1);
  const base = serv + aSuc;
  const aN = base * num('noche') / 100;
  const aR = -(base + aN) * parseFloat($('rec').value) / 100;
  let total = base + aN + aR;
  const min = num('min'); let usedMin = false;
  if (total > 0 && total < min) { total = min; usedMin = true; }
  $('s-serv').textContent = money(serv);
  $('s-suc').textContent = (aSuc < 0 ? '−' : '+') + money(Math.abs(aSuc));
  $('s-noche').textContent = '+' + money(aN);
  $('s-rec').textContent = '−' + money(-aR);
  $('s-total').textContent = money(total);
  $('s-min').textContent = usedMin ? `Se aplicó el mínimo de ${money(min)}.` : '';

  const hrs = num('hrs'), pers = Math.max(1, num('pers'));
  const cost = hrs * (pers - 1) * num('pago') + num('gas');
  const ph = hrs > 0 ? total / hrs : 0;
  $('g-cost').textContent = money(cost);
  $('g-gan').textContent = money(total - cost);
  $('g-hora').textContent = money(ph) + '/h';
  $('g-pill').innerHTML = hrs <= 0 ? '' : ph >= 100 ? '<span class="pill good">Buen precio</span>' : '<span class="pill warn">Bajo: súbele al precio</span>';

  // texto en inglés para el cliente; ajustes repartidos proporcionalmente
  const f = serv > 0 ? total / serv : 0;
  const d = $('fecha').value ? new Date($('fecha').value + 'T12:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  let t = `PRESSURE WASHING ESTIMATE\nClient: ${$('cli').value}\nLocation: ${$('dir').value}\nDate: ${d}\n\n`;
  lines.forEach(l => { t += `- ${l.s.en} (${l.q.toLocaleString('en-US')} ${UNIT_EN(l.s.u)}): ${money(l.v * f)}\n`; });
  if (usedMin) t += `(Minimum charge applied)\n`;
  const recWord = $('rec').selectedOptions[0].text.split(' ')[0];
  t += `\nTOTAL: ${money(total)}${$('rec').value !== '0' && REC_EN[recWord] ? ` per visit (${REC_EN[recWord]} service agreement)` : ''}\n`;
  if (num('noche') > 0) t += `Includes after-hours service.\n`;
  t += `\nNote: Old, deep-set stains may not come out 100%. We will do our best to improve them.\nThank you for your business!`;
  $('txt').value = t;
  save();
}

function show(k) {
  if (!CONFIGS[k] && k !== 'medir') k = ORDER[0];
  cur = k;
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
  if (k === 'medir') return showMedir();
  $('app').innerHTML = template(CONFIGS[k]);
  $('fecha').value = new Date().toISOString().slice(0, 10);
  load();
  calc();
  $('copy').addEventListener('click', () => {
    const t = $('txt').value;
    const fallback = () => { $('txt').select(); $('copied').textContent = 'Texto seleccionado: usa Ctrl+C.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => $('copied').textContent = 'Copiado.').catch(fallback);
    else fallback();
  });
  $('reset').addEventListener('click', () => {
    CONFIGS[cur].sv.forEach(s => { if (!s.g) { $('q-' + s.k).value = 0; $('r-' + s.k).value = s.r; } });
    $('cli').value = ''; $('dir').value = 'Louisville, KY';
    calc();
  });
}

const TAB_ORDER = ['medir', ...ORDER];
$('tabs').innerHTML = TAB_ORDER.map(k => `<button type="button" role="tab" data-k="${k}">${k === 'medir' ? 'Medir con pasos' : CONFIGS[k].label}</button>`).join('');
$('tabs').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) { history.replaceState(null, '', '#' + b.dataset.k); show(b.dataset.k); }
});
$('app').addEventListener('input', () => cur === 'medir' ? calcMedir() : calc());
show(location.hash.slice(1) || 'medir');
