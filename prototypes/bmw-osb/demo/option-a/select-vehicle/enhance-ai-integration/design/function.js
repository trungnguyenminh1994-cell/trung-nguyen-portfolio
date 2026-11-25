/* Enhance & AI Integration · function home (select-vehicle), BMW AU.
   The original AU proposal (Trung, 2026-08-27; Aria panel added 2026-10-27), rebuilt on the BMW design
   system and kept as close to the original as possible: same steps, sections, copy, widgets and dialogs.
   Its five OSB pages replace the Base screens of those modules (render overrides) and share the Base
   engine (store, dealer bar, steps, booking record). Aria's conversation lives in aria-chat.js.
   Sample prices and plans are the proposal's own sample values, not BMW pricing.
   The Thank you page also carries the Base survey and account dialogs (Trung, 2026-10-30). */
window.BMW_FN = (function () {
  'use strict';
  var B = null, ui = { chat: false, view: 'rego', menu: false, cal: false, page: 0, strip: '', search: '', photo: false };
  // [id, name, price, group, due] — groups: bsi, cbs, battery, tyre, extra (added by Aria)
  var CAT = [
    ['ai-bsi', 'BSI Package', 0, 'bsi'], ['ai-oil', 'Engine Oil - 19,000 km', 259, 'cbs', 1], ['ai-rearbrake', 'Rear Brake Service', 89, 'cbs', 1],
    ['ai-fuel', 'Fuel Filter', 259, 'cbs'], ['ai-check', 'Vehicle Check', 99, 'cbs'],
    ['ai-battest', 'Battery Test / Diagnostic', 310, 'battery'], ['ai-12v', '12V Battery Replacement', 310, 'battery'], ['ai-terminal', 'Battery Terminal Cleaning', 275, 'battery'],
    ['ai-tyre', 'Tyre Replacement', 320, 'tyre'], ['ai-balance', 'Wheel Balancing', 290, 'tyre'], ['ai-rotation', 'Tyre Rotation', 305, 'tyre'], ['ai-puncture', 'Puncture Repair', 280, 'tyre'], ['ai-tpms', 'TPMS Sensor Replacement/Reseal', 280, 'tyre'],
    ['ai-align', 'Wheel Alignment', 149, 'extra'], ['ai-cabin', 'Cabin Filter', 89, 'extra'], ['ai-wiper', 'Wiper Blades', 65, 'extra'], ['ai-pickup', 'Pickup & Delivery', 0, 'extra']
  ];
  var VEH = [
    { rego: 'DEMO01', title: '2023 BMW 3 Series 330i', make: 'BMW', model: '3 Series', variant: 'Base Model', mileage: '45,000 KM', year: 2023, vin: 'WBA5R1C05PFH12873', state: 'NSW', label: 'BMW 330i M Sport' },
    { rego: 'DEMO06', title: 'BMW Z4 M40i Roadster', make: 'BMW', model: 'Z4', variant: 'M Sport', mileage: '28,400 KM', year: 2022, vin: 'WBAHF9C08NWX51736', state: 'NSW', label: 'BMW Z4 M40i Roadster' }
  ];
  var SEED = ['ai-bsi', 'ai-oil', 'ai-rearbrake'];
  var BSI_LIST = ['Brake fluid replacement', 'Vehicle check', 'Air filter', 'Micro filter', 'Spark plugs'];
  var TIMES = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
  var STATES = [['NSW', 'NSW - New South Wales'], ['VIC', 'VIC - Victoria'], ['QLD', 'QLD - Queensland']];

  function esc(s) { return B.esc(s); }
  function ico(n, s, c) { return B.ico(n, s, c); }
  function svc(id) { for (var i = 0; i < CAT.length; i++) if (CAT[i][0] === id) return CAT[i]; return null; }
  function d() { return B.store.osb.draft; }
  function ai() { var x = d(); return x.ai || (x.ai = { state: 'NSW', fastLane: '', loanCar: false, callback: false }); }
  function veh() { var r = d().vehicle && d().vehicle.rego; for (var i = 0; i < VEH.length; i++) if (VEH[i].rego === r) return VEH[i]; return d().vehicle ? { rego: d().vehicle.rego, title: (d().vehicle.year ? d().vehicle.year + ' ' : '') + d().vehicle.label, variant: d().vehicle.variant || 'Default', mileage: '-', year: +d().vehicle.year || 2025 } : null; }
  function money(n) { return '$' + n.toFixed(2); }
  function fastLaneOk() { var v = veh(); return v && (2026 - v.year) < 3; }
  function mode() { var a = ai(); return a.fastLane === 'yes' ? 'Fast Lane' : a.loanCar ? 'Loan Car' : a.pickup ? 'Pickup & Delivery' : 'Drop Off'; }

  /* ---------- frame: Base shell + the proposal's quick link to Aria; chat replaces the steps ---------- */
  function frame(step, body, foot, hero) {
    var dl = B.dealer();
    var quickEnd = '<span class="ds-divider--v" aria-hidden="true" style="margin:0 14px"></span><button type="button" class="ai-quick-aria' + (ui.chat ? ' is-open' : '') + '" data-action="ai-chat" aria-pressed="' + ui.chat + '">' + ico('ai', 16) + '<span>' + (ui.chat ? 'Manual Booking' : 'Chat With Aria') + '</span></button>';
    if (ui.chat) { body = '<div id="aria-panel" class="aria-panel"></div>'; foot = ''; step = null; }
    return '<div class="ai">' + DS_SHELL.osb({ assets: B.ASSETS, dealer: dl.name, dealerSet: B.store.osb.dealerSet, steps: step == null ? null : steps(step), body: body, footer: foot, heroPhone: dl.phone, quickEnd: quickEnd, hero: hero, phone: dl.phone, heroAction: hero ? '<a class="ds-btn ds-btn--primary" style="font-weight:700" href="' + esc(B.href('select-vehicle', { fresh: 1 })) + '">Book Service</a>' : '' }) + '</div>';
  }
  function steps(cur) { return [['Vehicle', 'select-vehicle'], ['Services', 'select-services'], ['Appointment', 'select-appointment']].map(function (s, i) { return [s[0], B.href(s[1]), i < cur ? 'done' : i === cur ? 'current' : 'wait']; }); }
  function foot(back, next, label, enabled) {
    return '<div class="osb-footer">' + (back ? '<button type="button" class="osb-back" data-action="go" data-to="' + back + '">' + ico('left', 14) + '<span style="font-weight:700">Back</span></button>' : '<span></span>') +
      '<button type="button" class="ds-btn ds-btn--primary ds-btn--lg" style="font-weight:700" data-action="' + next + '"' + (enabled ? '' : ' disabled') + '>' + esc(label) + '</button></div>';
  }
  function warnBar() {
    var sent = ai().callback;
    return '<div class="ai-warnbar' + (sent ? ' is-sent' : '') + '"><span class="dot" aria-hidden="true">' + (sent ? ico('check', 12) : '!') + '</span><b>' + (sent ? 'Callback requested' : 'Warning light Showing ?') + '</b>' + (sent ? '' : '<button type="button" class="ds-btn ds-btn--default" data-action="ai-callback">Request Callback</button>') + '</div>';
  }
  function summary(withAppt) {
    var v = veh(), ids = d().services, total = 0;
    var lines = ids.map(function (id) { var s = svc(id); if (!s) return ''; total += s[2]; return '<div class="ai-summary__line"><span>• ' + esc(s[1]) + '</span><span>' + (id === 'ai-bsi' ? 'Confirm Later' : id === 'ai-pickup' ? 'Included' : money(s[2])) + '</span></div>'; }).join('');
    var dl = B.dealer();
    return '<div class="ai-summary"><h3>Booking summary</h3>' +
      '<div><div class="ai-summary__head"><span>Vehicle</span><a href="' + esc(B.href('select-vehicle')) + '" aria-label="Edit vehicle">' + ico('edit', 16) + '</a></div>' + (v ? '<span class="ai-plate" style="display:inline-block;margin-bottom:6px">' + esc(v.rego) + '</span><p class="ai-summary__desc">' + esc(v.title) + '</p>' : '') + '</div>' +
      '<div><div class="ai-summary__head"><span>Services (' + ids.length + ')</span><a href="' + esc(B.href('select-services')) + '" aria-label="Edit services">' + ico('edit', 16) + '</a></div><p class="ai-summary__dealer">' + esc(dl.short) + '</p>' + lines +
      '<div class="ai-summary__total"><span>Estimated total</span><b>' + money(total) + '</b></div></div>' +
      (withAppt && d().date && d().time ? '<div><div class="ai-summary__head"><span>Appointment</span></div><p class="ai-summary__mode">' + esc(mode()) + '</p><p class="ai-summary__desc">' + esc(B.long(d().date)) + '</p><p class="ai-summary__desc">' + esc(d().time + (d().time < '12:00' ? ' AM' : ' PM')) + '</p></div>' : '') + '</div>';
  }
  function bsiCard() {
    return '<div class="ai-bsi"><div class="ai-bsi__head">' + ico('f-exclamation-circle', 16) + '<span>BSI Package is active and will expire on 30/11/2026</span></div><div class="ai-bsi__body"><h4>Service Inclusive</h4><button type="button" data-action="ai-bsi-list">View Services</button></div></div>';
  }

  /* =====================================================================================
     1. VEHICLE
     ===================================================================================== */
  function vehicle() {
    var a = ai(), v = d().vehicle ? veh() : null, body;
    if (ui.view === 'details') {
      var m = d().manual || {};
      body = '<h2 class="osb-title" style="font-weight:300">Please enter your car details</h2><form class="osb-manual" onsubmit="return false"><div class="ds-form-row ds-form-row--24">' +
        fi('License Plate Number (REGO)', true, '<input class="ds-input ds-input--lg" placeholder="DEMO07" data-input="ai-man" name="rego" value="' + esc(m.rego || '') + '">') +
        fi('State/Teritory', true, sel('state', STATES.map(function (s) { return [s[0], s[0]]; }), m.state || 'NSW', 'ai-man-sel')) + '</div><div class="ds-form-row ds-form-row--24">' +
        fi('VIN', false, '<input class="ds-input ds-input--lg" placeholder="WBA..." data-input="ai-man" name="vin" value="' + esc(m.vin || '') + '">') +
        fi('Make', true, sel('make', [['BMW', 'BMW'], ['MINI', 'MINI']], m.make || 'BMW', 'ai-man-sel')) + '</div><div class="ds-form-row ds-form-row--24">' +
        fi('Model', true, sel('model', [['3 Series 330i', '3 Series 330i'], ['X3 xDrive20d', 'X3 xDrive20d'], ['Z4 M40i', 'Z4 M40i']], m.model || '3 Series 330i', 'ai-man-sel')) +
        fi('Year', false, sel('year', [['2026', '2026'], ['2025', '2025'], ['2024', '2024'], ['2023', '2023'], ['2022', '2022']], m.year || '2023', 'ai-man-sel')) + '</div><div class="ds-form-row ds-form-row--24">' +
        fi('Variant', false, sel('variant', [['Default', 'Default'], ['M Sport', 'M Sport']], m.variant || 'Default', 'ai-man-sel')) + '<span></span></div></form>' +
        '<button type="button" class="ai-link" data-action="ai-view" data-v="rego">Search by Rego</button>';
      return frame(0, body, foot(null, 'ai-veh-continue', 'Continue', !!(m.rego)));
    }
    var q = ui.search.trim().toUpperCase();
    var menu = ui.menu ? '<div class="ai-rego__menu" role="listbox" aria-label="Matching vehicles">' + VEH.filter(function (x) { return !q || x.rego.indexOf(q.replace(/\s/g, '')) >= 0 || 'DEMO'.indexOf(q) === 0; }).map(function (x) {
      return '<button type="button" class="ai-rego__item" role="option" data-action="ai-pick" data-rego="' + x.rego + '"><span><b>' + esc(x.title) + '</b><small>' + esc(x.rego) + '</small><small>State: ' + esc(x.state) + ' | VIN: ' + esc(x.vin.slice(0, 8)) + '… | Year: ' + x.year + '</small></span><span class="pick">Select Vehicle</span></button>';
    }).join('') + '</div>' : '';
    var left = '<h2 class="osb-title" style="font-weight:300">Select your car</h2><p class="ai-sub">Enter your registration number to quickly identify your car</p>' +
      '<div class="ai-row">' + fi('State/Territory', true, sel('state', STATES, a.state, 'ai-state')) +
      '<div class="ds-form-item ai-rego"><label for="ai-rego-in"><span class="req">*</span>Find Your REGO</label><input id="ai-rego-in" class="ds-input" placeholder="e.g. DEMO01" autocomplete="off" data-input="ai-rego" value="' + esc(v ? v.rego : ui.search) + '" style="text-transform:uppercase">' + menu + '</div></div>' +
      '<button type="button" class="ai-link" data-action="ai-view" data-v="details">Or find your car by make, model and year</button>';
    var right = v ? warnBar() + '<div class="ai-vinfo"><h3>Vehicle information</h3><div class="ai-card"><div class="ai-card__title">' + esc(v.title) + '</div>' +
        '<div class="ai-card__row"><span>' + ico('swap', 18) + 'REGO</span><span class="ai-plate">' + esc(v.rego) + '</span></div>' +
        '<div class="ai-card__row"><span>' + ico('f-dashboard', 18) + 'Variant</span><b>' + esc(v.variant) + '</b></div>' +
        '<div class="ai-card__row"><span>' + ico('clock-circle', 18) + 'Mileage</span><b>' + esc(v.mileage) + '</b></div></div>' + bsiCard() +
        '<div class="ai-needs">' + ico('warning', 16) + '<span>2 Condition Based Services need action now</span></div></div>'
      : '<div class="ai-warn"><span class="ai-warn__icon">' + ico('f-exclamation-circle', 22) + '</span><h3>Warning light Showing ?</h3><p>Please request a callback, A Service Concierge<br>will call you shortly</p><button type="button" class="ds-btn ds-btn--default" data-action="ai-callback">Request Callback</button></div>';
    body = '<div class="ai-cols"><div>' + left + '</div><aside>' + right + '</aside></div>';
    return frame(0, body, foot(null, 'ai-veh-continue', 'Continue', !!v));
  }
  function fi(label, req, ctrl) { return '<div class="ds-form-item"><label>' + (req ? '<span class="req">*</span>' : '') + esc(label) + '</label>' + ctrl + '</div>'; }
  function sel(name, opts, val, change) { return '<select class="ds-select ds-input--lg" name="' + name + '" data-change="' + change + '" aria-label="' + esc(name) + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }

  /* =====================================================================================
     2. SERVICES
     ===================================================================================== */
  function services() {
    if (!ai().seeded) { d().services = SEED.slice(); ai().seeded = true; B.save(); }
    var ids = d().services, q = ui.search.trim().toLowerCase();
    var row = function (s, due) {
      if (q && s[1].toLowerCase().indexOf(q) < 0) return '';
      var on = ids.indexOf(s[0]) >= 0;
      return '<button type="button" class="ai-svc' + (due ? ' is-due' : '') + '" data-action="ai-svc" data-id="' + s[0] + '" aria-pressed="' + on + '"><span class="n">' + esc(s[1]) + ' ' + ico('info-circle', 14) + '</span><span class="p">' + money(s[2]) + '</span><span class="ds-check ds-check--square"><input type="checkbox" tabindex="-1" aria-hidden="true"' + (on ? ' checked' : '') + '><span class="box"></span></span></button>';
    };
    var group = function (g) { return CAT.filter(function (s) { return s[3] === g; }); };
    var cbs = group('cbs');
    var left = '<h2 class="osb-title" style="font-weight:300">Select your services</h2><p class="ai-sub" style="font-size:14px">Multiple services can be selected</p>' +
      '<div class="ds-affix ds-affix--lg" style="margin-top:24px;border-radius:var(--ds-radius-md)">' + ico('search', 16) + '<input type="text" placeholder="Search" aria-label="Search services" data-input="ai-search" value="' + esc(ui.search) + '"></div>' +
      '<div style="margin-top:24px">' + bsiCard() + '</div>' +
      '<div class="ai-group"><h4>Condition Based Service</h4><div class="ai-due"><div class="ai-due__head">' + ico('warning', 12) + 'Due now</div>' + cbs.filter(function (s) { return s[4]; }).map(function (s) { return row(s, true); }).join('') + '</div>' + cbs.filter(function (s) { return !s[4]; }).map(function (s) { return row(s); }).join('') + '</div>' +
      '<div class="ai-group"><h4>Battery Service</h4>' + group('battery').map(function (s) { return row(s); }).join('') + '</div>' +
      '<div class="ai-group"><h4>Tyre Service</h4>' + group('tyre').map(function (s) { return row(s); }).join('') + '</div>';
    var body = '<div class="ai-cols ai-cols--wide"><div>' + left + '</div><aside style="display:flex;flex-direction:column;gap:24px">' + warnBar() + summary(true) + '</aside></div>';
    return frame(1, body, foot('select-vehicle', 'ai-svc-continue', 'Continue', ids.length > 0));
  }

  /* =====================================================================================
     3. APPOINTMENT
     ===================================================================================== */
  function open(iso) { return B.isOpen(B.dealer(), iso); }
  function firstOpen() { for (var i = 0; i < 40; i++) { var x = B.addDays(B.data.today, i); if (open(x)) return x; } return B.data.today; }
  function slotOpen(iso, t) { return !((+iso.slice(8) + TIMES.indexOf(t)) % 7 === 0); }
  function appointment() {
    var x = d(), a = ai();
    if (!x.date) x.date = firstOpen();
    var start = ui.strip || (function () { var s = B.data.today; while (B.addDays(s, 6) <= x.date) s = B.addDays(s, 6); return s; })();
    var dates = []; for (var i = 0; i < 6; i++) dates.push(B.addDays(start, i));
    var page = TIMES.slice(ui.page * 10, ui.page * 10 + 10);
    var win = page[0] < '12:00' ? 'Morning' : 'Afternoon';
    var cal = ui.cal ? calendar(x.date) : '';
    var left = '<h2 class="osb-title" style="font-weight:300">Preferred appointment time</h2>' +
      '<div class="ai-head"><span>Select Date</span><span style="position:relative"><button type="button" class="osb-month" data-action="ai-cal" aria-expanded="' + ui.cal + '" style="font-size:16px">' + esc(B.MON[+x.date.slice(5, 7) - 1] + ' ' + x.date.slice(0, 4)) + ico('down', 12) + '</button>' + cal + '</span></div>' +
      '<div class="ai-strip"><button type="button" class="arrow" data-action="ai-strip" data-dir="-1" aria-label="Earlier dates"' + (start <= B.data.today ? ' disabled' : '') + '>' + ico('left', 14) + '</button><div class="ai-dates">' + dates.map(function (iso) {
        var on = iso === x.date, ok = open(iso);
        return '<button type="button" class="ai-date' + (on ? ' is-selected' : '') + '" data-action="ai-date" data-date="' + iso + '"' + (ok ? '' : ' disabled') + ' aria-pressed="' + on + '"><span class="wd">' + B.WD[B.wd(iso)] + '</span><span class="d">' + (+iso.slice(8)) + '</span></button>';
      }).join('') + '</div><button type="button" class="arrow" data-action="ai-strip" data-dir="1" aria-label="Later dates">' + ico('right', 14) + '</button></div>' +
      '<div class="ai-head"><span>Select Time</span><small>' + win + '</small></div>' +
      '<div class="ai-strip"><button type="button" class="arrow" data-action="ai-page" data-dir="-1" aria-label="Earlier times"' + (ui.page ? '' : ' disabled') + '>' + ico('left', 14) + '</button><div class="ai-times">' + page.map(function (t) {
        var on = x.time === t, ok = open(x.date) && slotOpen(x.date, t);
        return '<button type="button" class="ai-time' + (on ? ' is-selected' : '') + '" data-action="ai-time" data-time="' + t + '"' + (ok ? '' : ' disabled') + ' aria-pressed="' + on + '">' + t + '</button>';
      }).join('') + '</div><button type="button" class="arrow" data-action="ai-page" data-dir="1" aria-label="Later times"' + ((ui.page + 1) * 10 >= TIMES.length ? ' disabled' : '') + '>' + ico('right', 14) + '</button></div>';
    var unavailable = '<div class="ai-note">' + ico('f-info-circle', 14) + '<span>Fast Lane isn\'t available for vehicles <b>over 3 years</b> extra diagnostic time may be needed for this appointment</span></div>';
    var loan = function (id) { return '<label class="ds-check"><input type="checkbox" data-change="ai-loan" id="' + id + '"' + (a.loanCar ? ' checked' : '') + '><span class="box"></span><span>Would you like a Loan Car?</span></label>'; };
    var modeHtml = !fastLaneOk() || B.state === 'fastlane-off'
      ? '<div class="ai-mode"><h4>Fast Lane Service unavailable</h4>' + unavailable + loan('loan-a') + '</div>'
      : '<div class="ai-mode"><h4>Would you like Fast Lane service?</h4><div class="ai-radios" role="radiogroup" aria-label="Fast Lane"><label class="ds-radio"><input type="radio" name="fl" value="yes" data-change="ai-fl"' + (a.fastLane === 'yes' ? ' checked' : '') + '><span class="dot"></span><span>Yes</span></label><label class="ds-radio"><input type="radio" name="fl" value="no" data-change="ai-fl"' + (a.fastLane === 'no' ? ' checked' : '') + '><span class="dot"></span><span>No</span></label></div>' +
        (a.fastLane === 'no' ? '<label class="ds-check" style="margin-top:4px"><input type="checkbox" data-change="ai-loan"' + (a.loanCar ? ' checked' : '') + '><span class="box"></span><span>Loan Car</span></label>' : '') + '</div>';
    var body = '<div class="ai-cols ai-cols--wide"><div>' + left + modeHtml + '</div><aside style="display:flex;flex-direction:column;gap:24px">' + warnBar() + summary(true) + '</aside></div>';
    return frame(2, body, foot('select-services', 'ai-appt-continue', 'Continue', !!(x.date && x.time)));
  }
  function calendar(sel) {
    var ym = ui.calMonth || sel.slice(0, 7), first = ym + '-01', lead = (B.wd(first) + 6) % 7, cells = '';
    for (var i = 0; i < lead; i++) cells += '<span></span>';
    for (var dd = 1; dd <= 31; dd++) { var iso = ym + '-' + String(dd).padStart(2, '0'); if (B.d(iso).getUTCMonth() + 1 !== +ym.slice(5)) break; cells += '<button type="button" data-action="ai-date" data-date="' + iso + '"' + (iso === sel ? ' class="is-selected"' : '') + (open(iso) ? '' : ' disabled') + '>' + dd + '</button>'; }
    var name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);
    return '<div class="ai-cal" role="dialog" aria-label="Choose a date"><div class="ai-cal__head"><button type="button" data-action="ai-calm" data-dir="-1" aria-label="Previous month">' + ico('left', 12) + '</button><span>' + name + '</span><button type="button" data-action="ai-calm" data-dir="1" aria-label="Next month">' + ico('right', 12) + '</button></div><div class="ai-cal__grid">' + ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(function (x) { return '<span>' + x + '</span>'; }).join('') + cells + '</div></div>';
  }

  /* =====================================================================================
     4. CONTACT
     ===================================================================================== */
  function contact() {
    if (!d().date) { d().date = firstOpen(); d().time = '09:30'; }
    var c = d().contact || {}, dl = B.dealer();
    var f = function (k, label, req, ph, ta) { return '<div class="ds-form-item"><label for="ai-' + k + '">' + (req ? '<span class="req">*</span>' : '') + esc(label) + '</label>' + (ta ? '<textarea id="ai-' + k + '" class="ds-textarea" placeholder="' + esc(ph) + '" data-input="ai-contact" name="' + k + '">' + esc(c[k] || '') + '</textarea>' : '<input id="ai-' + k + '" class="ds-input" placeholder="' + esc(ph) + '" data-input="ai-contact" name="' + k + '" value="' + esc(c[k] || '') + '">') + '</div>'; };
    var ok = (c.name || '').trim() && (c.mobile || '').trim();
    var left = '<h2 class="osb-title" style="font-weight:300">Contact details</h2><p class="ai-sub">Please add your contact details</p><div class="ai-callnote">' + ico('f-info-circle', 18) + '<span><b>' + esc(dl.short) + '</b> will call to confirm your appointment before it\'s booked in</span></div>' +
      '<form class="ai-contact" onsubmit="return false">' + f('name', 'Your Name', true, 'Enter your name') + f('mobile', 'Mobile Number', true, 'Enter mobile number') + f('email', 'Email', false, 'Enter your email') + f('address', 'Address Line 1', false, 'Enter your address') +
      f('address2', 'Address Line 2 (optional)', false, 'e.g. Unit 4, 12 Example St') + f('company', 'Company Name (optional)', false, 'Company Name') + f('note', 'Notes (optional)', false, 'Leave a note here', true) +
      '<p class="osb-privacy">By clicking Book Now, you\'re agreeing to the <a href="#" data-action="privacy">Privacy Policy</a>.</p></form>';
    var body = '<div class="ai-cols ai-cols--wide"><div>' + left + '</div><aside>' + summary(true) + '</aside></div>';
    return frame(null, body, foot('select-appointment', 'ai-book', 'Book Now', !!ok));
  }

  /* =====================================================================================
     5. CONFIRMATION
     ===================================================================================== */
  function confirmation() {
    var id = B.qs.get('id') || B.store.osb.last, b = id && B.booking(id);
    var dl = B.dealer(b ? b.dealer : null), ids = b ? b.items.map(function (i) { return i.service; }) : ['ai-bsi', 'ai-oil', 'ai-rearbrake'];
    var date = b ? b.date : firstOpen(), time = b ? b.time : '09:30', total = 0;
    var lines = ids.map(function (sid) { var s = svc(sid); if (!s) return ''; total += s[2]; return '<div class="ai-done__line"><span>' + esc(s[1]) + '</span><b>' + (sid === 'ai-bsi' ? 'Covered' : sid === 'ai-pickup' ? 'Included' : money(s[2])) + '</b></div>'; }).join('');
    var body = '<section class="osb-thanks ai-done" style="width:446px"><span class="osb-thanks__check" style="width:60px;height:60px">' + ico('check', 28) + '</span><h2>Thank you!</h2>' +
      '<p class="osb-thanks__lead" style="font-size:16px;line-height:21px">Your booking <b># ' + (b ? b.wip : '323703') + '</b> is confirmed.<br>Please check your email for a booking confirmation.</p>' +
      '<p class="osb-thanks__dealer">' + ico('location', 16) + esc(dl.short) + '</p><p class="osb-thanks__addr" style="font-size:15px">' + esc(dl.address) + '</p>' +
      '<p class="osb-thanks__when">' + ico('calendar', 16) + esc(B.long(date) + ' - ' + B.t12(time)) + '</p>' +
      '<button type="button" class="ai-done__cal" data-action="add-calendar">Add To Calendar</button><hr style="margin:40px 0 32px"><div class="ai-done__svc"><h4>Services</h4>' + lines + '<hr style="margin:24px 0 20px"><div class="ai-done__line"><span>Estimated total</span><b>' + money(total) + '</b></div></div>' +
      B.osbSurvey(b || B.lastBooking()) +   /* Base survey added on Trung's request (2026-10-30): the original proposal predates it */
      '<p class="osb-thanks__help" style="font-size:12px">If you have any questions, please email:<a href="mailto:' + esc(dl.enquiries) + '" style="font-size:12px">' + esc(dl.enquiries) + '</a></p></section>';
    return frame(null, body, '', 'brand');
  }

  /* ---------- dialogs: services list, warning-light diagnosis, sent ---------- */
  function bsiList() { B.modal('<h2>Services list</h2><ul>' + BSI_LIST.map(function (s) { return '<li>' + esc(s) + ' ' + ico('info-circle', 16) + '</li>'; }).join('') + '</ul>', { cls: 'ai-modal', label: 'Services list' }); }
  function callback() {
    var c = d().contact || {};
    B.modal('<h2>Warning light diagnosis</h2><p class="lead">Please add a photo of your warning light, along with your name, mobile number, and a short description this helps our technician better understand your issue.</p>' +
      '<div class="ai-photo">' + (ui.photo ? '<span class="prev"><img src="' + PHOTO() + '" alt="Warning light preview"><button type="button" data-action="ai-photo-x" aria-label="Remove photo">' + ico('close', 10) + '</button></span>' : '<label>' + ico('camera', 20) + '<span>Add Photo</span><input type="file" accept="image/*" class="ds-sr" data-change="ai-photo"></label>') + '</div>' +
      '<form data-submit="ai-cb-send" novalidate><div class="ds-form-item"><label for="cb-name"><span class="req">*</span>Your Name</label><input id="cb-name" class="ds-input ds-input--lg" value="' + esc(c.name || 'Putri') + '"></div>' +
      '<div class="ds-form-item"><label for="cb-mobile"><span class="req">*</span>Mobile Number</label><input id="cb-mobile" class="ds-input ds-input--lg" value="' + esc(c.mobile || '0491 570 156') + '"></div>' +
      '<div class="ds-form-item"><label for="cb-desc">Tell us what you\'re experiencing</label><textarea id="cb-desc" class="ds-textarea" placeholder="e.g. The light flashes on and off while driving"></textarea></div>' +
      '<div class="ai-modal__actions"><button type="submit" class="ds-btn ds-btn--primary">Request Now</button><button type="button" class="ds-btn ds-btn--default" data-action="modal-close">Cancel</button></div></form>', { cls: 'ai-modal', label: 'Warning light diagnosis' });
  }
  function PHOTO() { return '../../../select-vehicle/enhance-ai-integration/design/aria-warning-light.svg'; }

  return {
    kind: 'enhance-ai-integration',
    states: {
      'select-vehicle': [['chosen', 'Vehicle chosen'], ['rego-menu', 'REGO suggestions'], ['details', 'Enter car details'], ['callback', 'Warning light diagnosis'], ['callback-sent', 'Request has been sent'], ['aria', 'Chat with Aria']],
      'select-services': [['services-list', 'BSI services list']],
      'select-appointment': [['fastlane', 'Fast Lane offered (vehicle under 3 years)'], ['calendar', 'Month calendar open']],
      'contact-details': [['filled', 'Filled']]
    },
    seed: function (s) { s.osb.draft.services = SEED.slice(); },
    ensure: function (step, x) { if (step >= 3 && !x.services.some(function (id) { return id.indexOf('ai-') === 0; })) { x.services = SEED.slice(); ai().seeded = true; } },
    init: function (b) {
      B = b;
      CAT.forEach(function (s) { if (!B.service(s[0])) B.data.services.push({ id: s[0], name: s[1], code: 'AI-' + s[0].slice(3).toUpperCase(), hours: 1, price: s[2], category: 'Service' }); });
      VEH.forEach(function (v) { if (!B.vehicle(v.rego)) B.data.vehicles.push({ rego: v.rego, make: v.make, model: v.model, variant: v.variant, year: v.year, vin: v.vin, label: v.label }); });
      var st = B.state, x = d();
      if (B.module === 'select-vehicle') {
        if (B.qs.get('fresh')) { B.store.osb.draft = { vehicle: null, services: ['ai-bsi', 'ai-oil', 'ai-rearbrake'], note: '', date: '', time: '', mobility: '', contact: {} }; B.save(); }
        if (st === 'chosen' || st === 'callback-sent') x.vehicle = B.clone(B.vehicle('DEMO01'));
        if (st === 'rego-menu') { ui.menu = true; ui.search = 'DEMO'; x.vehicle = null; }
        if (st === 'details') ui.view = 'details';
        if (st === 'aria') ui.chat = true;
        if (st === 'callback') B.after.push(callback);
        if (st === 'callback-sent') { ai().callback = true; }
      }
      if (['select-services', 'select-appointment', 'contact-details'].indexOf(B.module) >= 0 && !x.vehicle) x.vehicle = B.clone(B.vehicle('DEMO01'));
      if (B.module === 'select-services' && st === 'services-list') B.after.push(bsiList);
      if (B.module === 'select-appointment' && st === 'fastlane') { x.vehicle = { rego: 'DEMO07', make: 'BMW', model: 'X3', variant: 'xDrive30e', year: 2025, label: 'BMW X3 xDrive30e', vin: '' }; }
      if (B.module === 'select-appointment' && st === 'calendar') ui.cal = true;
      if (B.module === 'contact-details') { if (st === 'filled') x.contact = { name: 'Putri Wulan', mobile: '0491 570 156', email: 'putri.wulan@example.com', address: '12 Example St, Melbourne VIC 3000' }; }
      if (B.module === 'select-vehicle' && ui.chat) B.after.push(mountChat);

      B.on('ai-chat', function () { ui.chat = !ui.chat; B.rerender(); if (ui.chat) mountChat(); });
      B.on('ai-view', function (el) { ui.view = el.dataset.v; B.rerender(); });
      B.onInput('ai-rego', function (el) { ui.search = el.value; ui.menu = el.value.trim().length > 0; d().vehicle = null; B.rerender(); var i = document.getElementById('ai-rego-in'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
      B.on('ai-pick', function (el) { d().vehicle = B.clone(B.vehicle(el.dataset.rego)); ui.menu = false; ui.search = ''; B.save(); B.rerender(); });
      B.onChange('ai-state', function (el) { ai().state = el.value; B.save(); });
      B.onInput('ai-man', function (el) { var m = d().manual || (d().manual = {}); m[el.name] = el.value.toUpperCase(); var c = document.querySelector('[data-action="ai-veh-continue"]'); if (c) c.disabled = !m.rego; });
      B.onChange('ai-man-sel', function (el) { var m = d().manual || (d().manual = {}); m[el.name] = el.value; });
      B.on('ai-veh-continue', function () {
        if (ui.view === 'details') { var m = d().manual || {}; if (!m.rego) return; d().vehicle = { rego: m.rego, make: m.make || 'BMW', model: m.model || '3 Series 330i', variant: m.variant || 'Default', year: m.year || '2023', vin: m.vin || '', label: (m.make || 'BMW') + ' ' + (m.model || '3 Series 330i'), manual: true }; }
        if (!d().vehicle) return; B.save(); B.go('select-services');
      });
      B.on('ai-callback', function () { callback(); });
      B.onChange('ai-photo', function () { ui.photo = true; callback(); });
      B.on('ai-photo-x', function () { ui.photo = false; callback(); });
      B.on('ai-cb-send', function () {
        var n = document.getElementById('cb-name').value.trim(), m = document.getElementById('cb-mobile').value.trim();
        if (!n || !m) { ['cb-name', 'cb-mobile'].forEach(function (i) { var e = document.getElementById(i); if (!e.value.trim()) e.classList.add('is-error'); }); return; }
        ai().callback = true; var c = d().contact || (d().contact = {}); c.name = c.name || n; c.mobile = c.mobile || m; B.save();
        B.modal('<div class="ai-sent"><h2 style="margin-bottom:8px">Warning light diagnosis</h2><span class="ok">' + ico('check', 28) + '</span><p style="font-size:20px;font-weight:700;color:var(--ds-text-ink)">Request has been sent</p><p style="font-weight:300;color:var(--ds-text-ink)">A Service Concierge will be in touch soon to follow up. In the meantime, feel free to continue booking any other services</p><button type="button" class="ds-btn ds-btn--primary ds-btn--block" style="height:40px;font-weight:700;margin-top:12px" data-action="modal-close">Continue Booking</button></div>', { cls: 'ai-modal', label: 'Request has been sent', onClose: function () { B.rerender(); } });
      });
      B.on('ai-bsi-list', bsiList);
      B.onInput('ai-search', function (el) { ui.search = el.value; B.rerender(); var i = document.querySelector('[data-input="ai-search"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
      B.on('ai-svc', function (el) { var ids = d().services, i = ids.indexOf(el.dataset.id); if (i >= 0) ids.splice(i, 1); else ids.push(el.dataset.id); B.save(); B.rerender(); });
      B.on('ai-svc-continue', function () { if (d().services.length) B.go('select-appointment'); });
      B.on('ai-strip', function (el) { var s = ui.strip || B.data.today; ui.strip = B.addDays(s, 6 * +el.dataset.dir); if (ui.strip < B.data.today) ui.strip = B.data.today; B.rerender(); });
      B.on('ai-page', function (el) { ui.page = Math.max(0, ui.page + +el.dataset.dir); B.rerender(); });
      B.on('ai-date', function (el) { d().date = el.dataset.date; d().time = ''; ui.cal = false; ui.strip = ''; B.save(); B.rerender(); });
      B.on('ai-time', function (el) { d().time = el.dataset.time; B.save(); B.rerender(); });
      B.on('ai-cal', function () { ui.cal = !ui.cal; ui.calMonth = ''; B.rerender(); });
      B.on('ai-calm', function (el) { var ym = ui.calMonth || d().date.slice(0, 7), x = B.d(ym + '-01'); x.setUTCMonth(x.getUTCMonth() + +el.dataset.dir); ui.calMonth = B.iso(x).slice(0, 7); B.rerender(); });
      B.onChange('ai-fl', function (el) { ai().fastLane = el.value; if (el.value === 'yes') ai().loanCar = false; B.save(); B.rerender(); });
      B.onChange('ai-loan', function (el) { ai().loanCar = el.checked; B.save(); B.rerender(); });
      B.on('ai-appt-continue', function () { if (d().date && d().time) B.go('contact-details'); });
      B.onInput('ai-contact', function (el) { var c = d().contact || (d().contact = {}); c[el.name] = el.value; B.save(); var btn = document.querySelector('[data-action="ai-book"]'); if (btn) btn.disabled = !((c.name || '').trim() && (c.mobile || '').trim()); });
      B.on('ai-book', function () {
        var x = d(), c = x.contact || {};
        if (!(c.name || '').trim() || !(c.mobile || '').trim()) return;
        var parts = c.name.trim().split(/\s+/);
        x.contact = { first: parts[0], last: parts.slice(1).join(' ') || '-', mobile: c.mobile, email: c.email || (parts[0].toLowerCase() + '.' + Date.now().toString(36) + '@example.com'), address: c.address || '', city: '', company: c.company || '', note: c.note || '' };
        x.mobility = mode();
        var id = B.createBooking(x, B.store.osb.dealer, 'online');
        B.store.osb.last = id; B.store.osb.draft = { vehicle: null, services: ['ai-bsi', 'ai-oil', 'ai-rearbrake'], note: '', date: '', time: '', mobility: '', contact: {} };
        B.save(); B.go('confirmation', { id: id, state: 'invite' });   /* then the Base account dialogs, as in Base */
      });
    },
    render: { 'select-vehicle': function () { return vehicle(); }, 'select-services': function () { return services(); }, 'select-appointment': function () { return appointment(); }, 'contact-details': function () { return contact(); }, 'confirmation': function () { return confirmation(); } },
    boot: function () { },
    catalogue: CAT, vehicles: VEH, photo: PHOTO
  };
  function mountChat() { setTimeout(function () { var p = document.getElementById('aria-panel'); if (p && window.AriaChat) window.AriaChat.mount(p, B); }, 0); }
})();
