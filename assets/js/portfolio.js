/* ==========================================================================
   My Portfolio — Maelle Motion, Live HCMC Clock, TOC Scroll-Spy & Lightbox
   Zero dependencies, progressive enhancement, honours prefers-reduced-motion.
   ========================================================================== */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Word de-blur reveal (Maelle signature load motion, progressive enhancement) */
  if (!reduced) {
    root.classList.add('pf-anim');
    document.querySelectorAll('[data-words]').forEach(function (el) {
      var start = parseFloat(el.getAttribute('data-words-start') || '0.04');
      var step = parseFloat(el.getAttribute('data-words-step') || '0.055');
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              var span = document.createElement('span');
              span.className = 'pf-w';
              span.textContent = part;
              span.style.setProperty('--d', (start + step * i++).toFixed(3) + 's');
              frag.appendChild(span);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            walk(n);
          }
        });
      })(el);
    });
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      root.classList.add('is-loaded');
    });
  });

  /* 2. "Let's Talk" hairline ticker: clone once for seamless 50px/s loop */
  var track = document.querySelector('.pf-talk__track');
  if (track) {
    Array.prototype.slice.call(track.children).forEach(function (child) {
      track.appendChild(child.cloneNode(true));
    });
    var setTicker = function () {
      var dist = (track.scrollWidth + 20) / 2;
      if (dist > 0) track.style.animationDuration = (dist / 50).toFixed(2) + 's';
    };
    setTicker();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setTicker);
    }
  }

  /* 3. Live Ho Chi Minh City (GMT+7) clock in the fixed header */
  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var tick = function () {
      var now = new Date();
      try {
        var dateStr = now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          month: 'short',
          day: 'numeric'
        });
        var timeStr = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: 'numeric',
          minute: '2-digit'
        });
        clock.textContent = 'HCMC · ' + dateStr + ', ' + timeStr;
      } catch (e) {
        clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    };
    tick();
    setInterval(tick, 30000);
  }

  /* 4. Copy email quick button inside "Contact me" */
  document.querySelectorAll('[data-copy-email]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-copy-email');
      if (!email) return;
      var done = function () {
        var orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = orig; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(done);
      } else {
        done();
      }
    });
  });

  /* 5. Case study TOC scroll-spy */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.pf-toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var sections = tocLinks.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    }).filter(Boolean);
    var setActive = function (id) {
      tocLinks.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    if (sections.length) setActive(sections[0].id);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
    sections.forEach(function (sec) { io.observe(sec); });
  }

  /* 6. Click-to-zoom Lightbox for UI showcase figures */
  var frames = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox-item]'));
  if (frames.length) {
    var box = document.createElement('div');
    box.className = 'pf-lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image preview');
    box.innerHTML =
      '<div class="pf-lightbox__bar">' +
        '<span data-lb-counter>1 / 1</span>' +
        '<div class="pf-lightbox__controls">' +
          '<button type="button" class="pf-lightbox__btn" data-lb-prev>Prev</button>' +
          '<button type="button" class="pf-lightbox__btn" data-lb-next>Next</button>' +
          '<button type="button" class="pf-lightbox__btn" data-lb-close>Close (Esc)</button>' +
        '</div>' +
      '</div>' +
      '<div class="pf-lightbox__stage"><img data-lb-img src="" alt=""></div>' +
      '<p class="pf-lightbox__cap" data-lb-cap></p>';
    document.body.appendChild(box);

    var lbImg = box.querySelector('[data-lb-img]');
    var lbCap = box.querySelector('[data-lb-cap]');
    var lbCounter = box.querySelector('[data-lb-counter]');
    var cur = 0;
    var lastFocus = null;

    var render = function (idx) {
      cur = (idx + frames.length) % frames.length;
      var fig = frames[cur];
      var im = fig.querySelector('img');
      var cap = fig.querySelector('figcaption span');
      lbImg.src = im ? im.getAttribute('src') : '';
      lbImg.alt = im ? (im.getAttribute('alt') || '') : '';
      lbCap.textContent = cap ? cap.textContent : (lbImg.alt || '');
      lbCounter.textContent = (cur + 1) + ' / ' + frames.length;
    };
    var open = function (idx) {
      lastFocus = document.activeElement;
      render(idx);
      box.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      box.querySelector('[data-lb-close]').focus();
    };
    var close = function () {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };

    frames.forEach(function (fig, idx) {
      var frame = fig.querySelector('.pf-figure__frame');
      if (!frame) return;
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      frame.setAttribute('aria-label', 'Inspect image in full view');
      frame.addEventListener('click', function () { open(idx); });
      frame.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(idx);
        }
      });
    });

    box.querySelector('[data-lb-prev]').addEventListener('click', function () { render(cur - 1); });
    box.querySelector('[data-lb-next]').addEventListener('click', function () { render(cur + 1); });
    box.querySelector('[data-lb-close]').addEventListener('click', close);
    box.addEventListener('click', function (e) {
      if (e.target === box) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') render(cur - 1);
      if (e.key === 'ArrowRight') render(cur + 1);
    });
  }

  /* 7. Interactive prototype step/state tab switcher (e.g. BMW AU OSB Enhance & AI Integration) */
  document.querySelectorAll('[data-proto-tabs]').forEach(function (group) {
    var targetId = group.getAttribute('data-proto-tabs');
    var iframe = document.getElementById(targetId);
    if (!iframe) return;
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[data-proto-src]'));
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-proto-src');
        if (!src) return;
        iframe.setAttribute('src', src);
        tabs.forEach(function (t) {
          var on = t === btn;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-pressed', String(on));
        });
      });
    });
  });
})();
