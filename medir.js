// Pestaña "Medir con pasos": calcula pies² caminando el área con el cliente.
const MEDIR_KEY = 'cotiz-medir';
const CM_PER_FT = 30.48;
const TIPOS = {
  piso: { label: 'Piso (largo × ancho)', area: (l, w) => l * w },
  tri: { label: 'Triángulo (esquina)', area: (l, w) => l * w / 2 },
  pared: { label: 'Pared (largo × alto)', area: (l, w) => l * w },
};
const EJEMPLO = {
  altura: 160, tipoPaso: 'normal', calPasos: '', calPies: '',
  filas: [
    { n: 'Banqueta del frente', t: 'piso', l: 140, w: 8, wu: 'pies', x: 1 },
    { n: 'Entrada con grasa (restaurante)', t: 'piso', l: 12, w: 6, wu: 'pasos', x: 1 },
    { n: 'Banqueta lateral', t: 'piso', l: 45, w: 5, wu: 'pies', x: 1 },
    { n: 'Fachada del frente', t: 'pared', l: 140, w: 14, wu: 'pies', x: 1 },
  ],
};
let medir = null;
let contador = 0;

function loadMedir() {
  try { const d = JSON.parse(localStorage.getItem(MEDIR_KEY) || 'null'); if (d && d.filas) return d; } catch (e) {}
  return JSON.parse(JSON.stringify(EJEMPLO));
}
function saveMedir() { try { localStorage.setItem(MEDIR_KEY, JSON.stringify(medir)); } catch (e) {} }

// Paso normal al caminar ≈ 41.5% de la estatura; paso largo a propósito ≈ 1 yarda.
function pasoPies() {
  const cp = parseFloat(medir.calPasos), cf = parseFloat(medir.calPies);
  if (cp > 0 && cf > 0) return { ft: cf / cp, origen: 'calibrado' };
  if (medir.tipoPaso === 'largo') return { ft: 3, origen: 'paso largo' };
  return { ft: (parseFloat(medir.altura) || 160) * 0.415 / CM_PER_FT, origen: 'por estatura' };
}

function filaHTML(f, i) {
  const opts = Object.entries(TIPOS).map(([k, t]) => `<option value="${k}"${f.t === k ? ' selected' : ''}>${t.label}</option>`).join('');
  const esPared = f.t === 'pared';
  return `<tr>
    <td><input id="m-n-${i}" value="${f.n.replace(/"/g, '&quot;')}" aria-label="Nombre del área" style="max-width:none;font-family:var(--body)"></td>
    <td><select id="m-t-${i}" aria-label="Forma">${opts}</select></td>
    <td><input id="m-l-${i}" type="number" min="0" step="any" value="${f.l}" aria-label="Largo en pasos"><small class="note"> pasos</small></td>
    <td><div style="display:flex;gap:4px"><input id="m-w-${i}" type="number" min="0" step="any" value="${f.w}" aria-label="${esPared ? 'Alto' : 'Ancho'}">
      <select id="m-wu-${i}" aria-label="Unidad" style="width:auto"${esPared ? ' disabled' : ''}><option value="pasos"${f.wu === 'pasos' && !esPared ? ' selected' : ''}>pasos</option><option value="pies"${f.wu === 'pies' || esPared ? ' selected' : ''}>pies</option></select></div></td>
    <td><input id="m-x-${i}" type="number" min="1" step="1" value="${f.x}" aria-label="Veces" style="max-width:60px"></td>
    <td class="sub" id="m-a-${i}">0</td>
    <td><button type="button" class="ghost" data-del="${i}" aria-label="Borrar fila" style="padding:4px 9px">×</button></td>
  </tr>`;
}

function destinos() {
  return ORDER.flatMap(k => CONFIGS[k].sv.filter(s => !s.g && s.u.startsWith('pie²'))
    .map(s => `<option value="${k}|${s.k}">${CONFIGS[k].label} → ${s.n}</option>`)).join('');
}

function showMedir() {
  medir = loadMedir();
  $('app').innerHTML = `<div class="grid">
  <main style="display:grid;gap:20px;min-width:0">
    <section class="panel"><h2>Tu paso</h2>
      <div class="opts">
        <label class="f">Estatura (cm)<input id="m-altura" type="number" min="100" max="220" step="1" value="${medir.altura}"></label>
        <label class="f">Tipo de paso<select id="m-tipo"><option value="normal"${medir.tipoPaso === 'normal' ? ' selected' : ''}>Normal, caminando</option><option value="largo"${medir.tipoPaso === 'largo' ? ' selected' : ''}>Largo, de 1 yarda (3 pies)</option></select></label>
        <label class="f">Calibrar: pasos que caminé<input id="m-calp" type="number" min="0" step="1" value="${medir.calPasos}" placeholder="ej. 10"></label>
        <label class="f">en esta distancia (pies)<input id="m-calf" type="number" min="0" step="any" value="${medir.calPies}" placeholder="ej. 22"></label>
      </div>
      <p class="note" id="m-paso" style="margin:10px 0 0"></p>
      <p class="note" style="margin:6px 0 0">Para calibrar, camina sobre algo que ya mide algo conocido: un cajón de estacionamiento mide 9 pies de ancho; 4 cajones son 36 pies. Una placa de banqueta suele medir 5 pies.</p>
    </section>

    <section class="panel"><h2>Contador de pasos</h2>
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
        <button type="button" id="m-tap" style="font-size:22px;padding:18px 28px;min-width:160px">+1 paso</button>
        <div><div class="big" id="m-cont" style="font-family:var(--display);font-weight:800;font-size:40px;line-height:1">0</div><div class="note" id="m-contft">0 pies</div></div>
        <div class="btns">
          <button type="button" class="ghost" id="m-menos">−1</button>
          <button type="button" class="ghost" id="m-cero">Volver a 0</button>
          <button type="button" class="ghost" id="m-usar">Usar como largo de una fila nueva</button>
        </div>
      </div>
      <p class="note" style="margin:8px 0 0">Toca el botón con cada paso mientras caminas junto al cliente, o cuenta en tu cabeza y escribe el número en la tabla.</p>
    </section>

    <section class="panel"><h2>Áreas medidas</h2>
      <div class="tablewrap"><table style="min-width:720px">
        <thead><tr><th>Área</th><th>Forma</th><th>Largo</th><th>Ancho / alto</th><th>Veces</th><th style="text-align:right">Pies²</th><th></th></tr></thead>
        <tbody id="m-tb"></tbody></table></div>
      <div class="btns" style="margin-top:10px">
        <button type="button" class="ghost" id="m-add">Agregar área</button>
        <button type="button" class="ghost" id="m-ej">Cargar ejemplo</button>
        <button type="button" class="ghost" id="m-limpiar">Borrar todo</button>
      </div>
    </section>

    <section class="panel tips"><h2>Cómo medir una plaza rápido</h2><ul class="note">
      <li><b>Banquetas:</b> camina el largo contando pasos. El ancho casi siempre es fijo (4, 5, 6 u 8 pies): cuenta las placas o mide uno con la cinta y ponlo en pies.</li>
      <li><b>Áreas grandes:</b> camina el largo y luego el ancho. Si tiene forma de L, mídela como dos rectángulos.</li>
      <li><b>Esquinas en diagonal:</b> usa "Triángulo".</li>
      <li><b>Paredes:</b> camina a lo largo del edificio y estima la altura: un piso comercial mide de 10 a 14 pies; cuenta los bloques (8 pulgadas cada uno) o los ladrillos (3 por cada 8 pulgadas).</li>
      <li><b>Locales repetidos:</b> mide uno y pon en "Veces" cuántos iguales hay.</li>
      <li>Redondea hacia arriba un 5–10%. Antes de mandar una cotización grande, revisa con Google Earth.</li>
    </ul></section>
  </main>
  <aside>
    <section class="panel"><h2>Total medido</h2><div style="display:grid;gap:6px">
      <div class="row"><span>Piso / concreto</span><span id="m-tpiso">0 pies²</span></div>
      <div class="row"><span>Paredes</span><span id="m-tpared">0 pies²</span></div>
      <div class="total"><div class="note">Total</div><div class="big" id="m-total">0</div><div class="note">pies²</div></div>
    </div></section>
    <section class="panel"><h2>Mandar al cotizador</h2>
      <div style="display:grid;gap:10px">
        <label class="f">Qué total<select id="m-src"><option value="piso">Piso / concreto</option><option value="pared">Paredes</option></select></label>
        <label class="f">A qué servicio<select id="m-dst">${destinos()}</select></label>
        <button type="button" id="m-send">Mandar y abrir cotización</button>
        <p class="note" id="m-sent" style="margin:0"></p>
      </div>
    </section>
  </aside></div>`;
  renderFilas();
  bindMedir();
  calcMedir();
}

function renderFilas() {
  $('m-tb').innerHTML = medir.filas.map(filaHTML).join('');
}

function leerFilas() {
  medir.altura = $('m-altura').value;
  medir.tipoPaso = $('m-tipo').value;
  medir.calPasos = $('m-calp').value;
  medir.calPies = $('m-calf').value;
  medir.filas = medir.filas.map((f, i) => ({
    n: $('m-n-' + i).value, t: $('m-t-' + i).value,
    l: $('m-l-' + i).value, w: $('m-w-' + i).value, wu: $('m-wu-' + i).value, x: $('m-x-' + i).value,
  }));
}

let totales = { piso: 0, pared: 0 };
function calcMedir() {
  // si cambió la forma de una fila, se vuelve a pintar la tabla (pared fuerza alto en pies)
  const antes = medir.filas.map(f => f.t).join();
  leerFilas();
  if (medir.filas.map(f => f.t).join() !== antes) renderFilas();
  const p = pasoPies();
  $('m-paso').innerHTML = `1 paso ≈ <b>${p.ft.toFixed(2)} pies</b> (${Math.round(p.ft * CM_PER_FT)} cm), ${p.origen}.`;
  totales = { piso: 0, pared: 0 };
  medir.filas.forEach((f, i) => {
    const l = (parseFloat(f.l) || 0) * p.ft;
    const wRaw = parseFloat(f.w) || 0;
    const w = f.t === 'pared' || f.wu === 'pies' ? wRaw : wRaw * p.ft;
    const a = TIPOS[f.t].area(l, w) * Math.max(1, parseFloat(f.x) || 1);
    $('m-a-' + i).textContent = Math.round(a).toLocaleString('en-US');
    totales[f.t === 'pared' ? 'pared' : 'piso'] += a;
  });
  $('m-tpiso').textContent = Math.round(totales.piso).toLocaleString('en-US') + ' pies²';
  $('m-tpared').textContent = Math.round(totales.pared).toLocaleString('en-US') + ' pies²';
  $('m-total').textContent = Math.round(totales.piso + totales.pared).toLocaleString('en-US');
  $('m-contft').textContent = Math.round(contador * p.ft) + ' pies';
  saveMedir();
}

function bindMedir() {
  const setCont = n => { contador = Math.max(0, n); $('m-cont').textContent = contador; calcMedir(); };
  setCont(contador);
  $('m-tap').addEventListener('click', () => { setCont(contador + 1); if (navigator.vibrate) navigator.vibrate(15); });
  $('m-menos').addEventListener('click', () => setCont(contador - 1));
  $('m-cero').addEventListener('click', () => setCont(0));
  $('m-usar').addEventListener('click', () => {
    leerFilas();
    medir.filas.push({ n: 'Área ' + (medir.filas.length + 1), t: 'piso', l: contador, w: 5, wu: 'pies', x: 1 });
    renderFilas(); setCont(0);
  });
  $('m-add').addEventListener('click', () => {
    leerFilas();
    medir.filas.push({ n: 'Área ' + (medir.filas.length + 1), t: 'piso', l: 0, w: 5, wu: 'pies', x: 1 });
    renderFilas(); calcMedir();
  });
  $('m-ej').addEventListener('click', () => { medir = JSON.parse(JSON.stringify(EJEMPLO)); showMedir(); });
  $('m-limpiar').addEventListener('click', () => { leerFilas(); medir.filas = []; renderFilas(); calcMedir(); });
  $('m-tb').addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    leerFilas(); medir.filas.splice(+b.dataset.del, 1); renderFilas(); calcMedir();
  });
  $('m-src').addEventListener('change', () => {
    const want = $('m-src').value === 'pared' ? 'pie² pared' : 'pie²';
    const opt = [...$('m-dst').options].find(o => { const [k, sk] = o.value.split('|'); return CONFIGS[k].sv.find(s => s.k === sk).u === want; });
    if (opt) $('m-dst').value = opt.value;
  });
  $('m-send').addEventListener('click', () => {
    const [k, sk] = $('m-dst').value.split('|');
    const val = Math.ceil(totales[$('m-src').value]);
    let d = {};
    try { d = JSON.parse(localStorage.getItem('cotiz-' + k) || '{}') || {}; } catch (e) {}
    d['q-' + sk] = String(val);
    let ok = true;
    try { localStorage.setItem('cotiz-' + k, JSON.stringify(d)); } catch (e) { ok = false; }
    if (!ok) { $('m-sent').textContent = `Escribe ${val} en la cotización a mano: este navegador no deja guardar.`; return; }
    history.replaceState(null, '', '#' + k);
    show(k);
  });
}
