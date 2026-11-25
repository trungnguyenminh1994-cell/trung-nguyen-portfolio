/* BMW OSB + Admin demo engine: core (store, routing, formatting, dialogs, review controls).
   Local simulation only: no network, no live account, no email sending.
   Surfaces register screens in app-osb.js, app-admin.js, app-email.js; a function adds hooks or
   overrides through window.BMW_FN (its design/function.js). */
(function () {
  'use strict';
  var D = window.BMW_DATA, C = window.BMW_CONFIG || {}, F = window.BMW_FN || {};
  var B = window.BMW = { screens: {}, actions: {}, changes: {}, inputs: {}, states: {}, after: [] };
  var body = document.body.dataset;
  B.module = body.module; B.surface = body.surface;
  B.item = (F && F.kind) || 'base';
  B.fn = F;
  B.conf = C;
  B.data = D;
  B.qs = new URLSearchParams(location.search);
  B.state = B.qs.get('state') || 'default';
  B.DS = '../../../../../design-system/';
  B.ASSETS = window.__ASSETS || B.DS + 'assets/';

  /* ---------- helpers ---------- */
  var esc = B.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  B.ico = function (n, s, cls) { return '<span class="ds-ico' + (cls ? ' ' + cls : '') + '">' + (window.DS_ICONS ? DS_ICONS.ico(n, s || 16) : '') + '</span>'; };
  B.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  B.byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  B.money = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  B.spin = function (sm) { return '<span class="ds-spin-dot' + (sm ? ' ds-spin-dot--sm' : '') + '" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'; };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  B.MON = MON; B.WD = WD;
  B.d = function (iso) { var p = iso.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); };
  B.iso = function (dt) { return dt.toISOString().slice(0, 10); };
  B.addDays = function (iso, n) { var x = B.d(iso); x.setUTCDate(x.getUTCDate() + n); return B.iso(x); };
  B.wd = function (iso) { return B.d(iso).getUTCDay(); };
  B.dmy = function (iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
  B.t12 = function (t) { var h = +t.slice(0, 2), m = t.slice(3, 5); return (h % 12 || 12).toString().padStart(2, '0') + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM'); };
  B.dt = function (iso, t) { return B.dmy(iso) + ' - ' + B.t12(t); };
  B.long = function (iso) { var p = iso.split('-'); return MON[+p[1] - 1] + ' ' + p[2] + ', ' + p[0]; };
  B.created = function (s) { var p = s.split(' '); return B.dt(p[0], p[1]); };
  B.now = function () { var x = new Date(); return D.today + ' ' + String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); };
  B.statusLabel = function (k) { for (var i = 0; i < D.statuses.length; i++) if (D.statuses[i][0] === k) return D.statuses[i][1]; return k; };
  B.fullName = function (c) { return c ? c.first + ' ' + c.last : ''; };

  /* ---------- store (one record set per country project and Base / function world) ---------- */
  var key = 'bmw-osb-admin:' + (C.country || 'nz') + ':' + B.item + ':v2';
  var memory = null;
  function fresh() {
    var s = {
      v: 2,
      dealers: B.clone(D.dealers), customers: B.clone(D.customers), bookings: B.clone(D.bookings), responses: B.clone(D.responses),
      users: B.clone(D.users), company: B.clone(D.company), perms: {},
      osb: { dealer: 'so10', dealerSet: true, draft: { vehicle: null, services: [], note: '', date: '', time: '', mobility: '', contact: {} }, last: '', surveys: {}, account: null },
      admin: { dealer: 'so10', collapsed: false }
    };
    if (F.seed) F.seed(s);
    return s;
  }
  function read() {
    try { var raw = localStorage.getItem(key); if (raw) { var s = JSON.parse(raw); if (s && s.v === 2) return s; } } catch (e) { /* storage blocked: memory only */ }
    return memory;
  }
  B.store = read() || fresh();
  B.save = function () { memory = B.store; try { localStorage.setItem(key, JSON.stringify(B.store)); } catch (e) { /* memory only */ } };
  B.reset = function () { B.store = fresh(); B.save(); };
  window.addEventListener('storage', function (e) { if (e.key === key) { B.store = read() || fresh(); B.render(); } });
  if (B.qs.get('dealer') && B.byId(B.store.dealers, B.qs.get('dealer'))) {
    if (B.surface === 'admin') B.store.admin.dealer = B.qs.get('dealer'); else { B.store.osb.dealer = B.qs.get('dealer'); B.store.osb.dealerSet = true; }
  }
  B.dealer = function (id) { return B.byId(B.store.dealers, id || (B.surface === 'admin' ? B.store.admin.dealer : B.store.osb.dealer)); };
  B.service = function (id) { return B.byId(D.services, id); };
  B.customer = function (id) { return B.byId(B.store.customers, id); };
  B.vehicle = function (rego) { for (var i = 0; i < D.vehicles.length; i++) if (D.vehicles[i].rego === rego) return D.vehicles[i]; return null; };
  B.vehicleOf = function (b) { return B.vehicle(b.rego) || b.vehicle || { rego: b.rego, label: b.rego, vin: '' }; };
  B.booking = function (id) { return B.byId(B.store.bookings, id); };
  B.totals = function (b) {
    var sub = 0, hours = 0;
    b.items.forEach(function (it) { var s = B.service(it.service); if (s) { sub += s.price; hours += s.hours; } });
    var disc = b.promo || 0, gst = (sub - disc) * D.gst;
    return { sub: sub, disc: disc, gst: gst, total: sub - disc + gst, hours: Math.round(hours * 100) / 100 };
  };
  B.nextWip = function () { var m = 0; B.store.bookings.forEach(function (b) { m = Math.max(m, b.wip); }); return m + 1; };

  /* ---------- routing: Base pages reach Base pages; a function page stays in its own world ---------- */
  B.fnModules = (C.functions && C.functions[B.item]) || [];
  B.href = function (module, params) {
    var item = B.item !== 'base' && B.fnModules.indexOf(module) >= 0 ? B.item : 'base';
    if (B.item !== 'base' && item === 'base') return '';
    var q = params ? Object.keys(params).filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&') : '';
    return '../../../' + module + '/' + item + '/design/index.html' + (q ? '?' + q : '');
  };
  B.go = function (module, params) { var h = B.href(module, params); if (h) location.href = h; };
  B.self = function (params) { return B.href(B.module, params); };

  /* ---------- rendering ---------- */
  B.render = function () {
    var r = (F.render && F.render[B.module]) || B.screens[B.module];
    var app = document.getElementById('app');
    if (!r) { app.innerHTML = '<p style="padding:24px">No screen for ' + esc(B.module) + '</p>'; return; }
    var y = window.scrollY;
    app.innerHTML = r();
    B.after.splice(0).forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    if (B.keepScroll) { window.scrollTo(0, y); B.keepScroll = false; }
  };
  B.rerender = function () { B.keepScroll = true; B.render(); };

  /* ---------- events: data-action on click, data-change on change, data-input on input ---------- */
  B.on = function (name, fn) { B.actions[name] = fn; };
  B.onChange = function (name, fn) { B.changes[name] = fn; };
  B.onInput = function (name, fn) { B.inputs[name] = fn; };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) { B.closeFloating(e); return; }
    var fn = B.actions[el.dataset.action];
    if (!fn) return;
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('change', function (e) { var el = e.target.closest('[data-change]'); if (el && B.changes[el.dataset.change]) B.changes[el.dataset.change](el, e); });
  document.addEventListener('input', function (e) { var el = e.target.closest('[data-input]'); if (el && B.inputs[el.dataset.input]) B.inputs[el.dataset.input](el, e); });
  document.addEventListener('submit', function (e) { var f = e.target.closest('form[data-submit]'); if (f && B.actions[f.dataset.submit]) { e.preventDefault(); B.actions[f.dataset.submit](f, e); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (B.modalOpen()) B.closeModal(); else B.closeFloating(); } });

  /* floating panels (popover, dropdown): one at a time, closed by outside click or Escape */
  B.floating = null;
  B.openFloating = function (host, html, cls) {
    B.closeFloating();
    var el = document.createElement('div');
    el.className = cls || 'ds-dropdown';
    el.innerHTML = html;
    host.appendChild(el);
    var btn = host.querySelector('[aria-expanded]');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    B.floating = { el: el, host: host, btn: btn };
    if (window.DS_ICONS) DS_ICONS.paint(el);
    var first = el.querySelector('input,button,a');
    if (first) setTimeout(function () { first.focus(); }, 0);
    return el;
  };
  B.closeFloating = function (e) {
    var f = B.floating;
    if (!f) return;
    if (e && f.host.contains(e.target)) return;
    f.el.remove();
    if (f.btn) f.btn.setAttribute('aria-expanded', 'false');
    B.floating = null;
  };

  /* modal: content html, returns the dialog element; focus kept inside, restored on close */
  var lastFocus = null;
  B.modalOpen = function () { return !!document.querySelector('.ds-mask'); };
  B.modal = function (html, opts) {
    B.closeModal(true);
    opts = opts || {};
    lastFocus = document.activeElement;
    var mask = document.createElement('div');
    mask.className = 'ds-mask';
    mask.innerHTML = '<div class="ds-modal ' + (opts.cls || '') + '" role="dialog" aria-modal="true"' + (opts.label ? ' aria-label="' + esc(opts.label) + '"' : '') + (opts.width ? ' style="width:' + opts.width + 'px"' : '') + '>' +
      (opts.noClose ? '' : '<button class="ds-modal__close" type="button" data-action="modal-close" aria-label="Close">' + B.ico('close', 16) + '</button>') + html + '</div>';
    if (!opts.static) mask.addEventListener('mousedown', function (e) { if (e.target === mask) B.closeModal(); });
    document.body.appendChild(mask);
    if (window.DS_ICONS) DS_ICONS.paint(mask);
    var dlg = mask.firstChild;
    var f = dlg.querySelector('[autofocus]') || dlg.querySelector('input:not([disabled]),select,textarea,button:not(.ds-modal__close)') || dlg;
    setTimeout(function () { f.focus(); }, 0);
    mask.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var list = [].slice.call(dlg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea')).filter(function (x) { return x.offsetParent !== null; });
      if (!list.length) return;
      if (e.shiftKey && document.activeElement === list[0]) { e.preventDefault(); list[list.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === list[list.length - 1]) { e.preventDefault(); list[0].focus(); }
    });
    B.onModalClose = opts.onClose || null;
    return dlg;
  };
  B.closeModal = function (silent) {
    var m = document.querySelector('.ds-mask');
    if (!m) return;
    m.remove();
    var cb = B.onModalClose; B.onModalClose = null;
    if (!silent && cb) cb();
    if (!silent && lastFocus && document.contains(lastFocus)) lastFocus.focus();
  };
  B.on('modal-close', function () { B.closeModal(); });
  B.confirm = function (title, text, okLabel, onOk, cancelLabel) {
    B.modal('<div class="ds-confirm">' + B.ico('exclamation-circle', 22) + '<div><p class="ds-modal__title">' + esc(title) + '</p><p>' + esc(text) + '</p></div></div><div class="ds-modal__foot"><button class="ds-btn ds-btn--default" type="button" data-action="modal-close">' + esc(cancelLabel || 'Cancel') + '</button><button class="ds-btn ds-btn--primary" type="button" data-action="confirm-ok">' + esc(okLabel || 'OK') + '</button></div>', { width: 416, noClose: true, label: title });
    B.actions['confirm-ok'] = function () { B.closeModal(true); onOk(); };
  };
  B.toast = function (text, icon) {
    var old = document.querySelector('.ds-message'); if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'ds-message'; el.setAttribute('role', 'status');
    el.innerHTML = B.ico(icon || 'f-check-circle', 16) + '<span>' + esc(text) + '</span>';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  };

  /* ---------- review controls in the demo bar: states of this module, reset ---------- */
  function reviewControls() {
    var bar = document.querySelector('.demo-bar');
    if (!bar || bar.querySelector('.bmw-review')) return;
    var list = (B.states[B.module] || []).concat((F.states && F.states[B.module]) || []);
    if (B.surface === 'email' && B.qs.get('view') !== 'customer') list = [];
    var wrap = document.createElement('span');
    wrap.className = 'bmw-review';
    wrap.innerHTML = (list.length ? '<label class="bmw-review__states"><span>State</span><select aria-label="Screen state">' + list.map(function (s) {
      var href = s[2] || B.self(s[0] === 'default' ? null : { state: s[0] });
      return '<option value="' + esc(href) + '"' + ((s[0] === B.state || (s[3] && location.search.indexOf(s[3]) >= 0)) ? ' selected' : '') + '>' + esc(s[1]) + '</option>';
    }).join('') + '</select></label>' : '') + '<button type="button" class="bmw-review__reset" title="Restore the sample data of this world">Reset data</button>';
    var ref = bar.querySelector('.demo-bar__more') || bar.querySelector('.demo-bar__extract');
    bar.insertBefore(wrap, ref || null);
    var sel = wrap.querySelector('select');
    if (sel) sel.addEventListener('change', function () { if (sel.value) location.href = sel.value; });
    wrap.querySelector('.bmw-review__reset').addEventListener('click', function () { B.reset(); location.href = B.self(); });
  }

  if (F.init) F.init(B);

  document.addEventListener('DOMContentLoaded', function () {
    B.render();
    var tries = 0;
    (function wait() { if (document.querySelector('.demo-bar')) reviewControls(); else if (tries++ < 40) setTimeout(wait, 50); })();
    if (F.boot) F.boot();
  });
})();
