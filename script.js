/* Upcapto - 3D intro overture in Three.js (WebGL): a glowing particle cloud
   that morphs sphere -> cube -> core as you scroll, then hands off to the site.
   Three.js is loaded from a CDN (no build step). Falls back to a static frame
   when WebGL/Three is unavailable or under prefers-reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia && window.matchMedia("(max-width: 680px)").matches;

  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function lerp(a, b, m) { return a + (b - a) * m; }
  function band(p, a, b, c, d) {
    if (p <= a || p >= d) return 0;
    if (p < b) return (p - a) / (b - a);
    if (p > c) return 1 - (p - c) / (d - c);
    return 1;
  }

  // ======================= INTRO OVERTURE (Three.js / WebGL) =======================
  (function initIntro() {
    var overture = document.getElementById("overture");
    var canvas = document.getElementById("introCanvas");
    if (!overture || !canvas) return;

    var caps = Array.prototype.slice.call(overture.querySelectorAll(".ov-cap"));
    var chips = Array.prototype.slice.call(overture.querySelectorAll(".ov-chip"));
    var cue = overture.querySelector(".ov-scroll");
    var stageEl = overture.querySelector(".ov-stage");
    var header = document.getElementById("siteHeader");
    var enable = !reduce && window.matchMedia("(min-width: 761px)").matches;
    if (enable) { overture.classList.add("scrollmode"); if (header) header.classList.add("hidden"); }

    // mouse parallax (desktop only)
    var tmx = 0, tmy = 0, mx = 0, my = 0;
    if (!reduce && !small) window.addEventListener("pointermove", function (e) {
      tmx = e.clientX / window.innerWidth - 0.5;
      tmy = e.clientY / window.innerHeight - 0.5;
    });

    var t = 0, p = 0;
    function centerYFactor() { return 0.5 + smooth(clamp((p - 0.6) / 0.2, 0, 1)) * 0.12; }

    function updateCaps() {
      if (!enable) {
        if (caps[0]) caps[0].style.opacity = "1";
        for (var k = 1; k < caps.length; k++) if (caps[k]) caps[k].style.opacity = "0";
        if (cue) cue.style.opacity = "0";
        return;
      }
      if (caps[0]) caps[0].style.opacity = band(p, -1, 0, 0.2, 0.3).toFixed(3);
      if (caps[1]) caps[1].style.opacity = band(p, 0.33, 0.4, 0.57, 0.65).toFixed(3);
      if (caps[2]) caps[2].style.opacity = band(p, 0.66, 0.73, 1.2, 1.3).toFixed(3);
      if (cue) cue.style.opacity = band(p, -1, 0, 0.82, 0.96).toFixed(3);
    }
    var orbitCv = overture.querySelector("#orbitCanvas");
    var octx = orbitCv ? orbitCv.getContext("2d") : null;
    function sizeOrbit() {
      if (!orbitCv) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = orbitCv.getBoundingClientRect();
      orbitCv.width = Math.max(1, r.width * dpr); orbitCv.height = Math.max(1, r.height * dpr);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (orbitCv) sizeOrbit();
    var ringR = [0.30, 0.38, 0.46];   // chip orbit radii (fraction of width)
    var allR  = [0.22, 0.30, 0.38, 0.46, 0.54];

    function updateChips() {
      if (!stageEl) return;
      // keep the orbit canvas backing in sync with its CSS size (viewport changes)
      if (orbitCv && octx) {
        var rr = orbitCv.getBoundingClientRect();
        var dpr2 = Math.min(window.devicePixelRatio || 1, 2);
        if (Math.abs(orbitCv.width - rr.width * dpr2) > 2 || Math.abs(orbitCv.height - rr.height * dpr2) > 2) sizeOrbit();
      }
      var W = stageEl.clientWidth, H = stageEl.clientHeight;
      var cx = ballSX || W / 2, cy = ballSY || H * centerYFactor();
      var chipP = enable ? clamp((p - 0.6) / 0.16, 0, 1) : 0;

      // concentric elliptical orbit rings (behind the chips)
      if (octx) {
        octx.clearRect(0, 0, W, H);
        if (chipP > 0.002) {
          for (var k = 0; k < allR.length; k++) {
            var erx = allR[k] * W, ery = allR[k] * W * 0.46;
            octx.beginPath();
            octx.ellipse(cx, cy, erx, ery, 0, 0, Math.PI * 2);
            octx.strokeStyle = "rgba(188,208,255," + (chipP * 0.7).toFixed(3) + ")";
            octx.lineWidth = 1.5; octx.stroke();
          }
        }
      }

      // product chips riding the rings
      if (!chips.length) return;
      var rot = t * 0.26 + (enable ? p * Math.PI * 0.8 : 0);
      for (var i = 0; i < chips.length; i++) {
        var ri = i % ringR.length;
        var rx = ringR[ri] * W, ry = ringR[ri] * W * 0.46;
        var ang = rot + (i / chips.length) * Math.PI * 2 + ri * 0.6;
        var x = cx + rx * Math.cos(ang), y = cy + ry * Math.sin(ang);
        var depth = (Math.sin(ang) + 1) / 2, sc = 0.84 + 0.22 * depth, el = chips[i];
        el.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%) scale(" + sc.toFixed(3) + ")";
        el.style.opacity = (chipP * (0.5 + 0.5 * depth)).toFixed(3);
        el.style.zIndex = String(3 + Math.round(depth * 20));
      }
    }
    function handoff() {
      if (!enable) return;
      var r = overture.getBoundingClientRect();
      var denom = (r.height - window.innerHeight) || 1;
      p = clamp((0 - r.top) / denom, 0, 1);
      var e = smooth(clamp((p - 0.86) / 0.14, 0, 1));
      if (stageEl) {
        stageEl.style.borderRadius = (e * 30).toFixed(1) + "px";
        stageEl.style.transform = "scale(" + (1 - 0.1 * e).toFixed(3) + ")";
      }
      if (header) { if (e > 0.16) header.classList.remove("hidden"); else header.classList.add("hidden"); }
    }

    // No Three.js / WebGL: graceful static fallback (still shows the hero text)
    if (!window.THREE) { updateCaps(); updateChips(); return; }

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (err) { updateCaps(); updateChips(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 3.4;
    var _v = new THREE.Vector3(), ballSX = 0, ballSY = 0;  // ball's projected screen centre

    var N = small ? 2600 : 5400;
    var sph = new Float32Array(N * 3), cube = new Float32Array(N * 3), core = new Float32Array(N * 3), pos = new Float32Array(N * 3);
    var inc = Math.PI * (3 - Math.sqrt(5));
    var corners = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    var edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    function randUnit() {
      var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      return [s * Math.cos(th), s * Math.sin(th), u];
    }
    for (var i = 0; i < N; i++) {
      // Sphere: mostly toward the surface with some interior -> a DEFINED, dense
      // ball with depth (a crisp "moon", not a diffuse blob)
      var d = randUnit(), rb = Math.pow(Math.random(), 0.32);
      sph[i*3] = d[0] * rb; sph[i*3+1] = d[1] * rb; sph[i*3+2] = d[2] * rb;
      // core (final "moon"): strongly surface-weighted -> a dense, defined ball
      var cd = randUnit(), cr = Math.pow(Math.random(), 0.14);
      core[i*3] = cd[0] * cr; core[i*3+1] = cd[1] * cr; core[i*3+2] = cd[2] * cr;
      // CUBE: ~55% on the glowing edges (slight jitter for thickness), ~45% scattered
      // through the box volume -> reads like a solid box, not a bare wireframe
      if ((i % 20) < 11) {
        var e2 = edges[i % 12], tt = Math.random(), c0 = corners[e2[0]], c1 = corners[e2[1]];
        cube[i*3]   = c0[0] + (c1[0]-c0[0])*tt + (Math.random()-0.5)*0.045;
        cube[i*3+1] = c0[1] + (c1[1]-c0[1])*tt + (Math.random()-0.5)*0.045;
        cube[i*3+2] = c0[2] + (c1[2]-c0[2])*tt + (Math.random()-0.5)*0.045;
      } else {
        cube[i*3] = Math.random()*2-1; cube[i*3+1] = Math.random()*2-1; cube[i*3+2] = Math.random()*2-1;
      }
      pos[i*3] = sph[i*3]; pos[i*3+1] = sph[i*3+1]; pos[i*3+2] = sph[i*3+2];
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    function glowTex() {
      var c = document.createElement("canvas"); c.width = c.height = 64;
      var x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.3, "rgba(190,220,255,0.75)");
      g.addColorStop(1, "rgba(90,150,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      var tx = new THREE.Texture(c); tx.needsUpdate = true; return tx;
    }
    var mat = new THREE.PointsMaterial({
      size: small ? 0.032 : 0.023, map: glowTex(), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0x9fbdff, sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    points.renderOrder = 2;
    scene.add(points);

    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(), color: 0x3f7bff, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.22
    }));
    halo.renderOrder = -2;
    scene.add(halo);


    // Cinematic bloom (UnrealBloomPass). Skipped on small screens for perf.
    var composer = null;
    if (!small && THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass) {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.28, 0.0);
      // (resolution, strength, radius, threshold) - threshold 0 so the additive glow blooms
      composer.addPass(bloom);
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      renderer.setSize(r.width, r.height, false);
      if (composer) composer.setSize(r.width, r.height);
      camera.aspect = r.width / Math.max(1, r.height);
      camera.updateProjectionMatrix();
      sizeOrbit();
    }
    resize();
    window.addEventListener("resize", debounce(resize, 200));

    function render() {
      var seg = p < 0.5 ? 0 : 1;
      // beat 1->2 cube by p=0.5; cube->moon finishes by p=0.72 so the orbital
      // phase (0.72..0.86) shows a clean, defined ball before the handoff
      var m = seg === 0 ? smooth(p / 0.5) : smooth(clamp((p - 0.5) / 0.22, 0, 1));
      for (var i = 0; i < N * 3; i++) {
        var a = seg === 0 ? sph[i] : cube[i];
        var b = seg === 0 ? cube[i] : core[i]; // final beat forms the dense "moon"
        pos[i] = a + (b - a) * m;
      }
      geo.attributes.position.needsUpdate = true;
      var rf = seg === 0 ? lerp(1.3, 1.34, m) : lerp(1.34, 0.46, m);
      points.scale.setScalar(rf);
      points.rotation.y = t * 0.1 + (p - 0.5) * 0.85;
      points.rotation.x = 0.14 + (p - 0.5) * 0.25;
      points.position.y = 0; halo.position.y = 0;
      halo.scale.setScalar(rf * 2.6);
      // mouse parallax + drop the cloud in beat 3 (by aiming the camera above the
      // ball) so it lands at the same screen centre as the 2D orbit rings/chips
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      var lookUp = (centerYFactor() - 0.5) * 3.54;  // 3.54 = world frame height at the ball
      camera.position.x = mx * 0.7; camera.position.y = -my * 0.7;
      camera.lookAt(0, lookUp, 0);
      camera.updateMatrixWorld();
      // project the ball centre so the 2D rings/chips can orbit it exactly
      _v.set(0, 0, 0).project(camera);
      ballSX = (_v.x * 0.5 + 0.5) * stageEl.clientWidth;
      ballSY = ((1 - _v.y) * 0.5) * stageEl.clientHeight;
      if (composer) composer.render(); else renderer.render(scene, camera);
    }

    var active = true, raf;
    function frame() {
      if (!reduce) t += 0.004;
      handoff();
      render(); updateCaps(); updateChips();
      if (active && !reduce) raf = requestAnimationFrame(frame);
    }
    if (reduce) { render(); updateCaps(); updateChips(); }
    else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          active = en.isIntersecting;
          if (active) raf = requestAnimationFrame(frame);
          // scrolled past the intro: make sure the nav is shown
          else if (header && en.boundingClientRect.top < 0) header.classList.remove("hidden");
        });
      }, { threshold: 0 }).observe(overture);
    } else { frame(); }
  })();

  // ======================= SITE INTERACTIONS =======================

  // Bento cursor spotlight
  Array.prototype.forEach.call(document.querySelectorAll(".cell"), function (cell) {
    cell.addEventListener("pointermove", function (e) {
      var r = cell.getBoundingClientRect();
      cell.style.setProperty("--mx", (e.clientX - r.left) + "px");
      cell.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  // Tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (tb) {
      var sel = tb === tab;
      tb.setAttribute("aria-selected", sel ? "true" : "false");
      tb.setAttribute("tabindex", sel ? "0" : "-1");
      var panel = document.getElementById(tb.getAttribute("aria-controls"));
      if (panel) { panel.hidden = !sel; if (sel) panel.setAttribute("data-active", ""); else panel.removeAttribute("data-active"); }
    });
  }
  tabs.forEach(function (tb, i) {
    tb.addEventListener("click", function () { selectTab(tb); });
    tb.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return; e.preventDefault();
      var nx = tabs[(i + d + tabs.length) % tabs.length]; nx.focus(); selectTab(nx);
    });
  });

  // Reveal / count-up / bars on view
  function onView(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(); return; }
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { cb(); o.unobserve(en.target); } });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    o.observe(el);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) {
    if (reduce || !("IntersectionObserver" in window)) { el.classList.add("in"); return; }
    onView(el, function () { el.classList.add("in"); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (reduce || !("IntersectionObserver" in window)) { el.textContent = Math.round(target); return; }
    onView(el, function () {
      var start = null, dur = 1400;
      function tick(ts) {
        if (!start) start = ts;
        var pr = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - pr, 3)));
        if (pr < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".bar > i"), function (el) {
    var pct = el.getAttribute("data-pct") || "0";
    if (reduce || !("IntersectionObserver" in window)) { el.style.width = pct + "%"; return; }
    onView(el, function () { el.style.width = pct + "%"; });
  });

  // Mobile menu
  var menuBtn = document.getElementById("menuBtn");
  var nav = document.querySelector(".nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      if (nav.hasAttribute("data-open")) nav.removeAttribute("data-open"); else nav.setAttribute("data-open", "");
    });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") nav.removeAttribute("data-open"); });
  }

  // Always reveal the pill nav once the main content is in view (robust against
  // the intro being skipped, jumped past, or run in reduced-motion mode)
  (function () {
    var siteHeader = document.getElementById("siteHeader");
    var mainEl = document.getElementById("main");
    if (!siteHeader || !mainEl) return;
    if (!("IntersectionObserver" in window)) { siteHeader.classList.remove("hidden"); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) siteHeader.classList.remove("hidden"); });
    }, { threshold: 0, rootMargin: "0px 0px -45% 0px" }).observe(mainEl);
  })();

  // Demo request modal: wires every "Book a demo" / "Talk to sales" button
  (function () {
    var modal = document.getElementById("demoModal");
    if (!modal) return;
    var form = document.getElementById("demoForm");
    var bodyEl = document.getElementById("demoBody");
    var lastFocus = null;

    function openModal(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      try { document.body.style.overflow = "hidden"; } catch (_) {}
      var first = modal.querySelector("input, button");
      if (first) setTimeout(function () { try { first.focus(); } catch (_) {} }, 40);
    }
    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      try { document.body.style.overflow = ""; } catch (_) {}
      if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (_) {}
    }

    Array.prototype.forEach.call(document.querySelectorAll("a.btn, button.btn"), function (b) {
      var t = (b.textContent || "").toLowerCase();
      if (t.indexOf("book a demo") !== -1 || t.indexOf("talk to sales") !== -1) b.addEventListener("click", openModal);
    });
    modal.addEventListener("click", function (e) {
      if (e.target && e.target.hasAttribute && e.target.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    function success(email) {
      bodyEl.innerHTML = '<div class="modal-success"><div class="check">✓</div>'
        + '<h3>Request received.</h3>'
        + '<p class="modal-sub">Thanks. We will reach out at <b>' + email.replace(/[<>&"]/g, "") + '</b> to set up your walkthrough.</p>'
        + '<button class="btn btn-ghost" type="button" data-close>Close</button></div>';
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var err = document.getElementById("demoError");
        var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
        var name = val("d-name"), email = val("d-email"), biz = val("d-biz");
        var phone = val("d-phone"), message = val("d-msg");
        var product = (document.getElementById("d-product") || {}).value || "";
        if (!name || !email || !biz) { err.textContent = "Please fill in your name, email and business."; err.hidden = false; return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "Please enter a valid email address."; err.hidden = false; return; }
        err.hidden = true;
        var btn = document.getElementById("demoSubmit"); btn.disabled = true; btn.textContent = "Sending...";
        var endpoint = form.getAttribute("data-endpoint") || "";
        var configured = endpoint.indexOf("http") === 0 && endpoint.indexOf("your-form-id") === -1;

        function fail(msg) { err.textContent = msg || "Something went wrong. Please email hello@upcapto.com."; err.hidden = false; btn.disabled = false; btn.textContent = "Request demo"; }

        // give the notification email a useful subject (Formspree reads _subject)
        var subj = document.getElementById("d-subject");
        if (subj) subj.value = "Demo request from " + biz + (product ? " (" + product + ")" : "");

        if (configured && window.fetch) {
          fetch(endpoint, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
            .then(function (r) {
              if (r.ok) { success(email); return; }
              r.json().then(function (d) {
                fail(d && d.errors && d.errors[0] && d.errors[0].message);
              }).catch(function () { fail(); });
            })
            .catch(function () { fail(); });
        } else {
          var lines = ["Name: " + name, "Email: " + email, "Business: " + biz, "Phone: " + phone, "Product: " + product, "", "Message:", message];
          try { window.location.href = "mailto:hello@upcapto.com?subject=" + encodeURIComponent("Demo request from " + biz) + "&body=" + encodeURIComponent(lines.join("\n")); } catch (_) {}
          success(email);
        }
      });
    }
  })();

  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
})();
