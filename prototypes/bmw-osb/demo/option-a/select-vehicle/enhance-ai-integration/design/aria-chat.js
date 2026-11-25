/* Aria AI assistant · Enhance & AI Integration (BMW AU).
   Port of the original proposal's aria-chat.js (2026-10-27) to the BMW design system: same scripted
   conversation, chips, cards and live context panel; markup uses function.css classes and tokens.
   Sample data follows sample-data.md (fiction phone number, sample plates and address).
   The outcome is written to the booking draft so the manual steps continue from it. */
(function () {
  'use strict';
  var B = null, el = {}, step = null, busy = false;
  var S = {};
  var VEH1 = { title: '2023 BMW 3 Series 330i', rego: 'DEMO01', variant: 'Base Model', mileage: '45,000 KM' };
  var VEH2 = { title: 'BMW Z4 M40i Roadster', rego: 'DEMO06', variant: 'M Sport', mileage: '28,400 KM' };
  var PHONE = '0491 570 156';
  function fresh() {
    S = { name: 'Putri', phone: PHONE, severity: null, vehicle: VEH1, appointment: null, pickup: null, confirmed: false,
      services: [{ id: 'ai-bsi', name: 'BSI Package', price: 'Confirm with advisor', amount: 0 }, { id: 'ai-oil', name: 'Engine Oil - 19,000 km', price: '$259.00', amount: 259 }, { id: 'ai-rearbrake', name: 'Rear Brake Service', price: '$89.00', amount: 89 }] };
  }
  function ico(n, s) { return B.ico(n, s || 16); }
  function esc(s) { return B.esc(s); }
  function dealer() { return B.dealer().short; }
  function slots() {
    var out = [], dl = B.dealer();
    for (var i = 0; i < 30 && out.length < 5; i++) { var x = B.addDays(B.data.today, i); if (B.isOpen(dl, x)) out.push(x); }
    var times = ['09:30', '14:00', '08:00', '11:00', '07:30'];
    return out.map(function (iso, k) { return { label: B.WD[B.wd(iso)] + ' ' + (+iso.slice(8)) + ' ' + B.MON[+iso.slice(5, 7) - 1], right: B.t12(times[k]).replace(/^0/, ''), iso: iso, t: times[k], tag: k ? '' : 'Earliest', act: 'slot', go: 'pickup' }; });
  }

  /* ---------- panel ---------- */
  function panelHTML() {
    return '<div class="aria-chat" role="region" aria-label="Chat with Aria"><div class="aria-chat__head">' + ico('ai', 16) + '<span>Aria Live</span><button type="button" id="aria-restart">Restart</button></div>' +
      '<div class="aria-scroll" id="aria-scroll"><div class="aria-thread" id="aria-thread" aria-live="polite"></div></div><div class="aria-chips" id="aria-chips"></div>' +
      '<div class="aria-compose"><button type="button" class="add" id="aria-add" aria-label="Attach">' + ico('plus', 14) + '</button><input type="text" id="aria-input" placeholder="Chat with Aria" autocomplete="off" aria-label="Message Aria"><button type="button" class="send" id="aria-send" aria-label="Send">' + ico('send', 14) + '</button></div></div>' +
      '<div class="aria-context" id="aria-context"></div>';
  }
  function vehicleCard() {
    var v = S.vehicle;
    return '<div id="aria-card-vehicle" class="ai-vinfo aria-msg"><div style="width:100%"><h3 style="margin-top:0">Vehicle information</h3><div class="ai-card"><div class="ai-card__title">' + esc(v.title) + '</div>' +
      '<div class="ai-card__row"><span>' + ico('swap', 18) + 'REGO</span><span class="ai-plate">' + esc(v.rego) + '</span></div><div class="ai-card__row"><span>' + ico('f-dashboard', 18) + 'Variant</span><b>' + esc(v.variant) + '</b></div><div class="ai-card__row"><span>' + ico('clock-circle', 18) + 'Mileage</span><b>' + esc(v.mileage) + '</b></div></div>' +
      '<div class="ai-bsi"><div class="ai-bsi__head">' + ico('f-exclamation-circle', 16) + '<span>BSI Package is active and will expire on 30/11/2026</span></div><div class="ai-bsi__body"><h4>Service Inclusive</h4><button type="button" data-action="ai-bsi-list">View Services</button></div></div>' +
      '<div id="aria-cbs" class="ai-card" style="margin-top:16px"><div class="ai-due__head" style="font-size:15px;font-weight:400">' + ico('warning', 16) + '2 Condition Based Services need action now</div><div class="ai-card__row" style="border-top:0"><b style="font-weight:700">Engine Oil - 19,000 km</b><b>$259.00</b></div><div class="ai-card__row"><b style="font-weight:700">Rear Brake Service</b><b>$89.00</b></div></div></div></div>';
  }
  function summaryCard() {
    var total = 0, lines = S.services.map(function (s) { total += s.amount || 0; return '<div class="ai-summary__line" style="font-size:15px;line-height:24px"><span>• ' + esc(s.name) + '</span><span>' + esc(s.price) + '</span></div>'; }).join('');
    var head = function (l, act) { return '<div class="h"><span>' + l + '</span>' + (act ? '<button type="button" data-aria-edit="' + act + '" aria-label="Edit ' + l + '">' + ico('edit', 16) + '</button>' : '') + '</div>'; };
    var appt = S.appointment ? '<p class="ai-summary__mode" style="font-size:15px">' + (S.pickup ? 'Pickup &amp; Delivery' : 'Fast Lane') + '</p><p class="ai-summary__desc" style="font-size:15px">' + esc(S.appointment.date) + '</p><p class="ai-summary__desc" style="font-size:15px">' + esc(S.appointment.time) + '</p>' + (S.pickup ? '<p class="ai-summary__desc" style="font-size:13px">Collection: ' + esc(S.pickup) + '</p>' : '') : '<p class="ai-summary__desc" style="font-size:15px">Not set</p>';
    return '<div id="aria-card-summary" class="aria-sumcard aria-msg"><div style="width:100%"><h3>Booking Summary</h3><div class="box"><div>' + head('Vehicle', 'vehicle') + '<span class="ai-plate" style="display:inline-block;margin-bottom:4px">' + esc(S.vehicle.rego) + '</span><p class="ai-summary__desc" style="font-size:15px">' + esc(S.vehicle.title) + '</p></div>' +
      '<div>' + head('Appointment', 'appointment') + appt + '</div><div>' + head('Services (' + S.services.length + ')', 'services') + '<p class="ai-summary__dealer" style="font-size:15px">' + esc(dealer()) + '</p>' + lines +
      '<div class="ai-summary__total"><span>Estimated total</span><b>$' + total.toFixed(2) + '</b></div></div>' +
      (S.confirmed ? '<div class="aria-ok">' + ico('f-check-circle', 18) + '<span>Booking confirmed &middot; Ref <strong>OSB-240118</strong></span></div>' : '<button type="button" id="aria-confirm" class="ds-btn ds-btn--primary ds-btn--block" style="height:44px;font-weight:700">Confirm Booking</button>') + '</div></div></div>';
  }
  function showVehicleCard() { if (document.getElementById('aria-card-vehicle')) return; el.context.insertAdjacentHTML('beforeend', vehicleCard()); save(); }
  function showSummaryCard() {
    var old = document.getElementById('aria-card-summary'); if (old) old.remove();
    el.context.insertAdjacentHTML('beforeend', summaryCard());
    var n = document.getElementById('aria-card-summary'); setTimeout(function () { if (n.scrollIntoView) n.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 120);
    save();
  }
  function flashCBS() { var n = document.getElementById('aria-cbs'); if (!n) return; n.classList.add('aria-flash'); if (n.scrollIntoView) n.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { n.classList.remove('aria-flash'); }, 2600); }
  function save() {
    var d = B.store.osb.draft;
    d.vehicle = B.clone(B.vehicle(S.vehicle.rego));
    d.services = S.services.map(function (s) { return s.id; });
    if (S.appointment) { d.date = S.appointment.iso; d.time = S.appointment.t; }
    var a = d.ai || (d.ai = { state: 'NSW', fastLane: '', loanCar: false, callback: false });
    if (S.pickup) a.pickup = S.pickup;
    if (S.severity) a.callback = true;
    B.save();
  }

  /* ---------- messages ---------- */
  function scroll() { if (el.scroll) { el.scroll.scrollTop = el.scroll.scrollHeight; setTimeout(function () { el.scroll.scrollTop = el.scroll.scrollHeight; }, 60); } }
  function md(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function addAria(text) { el.thread.insertAdjacentHTML('beforeend', '<div class="aria-msg">' + ico('ai', 16) + '<p>' + md(text) + '</p></div>'); scroll(); }
  function addUser(text) { el.thread.insertAdjacentHTML('beforeend', '<div class="aria-user"><div>' + esc(text) + '</div></div>'); scroll(); }
  function addPhoto() { el.thread.insertAdjacentHTML('beforeend', '<div class="aria-user"><img src="' + B.fn.photo() + '" alt="Warning light"></div>'); scroll(); }
  function typing(on) {
    var t = document.getElementById('aria-typing');
    if (on && !t) { el.thread.insertAdjacentHTML('beforeend', '<div id="aria-typing" class="aria-msg">' + ico('ai', 16) + '<span class="aria-typing" aria-label="Aria is typing"><i></i><i></i><i></i></span></div>'); scroll(); }
    else if (!on && t) t.remove();
  }
  function chips(list) {
    el.chips.innerHTML = '';
    (list || []).forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.textContent = c.label; b.addEventListener('click', function () { pick(c); }); el.chips.appendChild(b); });
    scroll();
  }
  function cards(cfg) {
    var box = document.createElement('div'); box.className = 'aria-cards'; var picked = [];
    var list = document.createElement('div');
    function row(item) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'aria-row';
      b.innerHTML = '<span style="display:flex;align-items:center;min-width:0">' + (cfg.multi ? '<span class="aria-box">' + ico('check', 12) + '</span>' : '') + '<span style="min-width:0"><b>' + esc(item.label) + (item.tag ? '<span class="tag">' + esc(item.tag) + '</span>' : '') + '</b>' + (item.note ? '<small>' + esc(item.note) + '</small>' : '') + '</span></span><span class="r">' + esc(item.right || '') + '</span>';
      b.addEventListener('click', function () {
        if (busy) return;
        if (cfg.multi) { var i = picked.indexOf(item); if (i > -1) { picked.splice(i, 1); b.classList.remove('is-picked'); } else { picked.push(item); b.classList.add('is-picked'); } b.setAttribute('aria-pressed', i < 0); return; }
        box.classList.add('is-locked'); b.classList.add('is-picked'); addUser(item.label + ' · ' + item.right);
        if (item.act && ACT[item.act]) ACT[item.act](item);
        if (item.go) setTimeout(function () { go(item.go); }, 220);
      });
      return b;
    }
    cfg.items.forEach(function (it) { list.appendChild(row(it)); });
    box.appendChild(list);
    var foot = document.createElement('div'); foot.className = 'aria-cards__foot';
    if (cfg.more) { var m = document.createElement('button'); m.type = 'button'; m.className = 'more'; m.textContent = cfg.more.label; m.addEventListener('click', function () { cfg.more.items.forEach(function (it) { list.appendChild(row(it)); }); m.remove(); scroll(); }); foot.appendChild(m); }
    if (cfg.link) { var l = document.createElement('button'); l.type = 'button'; l.className = 'lk'; l.textContent = cfg.link.label; l.addEventListener('click', function () { if (ACT[cfg.link.act]) ACT[cfg.link.act](); }); foot.appendChild(l); }
    if (cfg.multi) {
      var sk = document.createElement('button'); sk.type = 'button'; sk.className = 'lk'; sk.style.marginLeft = '0'; sk.textContent = cfg.skip.label;
      sk.addEventListener('click', function () { if (busy) return; box.classList.add('is-locked'); addUser(cfg.skip.label); setTimeout(function () { go(cfg.skip.go); }, 220); });
      var cta = document.createElement('button'); cta.type = 'button'; cta.className = 'cta'; cta.textContent = cfg.cta.label;
      cta.addEventListener('click', function () { if (busy) return; box.classList.add('is-locked'); if (!picked.length) addUser(cfg.skip.label); else { addUser(picked.map(function (i) { return i.label; }).join(', ')); picked.forEach(function (i) { if (i.act && ACT[i.act]) ACT[i.act](i); }); } setTimeout(function () { go(cfg.cta.go); }, 220); });
      foot.appendChild(sk); foot.appendChild(cta);
    }
    if (foot.children.length) box.appendChild(foot);
    el.thread.appendChild(box); scroll();
  }

  /* ---------- conversation script (original FLOW) ---------- */
  var FLOW = {
    start: { say: ["Hi, I'm Aria, how can i help you ?"], chips: [{ label: 'Warning Light Showing', go: 'warn_photo' }, { label: 'Book BSI services', go: 'lookup_ask' }, { label: 'Check CBS', go: 'lookup_ask' }] },
    warn_photo: { say: ['Sorry to hear that. Could you share a photo and a short description of your warning light?'], chips: [{ label: 'Send photo', act: 'photo', go: 'warn_severity' }] },
    warn_severity: { say: ['Thanks. Is the light **red** or **amber**?'], chips: [{ label: 'Red', act: 'sev_red', go: 'warn_red' }, { label: 'Amber', act: 'sev_amber', go: 'warn_amber' }, { label: "I'm not sure", go: 'warn_red' }] },
    warn_red: { say: ["A red light means stop as soon as it's safe. Please don't keep driving.", "If you're on the road right now, call BMW Roadside Assist on **[roadside number]**."], go: 'warn_contact' },
    warn_amber: { say: ['An amber light is safe to drive on for short trips, but it should be looked at soon.', "I'll get a Service Concierge onto it."], go: 'warn_contact' },
    warn_contact: { say: ['Before I pass this along to a Service Concierge, could you give me your name and phone number?'], chips: [{ label: 'Putri · ' + PHONE, act: 'contact', go: 'warn_confirm' }] },
    warn_confirm: { say: ['Got it. **Putri**, **' + PHONE + '**. Is that right?'], chips: [{ label: "Yes, that's right", go: 'warn_done' }, { label: 'Edit', go: 'warn_contact' }] },
    warn_done: { say: ['Thanks. A Service Concierge will call you shortly, please keep an eye on your phone.', "Anything else I can help with? I can check what's covered under your **Service Inclusive**, or see if your car needs anything else."], chips: [{ label: 'Yes, i want to do both', go: 'lookup_ask' }, { label: 'Just Service Inclusive', go: 'lookup_ask' }, { label: 'No thanks', go: 'bye' }] },
    lookup_ask: { say: ["I'll look up your vehicle with the number you gave me, **" + PHONE + '**. Is that the one?'], chips: [{ label: 'Ok', go: 'lookup_found' }, { label: 'Use another number', go: 'lookup_rego' }] },
    lookup_rego: { say: ["No problem. What's your registration number?"], chips: [{ label: VEH1.rego, act: 'veh1', go: 'lookup_found' }, { label: VEH2.rego, act: 'veh2', go: 'lookup_found' }] },
    lookup_found: { act: 'vehicle_card', say: ['Found it. **{{vehicle}}**, {{mileage}} on the clock.', 'Your **Service Inclusive** is still active, and **2 Condition Based Services** need action now. Want me to book those in?'], after: 'flash_cbs', chips: [{ label: 'Yup', go: 'other_services' }, { label: 'Not now', go: 'bye' }] },
    other_services: { say: ["Would you like to look at other services while we're at it?"], chips: [{ label: 'No', go: 'slots' }, { label: 'Show me', go: 'more_services' }] },
    more_services: { say: ['These are popular for your 3 Series at 45,000 km:'], cards: { multi: true, items: [{ label: 'Wheel Alignment', note: 'Recommended every 20,000 km', right: '$149.00', act: 'add_align' }, { label: 'Cabin Filter', note: 'Last replaced 2 years ago', right: '$89.00', act: 'add_filter' }, { label: 'Wiper Blades', note: 'Front pair', right: '$65.00', act: 'add_wiper' }], cta: { label: 'Add to booking', go: 'slots' }, skip: { label: 'Nothing else', go: 'slots' } } },
    slots: { say: ['Let me find the earliest slots for you.', 'These are open at **{{dealer}}**:'], cards: 'SLOTS' },
    pickup: { say: ['Since your vehicle has a warning light on, I can arrange our **Pickup & Delivery** service. Is that okay?'], chips: [{ label: 'Yes', go: 'pickup_addr' }, { label: "No, I'll drive in", go: 'summary' }] },
    pickup_addr: { say: ['Where should we collect the car?'], chips: [{ label: 'Home · 12 Example St, Melbourne', act: 'pickup_home', go: 'summary' }, { label: 'Concierge will confirm by phone', act: 'pickup_phone', go: 'summary' }] },
    summary: { act: 'summary_card', say: ['All set. Take a look at the summary on the right and confirm your booking details.'], chips: [] },
    confirmed: { say: ["Thanks for booking with us, we'll see you soon!", 'Your reference is **OSB-240118**. I sent the details to **' + PHONE + '**.'], chips: [{ label: 'Add to calendar', go: 'bye' }, { label: 'Start over', act: 'restart' }] },
    bye: { say: ["No problem. I'm here if you need anything else."], chips: [{ label: 'Start over', act: 'restart' }] }
  };
  var ACT = {
    photo: function () { addPhoto(); addUser('The light flashes on and off while driving on my BMW 3 Series'); },
    sev_red: function () { S.severity = 'red'; }, sev_amber: function () { S.severity = 'amber'; }, contact: function () {},
    veh1: function () { S.vehicle = VEH1; }, veh2: function () { S.vehicle = VEH2; },
    vehicle_card: showVehicleCard, flash_cbs: flashCBS,
    add_align: function () { add('ai-align', 'Wheel Alignment', 149); }, add_filter: function () { add('ai-cabin', 'Cabin Filter', 89); }, add_wiper: function () { add('ai-wiper', 'Wiper Blades', 65); },
    slot: function (item) { S.appointment = { date: item.label, time: item.right, iso: item.iso, t: item.t }; },
    pickup_home: function () { S.pickup = '12 Example St, Melbourne'; add('ai-pickup', 'Pickup & Delivery', 0, 'Included'); },
    pickup_phone: function () { S.pickup = 'Concierge will confirm by phone'; add('ai-pickup', 'Pickup & Delivery', 0, 'Included'); },
    summary_card: showSummaryCard,
    manual_appt: function () { save(); B.go('select-appointment'); },
    restart: function () { reset(); }
  };
  function add(id, name, amount, price) { if (S.services.some(function (s) { return s.id === id; })) return; S.services.push({ id: id, name: name, price: price || '$' + amount.toFixed(2), amount: amount }); }
  function fill(t) { return t.replace('{{vehicle}}', S.vehicle.title).replace('{{mileage}}', S.vehicle.mileage).replace('{{dealer}}', dealer()); }
  function go(id) {
    var node = FLOW[id]; if (!node) return;
    step = id; busy = true; chips([]);
    if (node.act && ACT[node.act]) ACT[node.act]();
    var lines = (node.say || []).slice();
    (function next() {
      if (!lines.length) {
        if (node.after && ACT[node.after]) ACT[node.after]();
        busy = false;
        if (node.go) { go(node.go); return; }
        if (node.cards) { if (node.cards === 'SLOTS') { var s = slots(); cards({ items: s.slice(0, 3), more: { label: 'Show other times', items: s.slice(3) }, link: { label: 'Open the full calendar', act: 'manual_appt' } }); } else cards(node.cards); }
        chips(node.chips);
        return;
      }
      typing(true);
      setTimeout(function () { typing(false); addAria(fill(lines.shift())); setTimeout(next, 260); }, B.fast ? 0 : 620);
    })();
  }
  function pick(c) {
    if (busy) return;
    if (c.act !== 'photo' && c.act !== 'restart') addUser(c.label);
    if (c.act && ACT[c.act]) ACT[c.act](c);
    chips([]);
    if (c.go) setTimeout(function () { go(c.go); }, 220);
  }
  function freeText(v) {
    if (!v.trim() || busy) return;
    addUser(v);
    var node = FLOW[step], list = (node && node.chips) || [];
    if (list.length) setTimeout(function () { typing(true); setTimeout(function () { typing(false); addAria("I'm still learning to read that. Pick one of the options below and I'll keep going."); chips(list); }, 600); }, 200);
  }
  function reset() { fresh(); el.thread.innerHTML = ''; el.context.innerHTML = ''; go('start'); }

  window.AriaChat = {
    mount: function (panel, b) {
      B = b; fresh();
      panel.innerHTML = panelHTML();
      if (window.DS_ICONS) DS_ICONS.paint(panel);
      el.thread = document.getElementById('aria-thread'); el.scroll = document.getElementById('aria-scroll'); el.chips = document.getElementById('aria-chips'); el.context = document.getElementById('aria-context'); el.input = document.getElementById('aria-input');
      document.getElementById('aria-send').addEventListener('click', function () { freeText(el.input.value); el.input.value = ''; });
      el.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { freeText(el.input.value); el.input.value = ''; } });
      document.getElementById('aria-add').addEventListener('click', function () { if (step === 'warn_photo' && !busy) pick({ label: 'Send photo', act: 'photo', go: 'warn_severity' }); });
      document.getElementById('aria-restart').addEventListener('click', reset);
      el.context.addEventListener('click', function (e) {
        if (e.target.closest('#aria-confirm')) { S.confirmed = true; showSummaryCard(); go('confirmed'); return; }
        var ed = e.target.closest('[data-aria-edit]');
        if (ed) { save(); B.go(ed.dataset.ariaEdit === 'vehicle' ? 'select-vehicle' : ed.dataset.ariaEdit === 'services' ? 'select-services' : 'select-appointment'); }
      });
      go('start');
      setTimeout(function () { el.input.focus(); }, 0);
    },
    pick: function (label) { var node = FLOW[step]; var c = node && (node.chips || []).filter(function (x) { return x.label === label; })[0]; if (c) pick(c); return !!c; },
    state: function () { return S; }, step: function () { return step; }
  };
})();
