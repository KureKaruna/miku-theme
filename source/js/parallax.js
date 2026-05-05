/* ============================================
   miku-theme — Parallax + Particle System
   Multi-layer parallax hero + canvas particle light effects
   ============================================ */

(function () {
  'use strict';

  var parallaxHero = document.getElementById('parallaxHero');
  if (!parallaxHero) return;

  var bgLayer = document.getElementById('parallaxBg');
  var fgLayer = document.getElementById('parallaxForeground');
  var canvas     = document.getElementById('parallaxParticles');
  if (!canvas) return;

  // ============================================
  // Parallax scroll
  // ============================================

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        var heroHeight = parallaxHero.offsetHeight;
        if (scrollY < heroHeight) {
          if (bgLayer)
            bgLayer.style.transform = 'translate3d(0, ' + (scrollY * 0.25) + 'px, 0)';
          if (fgLayer) {
            fgLayer.style.transform = 'translate3d(0, ' + (scrollY * 0.15) + 'px, 0)';
            fgLayer.style.opacity = 1 - scrollY / (heroHeight * 0.6);
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ============================================
  // Canvas Particle System
  // ============================================

  var ctx = canvas.getContext('2d');
  var particles = [];
  var animId;
  var w, h;

  // Config
  var PARTICLE_COUNT = 70;
  var CONNECT_DIST   = 130;
  var COLORS = [
    'rgba(57, 197, 187, ',   // primary #39C5BB
    'rgba(227, 0, 127, ',    // accent  #E3007F
    'rgba(255, 255, 255, ',
  ];
  var HEXAGON_POINTS = 6;

  function resize() {
    var rect = parallaxHero.getBoundingClientRect();
    w = canvas.width  = rect.width  || parallaxHero.offsetWidth;
    h = canvas.height = rect.height || parallaxHero.offsetHeight;
  }

  function createParticle() {
    var colorIdx = Math.random() < 0.7
      ? (Math.random() < 0.6 ? 0 : 1)
      : 2;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2.5 + 1,
      colorIdx: colorIdx,
      opacity: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      type: Math.random() < 0.12 ? 'hexagon' : 'circle',
      hexSize: Math.random() * 6 + 3,
    };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function drawHexagon(x, y, size, r, g, b, alpha) {
    ctx.beginPath();
    for (var i = 0; i < HEXAGON_POINTS; i++) {
      var angle = (Math.PI * 2 / HEXAGON_POINTS) * i - Math.PI / 6;
      var px = x + Math.cos(angle) * size;
      var py = y + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  function parseRGBA(str) {
    var m = str.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : [255, 255, 255];
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);

    var scrollY = window.scrollY;
    var heroHeight = parallaxHero.offsetHeight;

    // Fade out as user scrolls down
    var globalAlpha = Math.max(0, 1 - scrollY / (heroHeight * 0.8));
    ctx.globalAlpha = globalAlpha;
    if (globalAlpha <= 0) {
      animId = requestAnimationFrame(animate);
      return;
    }

    // Update & draw particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Gentle floating motion
      p.pulse += p.pulseSpeed;
      p.x += p.vx + Math.sin(p.pulse) * 0.15;
      p.y += p.vy + Math.cos(p.pulse * 1.3) * 0.1;

      // Wrap around bounds
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      var rgb = parseRGBA(COLORS[p.colorIdx]);
      var alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

      // Draw glow
      var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
      glow.addColorStop(0, COLORS[p.colorIdx] + (alpha * 0.6) + ')');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw core
      if (p.type === 'hexagon') {
        drawHexagon(p.x, p.y, p.hexSize, rgb[0], rgb[1], rgb[2], alpha);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[p.colorIdx] + alpha + ')';
        ctx.fill();
      }
    }

    // Connection lines between nearby particles
    for (i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          var lineAlpha = (1 - dist / CONNECT_DIST) * 0.15 * globalAlpha;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(57, 197, 187, ' + lineAlpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(animate);
  }

  // Handle resize
  var resizeDebounce;
  window.addEventListener('resize', function () {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(function () {
      resize();
      initParticles();
    }, 200);
  });

  // Handle visibility (pause when hidden)
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      resize();
      animId = requestAnimationFrame(animate);
    }
  });

  // Start
  resize();
  initParticles();
  animId = requestAnimationFrame(animate);

  // ============================================
  // Subtle parallax on post cover images
  // ============================================

  var postCover = document.getElementById('postCoverImage');
  if (postCover) {
    var coverTicking = false;
    window.addEventListener('scroll', function () {
      if (!coverTicking) {
        requestAnimationFrame(function () {
          var rect = postCover.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            var offset = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
            postCover.style.transform = 'translate3d(0, ' + (offset * 20) + 'px, 0) scale(1.02)';
          }
          coverTicking = false;
        });
        coverTicking = true;
      }
    }, { passive: true });
  }

})();
