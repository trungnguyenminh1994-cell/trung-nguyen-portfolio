/* BMW OSB screens: Vehicle, Services, Appointment, Contact details, Confirmation (thank you, account
   dialogs, survey). Live NZ OSB 2026-10-30; post-booking from info/references/booking-confirm-page.pdf. */
(function () {
  'use strict';
  var B = window.BMW, D = B.data, F = B.fn, esc = B.esc, ico = B.ico;
  if (B.surface !== 'osb') return;
  var S = B.store, O = S.osb;
  var ui = { search: '', more: false, lookup: '', looking: false, notFound: false, manual: false, found: null, stripStart: '', timePage: 0, month: '', svcSearch: '', submitting: false, errors: false, answers: {} };
  B.osbUi = ui;

  /* ---------- review states (opened from the demo bar) ---------- */
  B.states['select-vehicle'] = [['default', 'Default'], ['no-dealer', 'No dealership yet'], ['loading', 'Looking up rego'], ['not-found', 'Vehicle not found'], ['found', 'Confirm your vehicle'], ['manual', 'Enter car details']];
  B.states['select-services'] = [['default', 'Default'], ['expanded', 'View More'], ['selected', 'Two selected'], ['no-match', 'Search with no match']];
  B.states['select-appointment'] = [['default', 'Default'], ['loading', 'Loading availability'], ['selected', 'Date and time chosen'], ['no-slots', 'Day with no time left'], ['change-dealer', 'Change dealership warning']];
  B.states['contact-details'] = [['default', 'Default'], ['filled', 'Filled'], ['error', 'Required fields missing'], ['submitting', 'Booking…']];
  B.states['confirmation'] = [['default', 'Thank you + survey'], ['invite', 'Create account?'], ['signup', 'Create account form'], ['verify', 'Verify email'], ['skip', 'Skip creating account?'], ['submitted', 'Answers submitted'], ['unpublished', 'No published survey']];

  var st = B.state;
  if (st === 'no-dealer') O.dealerSet = false;

  /* ---------- draft helpers: a page opened directly gets the earlier steps from the sample record ---------- */
  function draft() { return O.draft; }
  function ensure(step) {
    var d = draft(), dl = B.dealer();
    if (step >= 2 && !d.vehicle) d.vehicle = B.clone(B.vehicle('DEMO01'));
    if (step >= 3 && !d.services.length) d.services = [dl.services[0]];
    if (step >= 4 && (!d.date || !d.time)) { var f = firstOpen(dl); d.date = f; d.time = slots(dl, f).filter(function (s) { return s.open; })[0].t; }
    if (F.ensure) F.ensure(step, d);
  }

  /* ---------- availability (local fixture): weekdays, from the dealer's minimum advance time, 21 days ahead ---------- */
  var FULL = { so30: ['2026-11-11'], so10: ['2026-11-12'] };
  function earliest(dl) { return B.addDays(D.today, Math.ceil(dl.leadHours / 24)); }
  function isOpen(dl, iso) {
    var w = B.wd(iso);
    if (w === 0 || w === 6) return false;
    if (iso < earliest(dl) || iso > B.addDays(D.today, 21)) return false;
    if (F.dateOpen && F.dateOpen(dl, iso) === false) return false;
    return true;
  }
  B.isOpen = isOpen;
  function slots(dl, iso) {
    var full = (FULL[dl.id] || []).indexOf(iso) >= 0 || (st === 'no-slots' && iso === firstOpen(dl));
    return D.times.map(function (t, i) {
      var taken = full || ((+iso.slice(8) + i) % 6 === 0);
      if (F.slotOpen && F.slotOpen(dl, iso, t) === false) taken = true;
      return { t: t, open: !taken };
    });
  }
  B.slots = slots;
  function firstOpen(dl) { for (var i = 0; i < 40; i++) { var x = B.addDays(D.today, i); if (isOpen(dl, x)) return x; } return D.today; }
  if (B.module === 'select-services') ensure(2);
  if (B.module === 'select-appointment') ensure(3);
  if (B.module === 'contact-details') ensure(4);

  /* ---------- frame ---------- */
  function steps(cur) {
    var list = [['Vehicle', 'select-vehicle'], ['Services', 'select-services'], ['Appointment', 'select-appointment']];
    return list.map(function (s, i) { return [s[0], B.href(s[1]), i < cur ? 'done' : i === cur ? 'current' : 'wait']; });
  }
  function frame(stepIndex, bodyHtml, footer, hero) {
    var dl = B.dealer();
    return DS_SHELL.osb({ assets: B.ASSETS, dealer: dl.name, dealerSet: O.dealerSet, steps: stepIndex == null ? null : steps(stepIndex), body: bodyHtml, footer: footer, hero: hero, phone: dl.phone, heroAction: hero ? '<a class="ds-btn ds-btn--primary" href="' + esc(B.href('select-vehicle', { fresh: 1 })) + '">Book Service</a>' : '', quick: F.quick ? F.quick() : '' });
  }
  function footer(back, next, label, enabled, extra) {
    return '<div class="osb-footer">' + (back ? '<button type="button" class="osb-back" data-action="go" data-to="' + back + '">' + ico('left', 14) + '<span>Back</span></button>' : '<span></span>') +
      (extra || '') + '<button type="button" class="ds-btn ds-btn--primary ds-btn--lg' + (ui.submitting ? ' is-loading' : '') + '" data-action="' + next + '"' + (enabled ? '' : ' disabled') + '>' + (ui.submitting ? B.spin(true) : '') + esc(label) + '</button></div>';
  }
  B.on('go', function (el) { B.go(el.dataset.to); });

  /* ---------- summary card ---------- */
  function summary(parts) {
    var d = draft(), out = '<div class="osb-summary"><h3>Booking summary</h3>';
    if (parts.indexOf('vehicle') >= 0 && d.vehicle) out += item('Vehicle', 'select-vehicle', '<span class="ds-tag ds-tag--rego">' + esc(d.vehicle.rego) + '</span><p class="osb-summary__desc">' + esc(d.vehicle.label || d.vehicle.model) + '</p>');
    if (parts.indexOf('services') >= 0 && d.services.length) out += item('Services (' + d.services.length + ')', 'select-services', '<div class="osb-summary__list">' + d.services.map(function (s) { return '<span>• ' + esc(B.service(s).name) + '</span>'; }).join('') + '</div>');
    if (parts.indexOf('appointment') >= 0 && d.date) out += item('Appointment', 'select-appointment', '<p class="osb-summary__desc">' + esc(B.long(d.date)) + '</p><p class="osb-summary__desc">' + esc(B.t12(d.time)) + '</p>' + (F.summaryExtra ? F.summaryExtra(d) : ''));
    return out + '</div>';
  }
  function item(title, module, inner) {
    return '<div class="osb-summary__item"><div><p class="osb-summary__title">' + esc(title) + '</p>' + inner + '</div><a class="osb-summary__edit" href="' + esc(B.href(module)) + '" aria-label="Edit ' + esc(title) + '">' + ico('edit', 14) + '</a></div>';
  }
  B.osbSummary = summary;

  /* ---------- dealer popover ---------- */
  function storeList() {
    var q = ui.search.toLowerCase();
    var list = S.dealers.filter(function (d) { return !d.hideOnOsb && (!q || d.name.toLowerCase().indexOf(q) >= 0); });
    if (!list.length) return '<div class="ds-empty">' + emptySvg() + '<span>No dealership found</span></div>';
    return list.map(function (d) {
      return '<div class="osb-store' + (d.id === O.dealer && O.dealerSet ? ' is-selected' : '') + '" role="button" tabindex="0" data-action="pick-dealer" data-id="' + d.id + '"><div class="osb-store__top"><span class="osb-store__name">' + esc(d.name) + '</span><span class="osb-store__brands"><img src="' + B.ASSETS + 'bmw-logo.png" alt="BMW">MINI</span></div>' +
        '<span class="osb-store__desc">' + esc(d.address) + '</span><div class="osb-store__foot"><span>' + esc(d.phone) + '</span><strong>Set As My Dealership</strong></div></div>';
    }).join('');
  }
  function emptySvg() { return '<svg viewBox="0 0 64 41" aria-hidden="true"><g transform="translate(0 1)" fill="none" fill-rule="evenodd"><ellipse fill="var(--ds-gray-3)" cx="32" cy="33" rx="32" ry="7"/><g fill-rule="nonzero" stroke="var(--ds-gray-5)"><path d="M55 12.76 44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"/><path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="var(--ds-gray-2)"/></g></g></svg>'; }
  B.emptySvg = emptySvg;
  B.on('dealer-pop', function (el) {
    var host = el.parentNode;
    if (B.floating && B.floating.host === host) { B.closeFloating(); return; }
    var pop = B.openFloating(host, '<div class="ds-affix ds-affix--lg"><input type="text" placeholder="Search dealership name" aria-label="Search dealership name" data-input="dealer-search" value="' + esc(ui.search) + '"><span class="ds-ico" aria-hidden="true">' + DS_ICONS.ico('aim', 16) + '</span></div><div class="osb-dealer__list" role="listbox" aria-label="Dealerships">' + storeList() + '</div>', 'osb-dealer__pop');
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Select dealership');
  });
  B.onInput('dealer-search', function (el) { ui.search = el.value; var l = document.querySelector('.osb-dealer__list'); if (l) l.innerHTML = storeList(); });
  B.on('pick-dealer', function (el) {
    var id = el.dataset.id, d = draft();
    B.closeFloating();
    function apply() { O.dealer = id; O.dealerSet = true; d.services = []; d.date = ''; d.time = ''; if (F.onDealerChange) F.onDealerChange(d); B.save(); B.rerender(); }
    if (id !== O.dealer && (d.services.length || d.date)) {
      B.confirm('Change dealership?', 'Your selected services and appointment will be cleared and must be selected again.', 'Change', apply);
    } else apply();
  });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('osb-store')) { e.preventDefault(); e.target.click(); } });
  B.on('enquiries', function () { B.toast('Enquiries open the dealer enquiry form (not part of this demo).', 'info-circle'); });
  B.on('login', function () { B.toast('Login opens the customer account sign-in (not part of this demo).', 'info-circle'); });

  /* =====================================================================================
     1. VEHICLE
     ===================================================================================== */
  if (B.module === 'select-vehicle') {
    if (B.qs.get('fresh')) { O.draft = { vehicle: null, services: [], note: '', date: '', time: '', mobility: '', contact: {} }; B.save(); }
    if (st === 'loading') { ui.lookup = 'DEMO01'; ui.looking = true; }
    if (st === 'not-found') { ui.lookup = 'QZX987'; ui.notFound = true; }
    if (st === 'found') { ui.lookup = 'DEMO01'; ui.found = [B.vehicle('DEMO01')]; }
    if (st === 'manual') ui.manual = true;
    if (!ui.found && O.draft.vehicle && st === 'default') { ui.lookup = O.draft.vehicle.rego; ui.found = [O.draft.vehicle]; }
  }
  var manual = { rego: '', vin: '', make: '', model: '', variant: '', year: '' };
  B.screens['select-vehicle'] = function () {
    var d = draft(), body, foot = '';
    if (ui.manual) {
      var models = manual.make ? Object.keys(D.makes[manual.make]) : [], variants = manual.make && manual.model ? D.makes[manual.make][manual.model] : [];
      var ok = manual.rego && manual.make && manual.model && manual.variant;
      body = '<h2 class="osb-title">Please enter your car details</h2><form class="osb-manual" onsubmit="return false"><div class="ds-form-row">' +
        field('License Plate Number (REGO)', true, '<input class="ds-input ds-input--lg" data-input="manual" name="rego" placeholder="Enter Number" value="' + esc(manual.rego) + '" style="text-transform:uppercase">') +
        field('VIN', false, '<input class="ds-input ds-input--lg" data-input="manual" name="vin" placeholder="Enter VIN" value="' + esc(manual.vin) + '">') + '</div><div class="ds-form-row">' +
        field('Brand', true, select('make', 'Select Brand', Object.keys(D.makes), manual.make, false)) +
        field('Model', true, select('model', 'Select Model', models, manual.model, !manual.make)) + '</div><div class="ds-form-row">' +
        field('Variant', true, select('variant', 'Select Variant', variants, manual.variant, !manual.model)) +
        field('Year', false, '<input class="ds-input ds-input--lg" data-input="manual" name="year" placeholder="Enter Year" inputmode="numeric" value="' + esc(manual.year) + '">') + '</div></form>' +
        '<button type="button" class="osb-link" data-action="to-rego">Search by rego' + ico('right', 16) + '</button>';
      foot = footer(null, 'vehicle-continue', 'Continue', !!ok);
    } else if (ui.found) {
      body = '<h2 class="osb-title osb-title--light">Confirm your vehicle</h2><div class="osb-vehicles">' + ui.found.map(function (v) {
        var sel = d.vehicle && d.vehicle.rego === v.rego;
        return '<button type="button" class="osb-vehicle' + (sel ? ' is-selected' : '') + '" data-action="pick-vehicle" data-rego="' + esc(v.rego) + '" aria-pressed="' + !!sel + '"><span class="osb-vehicle__top"><span class="osb-vehicle__name">' + esc(v.make === 'BMW_I' ? 'BMW ' + v.model : v.make + ' ' + v.model) + '</span><span class="osb-vehicle__rego">' + esc(v.rego) + '</span></span><span class="osb-vehicle__meta">' + esc(v.year + ' ' + v.variant) + '</span></button>';
      }).join('') + '</div><p class="osb-instruction--sm">NOT YOUR CAR? <button type="button" class="osb-link" data-action="to-rego">Search again' + ico('right', 16) + '</button></p>';
      foot = footer(null, 'vehicle-continue', 'Continue', !!d.vehicle);
    } else {
      var hasRego = !!ui.lookup.trim();
      body = '<h2 class="osb-title">Select your vehicle</h2><p class="osb-instruction">Enter your registration number to quickly identify your car</p>' +
        '<form class="osb-rego" data-submit="find-car"><input name="rego" aria-label="Registration number" placeholder="Enter your rego" autocomplete="off" data-input="rego" value="' + esc(ui.lookup) + '">' +
        '<button type="submit" class="ds-btn ds-btn--primary ds-btn--find' + (ui.looking ? ' is-loading' : '') + '"' + (hasRego && !ui.looking ? '' : ' disabled') + '>' + (ui.looking ? B.spin(true) : '') + 'Find my car</button>' +
        '<button type="submit" class="ds-btn ds-btn--primary ds-btn--round" aria-label="Find my car"' + (hasRego && !ui.looking ? '' : ' disabled') + '>' + ico('arrow-right', 16) + '</button></form>' +
        (ui.notFound ? '<p class="osb-rego-msg" role="alert">Vehicle not found click below to select manually</p>' : '') +
        '<div class="osb-after-search"><button type="button" class="osb-link" data-action="to-manual">Or find your car by make, model and year' + ico('right', 16) + '</button></div>';
    }
    if (F.vehicleExtra) body = F.vehicleExtra(body);
    return frame(0, body, foot);
  };
  function field(label, req, control) { return '<div class="ds-form-item"><label>' + (req ? '<span class="req">*</span>' : '') + esc(label) + (req ? '' : ' <span class="opt">( Optional )</span>') + '</label>' + control + '</div>'; }
  function select(name, ph, opts, val, disabled) {
    return '<select class="ds-select ds-input--lg" data-change="manual-select" name="' + name + '"' + (disabled ? ' disabled' : '') + ' aria-label="' + esc(ph) + '"><option value="">' + esc(ph) + '</option>' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
  }
  B.osbField = field;
  B.onInput('rego', function (el) {
    ui.lookup = el.value.toUpperCase(); ui.notFound = false;
    var b = document.querySelectorAll('.osb-rego button');
    for (var i = 0; i < b.length; i++) b[i].disabled = !ui.lookup.trim();
    var m = document.querySelector('.osb-rego-msg'); if (m) m.remove();
  });
  B.on('find-car', function () {
    if (!ui.lookup.trim() || ui.looking) return;
    ui.looking = true; ui.notFound = false; B.rerender();
    setTimeout(function () {
      ui.looking = false;
      var v = B.vehicle(ui.lookup.trim().toUpperCase());
      if (v) ui.found = [v]; else ui.notFound = true;
      B.rerender();
    }, 900);
  });
  B.on('pick-vehicle', function (el) { O.draft.vehicle = B.clone(B.vehicle(el.dataset.rego)); B.save(); B.rerender(); });
  B.on('to-rego', function () { ui.manual = false; ui.found = null; ui.notFound = false; B.rerender(); });
  B.on('to-manual', function () { ui.manual = true; B.rerender(); });
  B.onInput('manual', function (el) {
    manual[el.name] = el.name === 'rego' ? el.value.toUpperCase() : el.value;
    var ok = manual.rego && manual.make && manual.model && manual.variant;
    var c = document.querySelector('.osb-footer .ds-btn'); if (c) c.disabled = !ok;
  });
  B.onChange('manual-select', function (el) {
    manual[el.name] = el.value;
    if (el.name === 'make') { manual.model = ''; manual.variant = ''; }
    if (el.name === 'model') manual.variant = '';
    B.rerender();
  });
  B.on('vehicle-continue', function () {
    if (ui.manual) O.draft.vehicle = { rego: manual.rego, make: manual.make, model: manual.model, variant: manual.variant, year: manual.year, vin: manual.vin, label: (manual.make === 'BMW_I' ? 'BMW' : manual.make) + ' ' + manual.model + ' ' + manual.variant, manual: true };
    if (!O.draft.vehicle) return;
    B.save(); B.go('select-services');
  });

  /* =====================================================================================
     2. SERVICES
     ===================================================================================== */
  if (B.module === 'select-services') {
    if (st === 'expanded') ui.more = true;
    if (st === 'selected') { O.draft.services = ['oil', 'general']; }
    if (st === 'no-match') ui.svcSearch = 'tyre';
  }
  B.screens['select-services'] = function () {
    var dl = B.dealer(), d = draft(), q = ui.svcSearch.trim().toLowerCase();
    var all = dl.services.map(B.service).filter(function (s) { return !q || s.name.toLowerCase().indexOf(q) >= 0; });
    var shown = q || ui.more ? all : all.slice(0, 5);
    var list = shown.map(function (s) {
      var on = d.services.indexOf(s.id) >= 0;
      return '<button type="button" class="osb-svc' + (on ? ' is-checked' : '') + '" data-action="toggle-svc" data-id="' + s.id + '" aria-pressed="' + on + '"><span>' + esc(s.name) + '</span><span class="ds-check ds-check--square"><input type="checkbox" tabindex="-1"' + (on ? ' checked' : '') + ' aria-hidden="true"><span class="box"></span></span></button>';
    }).join('');
    if (!all.length) list = '<div class="ds-empty">' + emptySvg() + '<span>No data</span></div>';
    var body = '<div class="osb-cols"><div class="osb-cols__main"><h2 class="osb-title">Select your services</h2><p class="osb-instruction--sm">Multiple services can be selected</p>' +
      '<div class="ds-affix ds-affix--lg" style="margin-top:24px">' + ico('search', 16) + '<input type="text" placeholder="Search" aria-label="Search services" data-input="svc-search" value="' + esc(ui.svcSearch) + '"></div>' +
      '<div class="osb-services" style="margin-top:24px">' + list + '</div>' +
      (!q && all.length > 5 ? '<button type="button" class="osb-more" data-action="svc-more">' + (ui.more ? 'Show Less' : 'View More') + '</button>' : '') +
      (F.servicesExtra ? F.servicesExtra(d) : '') +
      '<div class="osb-notes"><label class="ds-label" for="svc-note">Notes <span class="opt">( Optional )</span></label><div class="ds-textwrap"><textarea id="svc-note" class="ds-textarea" maxlength="70" data-input="svc-note">' + esc(d.note) + '</textarea><span class="ds-count" id="svc-count">' + d.note.length + ' / 70</span></div></div>' +
      '</div><aside>' + summary(['vehicle']) + '</aside></div>';
    return frame(1, body, footer('select-vehicle', 'services-continue', 'Continue', d.services.length > 0));
  };
  B.onInput('svc-search', function (el) {
    ui.svcSearch = el.value; B.rerender();
    var i = document.querySelector('[data-input="svc-search"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  });
  B.on('svc-more', function () { ui.more = !ui.more; B.rerender(); });
  B.on('toggle-svc', function (el) {
    var d = draft(), id = el.dataset.id, i = d.services.indexOf(id);
    if (i >= 0) d.services.splice(i, 1); else d.services.push(id);
    B.save(); B.rerender();
  });
  B.onInput('svc-note', function (el) { draft().note = el.value; document.getElementById('svc-count').textContent = el.value.length + ' / 70'; B.save(); });
  B.on('services-continue', function () { if (draft().services.length) B.go('select-appointment'); });

  /* =====================================================================================
     3. APPOINTMENT
     ===================================================================================== */
  if (B.module === 'select-appointment') {
    var dl0 = B.dealer();
    if (!draft().date || !isOpen(dl0, draft().date)) { draft().date = F.gateDates && F.gateDates(draft()) ? '' : firstOpen(dl0); draft().time = ''; }
    if (st === 'selected') { draft().date = firstOpen(dl0); draft().time = '08:00'; }
    if (st === 'no-slots') { draft().date = firstOpen(dl0); draft().time = ''; }
    ui.month = (draft().date || firstOpen(dl0)).slice(0, 7);
    if (st === 'change-dealer') B.after.push(function () { var b = document.querySelector('.osb-dealer__bar'); if (b) b.click(); var c = document.querySelector('.osb-store:not(.is-selected)'); if (c) c.click(); });
  }
  B.screens['select-appointment'] = function () {
    var dl = B.dealer(), d = draft(), gate = F.gateDates && F.gateDates(d);
    var top = F.appointmentTop ? F.appointmentTop(d, dl) : '';
    var picker = '';
    if (gate) {
      picker = '<div class="osb-picker-head"><h4>Select Date</h4><span class="osb-month">' + esc(monthLabel(ui.month)) + ico('f-caret-down', 14) + '</span></div><div class="ds-alert" style="margin-top:8px">' + ico('f-info-circle', 14) + '<span>Select a mobility option to see available dates</span></div>';
    } else {
      var start = stripStart(dl), dates = [];
      for (var i = 0; i < 7; i++) dates.push(B.addDays(start, i));
      var loading = st === 'loading';
      picker = '<div class="osb-picker-head"><h4>' + esc((F.labels && F.labels.date) || 'Select from available date') + '</h4><div style="position:relative"><button type="button" class="osb-month" data-action="month-pop" aria-haspopup="listbox" aria-expanded="false">' + esc(monthLabel(ui.month)) + ico('f-caret-down', 14) + '</button></div></div>' +
        '<div class="osb-carousel"><button type="button" class="osb-carousel__arrow osb-carousel__arrow--prev" data-action="strip" data-dir="-1" aria-label="Previous dates"' + (start <= D.today ? ' disabled' : '') + '>' + ico('left', 16) + '</button><div class="osb-dates">' +
        dates.map(function (x) {
          var open = isOpen(dl, x) && !loading, sel = d.date === x && !loading;
          return '<button type="button" class="osb-date' + (sel ? ' is-selected' : '') + '" data-action="pick-date" data-date="' + x + '"' + (open ? '' : ' disabled') + ' aria-pressed="' + sel + '" aria-label="' + esc(B.WD[B.wd(x)] + ' ' + B.long(x)) + '"><span class="wd">' + B.WD[B.wd(x)] + '</span><span class="d">' + (+x.slice(8)) + '</span>' + (loading ? B.spin(true) : '') + '</button>';
        }).join('') + '</div><button type="button" class="osb-carousel__arrow osb-carousel__arrow--next" data-action="strip" data-dir="1" aria-label="Next dates">' + ico('right', 16) + '</button></div>';
      var all = d.date && !loading ? slots(dl, d.date) : D.times.map(function (t) { return { t: t, open: false }; });
      var anyOpen = all.some(function (s) { return s.open; });
      var page = all.slice(ui.timePage * 10, ui.timePage * 10 + 10);
      picker += '<div class="osb-picker-head"><h4>' + esc((F.labels && F.labels.time) || 'Select from available time') + '</h4></div>' +
        (d.date && !anyOpen && !loading ? '<p class="osb-empty-slots">No time left on this day. Please choose another date.</p>' :
          '<div class="osb-carousel"><button type="button" class="osb-carousel__arrow osb-carousel__arrow--prev" data-action="times" data-dir="-1" aria-label="Earlier times"' + (ui.timePage ? '' : ' disabled') + '>' + ico('left', 16) + '</button><div class="osb-times">' +
          page.map(function (s) { var sel = d.time === s.t; return '<button type="button" class="osb-time' + (sel ? ' is-selected' : '') + '" data-action="pick-time" data-time="' + s.t + '"' + (s.open ? '' : ' disabled') + ' aria-pressed="' + sel + '">' + s.t + '</button>'; }).join('') +
          '</div><button type="button" class="osb-carousel__arrow osb-carousel__arrow--next" data-action="times" data-dir="1" aria-label="Later times"' + ((ui.timePage + 1) * 10 >= all.length ? ' disabled' : '') + '>' + ico('right', 16) + '</button></div>');
    }
    var body = '<div class="osb-cols"><div class="osb-cols__main"><h2 class="osb-title osb-title--plain">Select An Appointment</h2>' + top + picker + '</div><aside>' + summary(['vehicle', 'services']) + '</aside></div>';
    return frame(2, body, footer('select-services', 'appointment-continue', 'Continue', !!(d.date && d.time && (!F.appointmentReady || F.appointmentReady(d)))));
  };
  function monthLabel(ym) { return B.MON[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4); }
  function stripStart(dl) {
    if (ui.stripStart) return ui.stripStart;
    var first = ui.month + '-01';
    var s = first < D.today ? D.today : first;
    if (draft().date && draft().date >= s) { while (B.addDays(s, 7) <= draft().date) s = B.addDays(s, 7); }
    return s;
  }
  B.on('strip', function (el) { var dl = B.dealer(); ui.stripStart = B.addDays(stripStart(dl), 7 * +el.dataset.dir); if (ui.stripStart < D.today) ui.stripStart = D.today; ui.month = ui.stripStart.slice(0, 7); B.rerender(); });
  B.on('times', function (el) { ui.timePage = Math.max(0, ui.timePage + +el.dataset.dir); B.rerender(); });
  B.on('pick-date', function (el) { var d = draft(); d.date = el.dataset.date; d.time = ''; ui.timePage = 0; B.save(); B.rerender(); });
  B.on('pick-time', function (el) { draft().time = el.dataset.time; B.save(); B.rerender(); });
  B.on('month-pop', function (el) {
    var months = [D.today.slice(0, 7), B.addDays(D.today.slice(0, 7) + '-01', 32).slice(0, 7), B.addDays(D.today.slice(0, 7) + '-01', 63).slice(0, 7)];
    B.openFloating(el.parentNode, months.map(function (m) { return '<button type="button" data-action="pick-month" data-month="' + m + '"' + (m === ui.month ? ' class="is-active"' : '') + '>' + monthLabel(m) + '</button>'; }).join(''), 'ds-dropdown').style.cssText = 'right:0;top:28px';
  });
  B.on('pick-month', function (el) {
    B.closeFloating(); ui.month = el.dataset.month; var first = ui.month + '-01'; ui.stripStart = first < D.today ? D.today : first;
    var dl = B.dealer(), d = draft(); d.date = ''; d.time = '';
    for (var i = 0; i < 31; i++) { var x = B.addDays(ui.stripStart, i); if (x.slice(0, 7) !== ui.month) break; if (isOpen(dl, x)) { d.date = x; break; } }
    B.save(); B.rerender();
  });
  B.on('appointment-continue', function () { var d = draft(); if (d.date && d.time) B.go('contact-details'); });

  /* =====================================================================================
     4. CONTACT DETAILS
     ===================================================================================== */
  var SAMPLE_CONTACT = { first: 'Jamie', last: 'Reed', mobile: '+64 21 555 0102', email: 'jamie.reed@example.com', address: '7 Sample Lane', city: 'Auckland', postcode: '2013', suburb: 'Botany', company: '', note: '' };
  if (B.module === 'contact-details') {
    if (st === 'filled' || st === 'submitting') O.draft.contact = B.clone(SAMPLE_CONTACT);
    if (st === 'error') { O.draft.contact = { first: 'Jamie' }; ui.errors = true; }
    if (st === 'submitting') ui.submitting = true;
  }
  var REQ = ['first', 'last', 'mobile', 'email', 'address', 'city'];
  function contactValid(c) { return REQ.every(function (k) { return (c[k] || '').trim(); }) && /.+@.+\..+/.test(c.email || ''); }
  B.screens['contact-details'] = function () {
    var c = draft().contact || {};
    function inp(k, label, req, attrs) {
      var bad = ui.errors && req && !(c[k] || '').trim();
      return '<div class="ds-form-item"><label for="f-' + k + '">' + (req ? '<span class="req">*</span>' : '') + esc(label) + (req ? '' : ' <span class="opt">( Optional )</span>') + '</label><input id="f-' + k + '" class="ds-input ds-input--lg' + (bad ? ' is-error' : '') + '" data-input="contact" name="' + k + '" value="' + esc(c[k] || '') + '"' + (attrs || '') + (req ? ' required aria-required="true"' : '') + '>' + (bad ? '<span class="ds-help">Please enter ' + esc(label.toLowerCase()) + '</span>' : '') + '</div>';
    }
    var body = '<div class="osb-cols osb-contact"><div class="osb-cols__main"><h2 class="osb-title" style="line-height:30px">Contact details</h2><p class="osb-instruction">Please add your contact details to make a booking</p><form onsubmit="return false" novalidate>' +
      '<div class="ds-form-row">' + inp('first', 'First Name', true, ' autocomplete="given-name"') + inp('last', 'Last Name', true, ' autocomplete="family-name"') + '</div>' +
      inp('mobile', 'Mobile Number', true, ' type="tel" autocomplete="tel"') + inp('email', 'Email', true, ' type="email" autocomplete="email"') + inp('address', 'Address', true, ' autocomplete="street-address"') + inp('city', 'Town/City', true, ' autocomplete="address-level2"') +
      '<div class="ds-form-row">' + inp('postcode', 'Postcode', false, ' autocomplete="postal-code"') + inp('suburb', 'Suburb', false) + '</div>' + inp('company', 'Company Name', false, ' autocomplete="organization"') +
      '<div class="ds-form-item"><label for="f-note">Notes <span class="opt">( Optional )</span></label><textarea id="f-note" class="ds-textarea" style="height:91px;font-size:16px" data-input="contact" name="note">' + esc(c.note || '') + '</textarea></div>' +
      '<p class="osb-privacy">By clicking book now, you are agreeing to the <a href="#" data-action="privacy">BMW Privacy Policy</a>. Our Privacy Policy outlines how we collect, hold, use and disclose your personal information.</p></form>' +
      (F.contactExtra ? F.contactExtra(draft()) : '') + '</div><aside>' + summary(['vehicle', 'services', 'appointment']) + '</aside></div>';
    return frame(null, body, footer('select-appointment', 'book-now', 'Book now', contactValid(c) && !ui.submitting));
  };
  B.on('privacy', function () { B.toast('Opens the dealer privacy policy in a new tab (not part of this demo).', 'info-circle'); });
  B.onInput('contact', function (el) {
    var c = draft().contact || (draft().contact = {}); c[el.name] = el.value; B.save();
    if (ui.errors && el.classList.contains('is-error') && el.value.trim()) { el.classList.remove('is-error'); var h = el.parentNode.querySelector('.ds-help'); if (h) h.remove(); }
    var btn = document.querySelector('.osb-footer .ds-btn'); if (btn) btn.disabled = !contactValid(c);
  });
  B.on('book-now', function () {
    var d = draft(), c = d.contact;
    if (!contactValid(c) || ui.submitting) { ui.errors = true; B.rerender(); return; }
    ui.submitting = true; B.rerender();
    setTimeout(function () {
      var id = B.createBooking(d, O.dealer, 'online');
      O.last = id; O.account = null; S.admin.dealer = O.dealer;
      O.draft = { vehicle: null, services: [], note: '', date: '', time: '', mobility: '', contact: {} };
      B.save(); B.go('confirmation', { id: id, state: 'invite' });
    }, 900);
  });

  /* booking record shared with Admin and the email previews */
  B.createBooking = function (d, dealer, source) {
    var c = d.contact, cust = null;
    S.customers.forEach(function (x) { if (x.email.toLowerCase() === (c.email || '').toLowerCase()) cust = x; });
    if (!cust) {
      cust = { id: 'c' + (S.customers.length + 1) + '-' + Date.now().toString(36), first: c.first, last: c.last, mobile: c.mobile, email: c.email, address: c.address, city: c.city, postcode: c.postcode || '', suburb: c.suburb || '', company: c.company || '', vehicles: [], dealer: dealer, active: true, note: '' };
      S.customers.unshift(cust);
    }
    if (cust.vehicles.indexOf(d.vehicle.rego) < 0) cust.vehicles.push(d.vehicle.rego);
    var wip = B.nextWip(), now = B.now();
    var b = {
      id: 'b' + wip, wip: wip, customer: cust.id, rego: d.vehicle.rego, vehicle: B.vehicle(d.vehicle.rego) ? null : d.vehicle, dealer: dealer, date: d.date, time: d.time, status: 'booked', source: source,
      items: d.services.map(function (s) { return { service: s, note: '' }; }), created: now, note: c.note || d.note || '', mobility: d.mobility || '', dropOff: false, promo: 0, type: 'Service',
      conditions: { scratch: [], dent: [], mark: [] },
      log: [{ at: now, user: 'Customer', who: 'customer', action: 'Create', what: 'OSB', detail: 'WIP #' + wip + ' created' }]
    };
    if (F.onCreate) F.onCreate(b, d);
    S.bookings.unshift(b);
    return b.id;
  };

  /* =====================================================================================
     5. CONFIRMATION + SURVEY + ACCOUNT
     ===================================================================================== */
  function lastBooking() {
    var id = B.qs.get('id') || O.last, b = id && B.booking(id);
    if (!b) { b = S.bookings.filter(function (x) { return x.dealer === O.dealer && x.source === 'online'; })[0] || S.bookings[0]; }
    return b;
  }
  if (B.module === 'confirmation') {
    var cb = lastBooking();
    if (st === 'submitted' && !responseFor(cb)) { var dl1 = B.dealer(cb.dealer); var a = {}; dl1.survey.questions.forEach(function (q, i) { a[q.id] = q.type === 'short' ? '' : q.options[i % 2 ? 1 : 0]; }); saveResponse(cb, a); }
    if (['invite', 'signup', 'verify', 'skip'].indexOf(st) >= 0) B.after.push(function () { account(st); });
  }
  function responseFor(b) { for (var i = 0; i < S.responses.length; i++) if (S.responses[i].booking === b.id) return S.responses[i]; return null; }
  function saveResponse(b, answers) {
    if (responseFor(b)) return;
    S.responses.unshift({ id: 'r' + Date.now().toString(36), dealer: b.dealer, customer: b.customer, booking: b.id, date: D.today, answers: answers, status: 'Active' });
    b.log.push({ at: B.now(), user: 'Customer', who: 'customer', action: 'Update', what: 'Survey', detail: 'Survey answers submitted' });
    B.save();
  }
  /* the dealer's published survey for a booking; shared with functions that redraw the Thank you page */
  function surveyHtml(b) {
    var dl = B.dealer(b.dealer), resp = responseFor(b), survey = dl.survey;
    if (survey.status !== 'published' || st === 'unpublished') return '';
    return '<hr><form class="osb-survey" data-submit="survey-submit"><h3>Help us prepare for your visit</h3>' + survey.questions.map(function (q, i) {
        var val = resp ? resp.answers[q.id] : ui.answers[q.id], dis = resp ? ' disabled' : '';
        var inner;
        if (q.type === 'short') inner = '<input class="ds-input" name="' + q.id + '" aria-label="' + esc(q.text) + '" value="' + esc(val || '') + '"' + dis + ' data-input="survey">';
        else inner = '<div class="osb-survey__opts" role="' + (q.type === 'multiple' ? 'group' : 'radiogroup') + '" aria-label="' + esc(q.text) + '">' + q.options.map(function (o) {
          var on = q.type === 'multiple' ? (val || []).indexOf(o) >= 0 : val === o;
          return q.type === 'multiple'
            ? '<label class="ds-check"><input type="checkbox" name="' + q.id + '" value="' + esc(o) + '"' + (on ? ' checked' : '') + dis + ' data-change="survey"><span class="box"></span><span>' + esc(o) + '</span></label>'
            : '<label class="ds-radio"><input type="radio" name="' + q.id + '" value="' + esc(o) + '"' + (on ? ' checked' : '') + dis + ' data-change="survey"><span class="dot"></span><span>' + esc(o) + '</span></label>';
        }).join('') + '</div>';
        return '<div class="osb-survey__q"><p>' + (i + 1) + '. ' + esc(q.text) + '</p>' + inner + '</div>';
      }).join('') + (resp ? '<p class="osb-survey__done" role="status">' + ico('check', 14) + 'Answers submitted</p>' : '<button type="submit" class="ds-btn ds-btn--primary ds-btn--lg">Submit</button>') + '</form>';
  }
  B.osbSurvey = surveyHtml;
  B.lastBooking = lastBooking;
  B.screens['confirmation'] = function () {
    var b = lastBooking(), dl = B.dealer(b.dealer), qs = surveyHtml(b), showSurvey = !!qs;
    var body = '<section class="osb-thanks" aria-labelledby="thanks-title"><span class="osb-thanks__check">' + ico('check', 34) + '</span><h2 id="thanks-title">Thank you!</h2>' +
      '<p class="osb-thanks__lead">Your booking <b># ' + b.wip + '</b> is confirmed.<br>Please check your email for a booking confirmation.</p>' +
      '<p class="osb-thanks__dealer">' + ico('location', 16) + esc(dl.short) + '</p><p class="osb-thanks__addr">' + esc(dl.address) + '</p>' +
      '<p class="osb-thanks__when">' + ico('calendar', 16) + esc(B.long(b.date) + ' - ' + B.t12(b.time)) + '</p>' + (F.confirmExtra ? F.confirmExtra(b) : '') +
      '<button type="button" class="osb-thanks__cal" data-action="add-calendar">Add To Calendar</button>' + qs +
      '<a class="ds-btn ds-btn--default ds-btn--lg" style="margin-top:' + (showSurvey ? 16 : 40) + 'px" href="' + esc(B.href('select-vehicle', { fresh: 1 })) + '">Back to Book a service</a>' +
      '<p class="osb-thanks__help">If you have any questions, please email:<a href="mailto:' + esc(dl.enquiries) + '">' + esc(dl.enquiries) + '</a></p></section>';
    return frame(null, body, '', 'brand');
  };
  B.onChange('survey', function (el) {
    if (el.type === 'checkbox') { var arr = ui.answers[el.name] || (ui.answers[el.name] = []); var i = arr.indexOf(el.value); if (el.checked && i < 0) arr.push(el.value); if (!el.checked && i >= 0) arr.splice(i, 1); }
    else ui.answers[el.name] = el.value;
  });
  B.onInput('survey', function (el) { ui.answers[el.name] = el.value; });
  B.on('survey-submit', function () {
    var b = lastBooking();
    if (responseFor(b)) return;
    saveResponse(b, B.clone(ui.answers)); B.rerender();
  });
  B.on('add-calendar', function () {
    var b = lastBooking(), dl = B.dealer(b.dealer);
    var start = b.date.replace(/-/g, '') + 'T' + b.time.replace(':', '') + '00';
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BMW Service demo//EN', 'BEGIN:VEVENT', 'UID:' + b.id + '@example.com', 'DTSTART;TZID=' + dl.timezone + ':' + start, 'SUMMARY:BMW Service booking #' + b.wip, 'LOCATION:' + dl.short + ', ' + dl.address, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'bmw-service-' + b.wip + '.ics'; document.body.appendChild(a); a.click(); a.remove();
  });

  /* account dialogs: invite → sign up → verify; skip → are you sure. Booking stays confirmed either way. */
  var timer = null;
  function account(step) {
    var b = lastBooking(), cust = B.customer(b.customer) || { first: 'there', email: '' };
    clearInterval(timer);
    if (step === 'invite') {
      B.modal('<h2>Create new account</h2><p class="osb-dialog__msg">Hi <b>' + esc(cust.first) + '</b>, Would you like to create an account?</p><div class="osb-dialog__actions"><button type="button" class="ds-btn ds-btn--primary" data-action="acct" data-step="signup">Yes</button><button type="button" class="ds-btn ds-btn--default" data-action="acct" data-step="skip">Skip</button></div>', { cls: 'osb-dialog', label: 'Create new account' });
    } else if (step === 'signup') {
      B.modal('<h2>Create new account</h2><form data-submit="acct-create" novalidate><div class="ds-form-item"><label for="a-email">Email</label><input id="a-email" class="ds-input" value="' + esc(cust.email) + '" disabled></div>' +
        pass('a-pass', 'Password') + pass('a-pass2', 'Confirm Password') + '<p class="ds-help" id="a-err" hidden></p><button type="submit" class="ds-btn ds-btn--primary ds-btn--block" style="margin-top:8px">Create Account</button></form>', { cls: 'osb-dialog', label: 'Create new account' });
    } else if (step === 'verify') {
      var left = 60;
      B.modal('<h2>Verify your email</h2><p class="osb-dialog__msg" style="margin-top:24px">Please enter the code sent to:<br><b>' + esc(cust.email) + '</b></p><form data-submit="acct-verify"><div class="osb-otp">' + [1, 2, 3, 4, 5, 6].map(function (i) { return '<input inputmode="numeric" maxlength="1" aria-label="Digit ' + i + '" data-input="otp">'; }).join('') + '</div><button type="submit" class="ds-btn ds-btn--primary ds-btn--block">Verify</button></form>' +
        '<p class="osb-dialog__resend">Didn\'t receive the code? <button type="button" data-action="acct-resend" disabled>Resend (<span id="otp-left">60</span>s)</button></p><p class="osb-or">Or</p><button type="button" class="ds-btn ds-btn--link" data-action="acct" data-step="signup" style="font-weight:700">Back to Sign Up</button>', { cls: 'osb-dialog', label: 'Verify your email', onClose: function () { clearInterval(timer); } });
      timer = setInterval(function () {
        left--;
        var s = document.getElementById('otp-left'), rb = document.querySelector('[data-action="acct-resend"]');
        if (!s || !rb) { clearInterval(timer); return; }
        if (left > 0) { s.textContent = left; return; }
        clearInterval(timer); rb.disabled = false; rb.textContent = 'Resend';
      }, 1000);
    } else if (step === 'skip') {
      B.modal('<h2 class="plain">Are you sure ?</h2><p class="osb-dialog__msg">Do you want to skip creating account ?</p><div class="osb-dialog__actions"><button type="button" class="ds-btn ds-btn--primary" data-action="acct-skip">Yes, skip</button><button type="button" class="ds-btn ds-btn--default" data-action="acct" data-step="invite">No</button></div>', { cls: 'osb-dialog', label: 'Skip creating account' });
    }
  }
  function pass(id, label) { return '<div class="ds-form-item"><label for="' + id + '">' + label + '</label><div class="osb-pass"><input id="' + id + '" type="password" class="ds-input" autocomplete="new-password"><button type="button" data-action="peek" data-for="' + id + '" aria-label="Show password">' + ico('eye-invisible', 16) + '</button></div></div>'; }
  B.on('acct', function (el) { account(el.dataset.step); });
  B.on('peek', function (el) { var i = document.getElementById(el.dataset.for); var show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = ico(show ? 'eye' : 'eye-invisible', 16); el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); });
  B.on('acct-create', function () {
    var p = document.getElementById('a-pass').value, q = document.getElementById('a-pass2').value, err = document.getElementById('a-err');
    if (p.length < 8) { err.hidden = false; err.textContent = 'Password must be at least 8 characters'; return; }
    if (p !== q) { err.hidden = false; err.textContent = 'Passwords do not match'; return; }
    account('verify');
  });
  B.onInput('otp', function (el) { el.value = el.value.replace(/\D/g, '').slice(0, 1); if (el.value && el.nextElementSibling) el.nextElementSibling.focus(); });
  B.on('acct-resend', function () { B.toast('A new code was sent (demo).', 'mail'); account('verify'); });
  B.on('acct-verify', function () {
    var v = [].map.call(document.querySelectorAll('.osb-otp input'), function (i) { return i.value; }).join('');
    if (v.length < 6) { document.querySelectorAll('.osb-otp input').forEach(function (i) { if (!i.value) i.classList.add('is-error'); }); return; }
    clearInterval(timer); O.account = 'created'; B.save(); B.closeModal(true); B.toast('Account created');
  });
  B.on('acct-skip', function () { O.account = 'skipped'; B.save(); B.closeModal(true); });
})();
