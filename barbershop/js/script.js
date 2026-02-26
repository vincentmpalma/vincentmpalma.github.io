document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     ELEMENTS
     ============================================ */

  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const heroBg     = document.querySelector('.hero-bg');
  const yearSpan   = document.getElementById('current-year');

  /* ============================================
     1. DYNAMIC COPYRIGHT YEAR
     ============================================ */

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  /* ============================================
     2. NAV SCROLL STATE + HERO PARALLAX
     ============================================ */

  let ticking = false;

  function handleScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 80) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }

    if (heroBg) {
      heroBg.style.transform = `translateY(${scrollY * 0.38}px)`;
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  handleScroll();

  /* ============================================
     3. MOBILE MENU TOGGLE
     ============================================ */

  function openMenu() {
    mobileMenu.classList.add('open');
    hamburger.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (mobileMenu.classList.contains('open')) closeMenu();
    }
  });

  /* ============================================
     4. SCROLL-TRIGGERED FADE-IN ANIMATIONS
     ============================================ */

  const fadeEls = document.querySelectorAll('.fade-in-up');

  document.querySelectorAll('.services-grid .fade-in-up').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.08}s`;
  });

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ============================================
     5. ACTIVE NAV LINK TRACKING
     ============================================ */

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const linkMap = new Map();
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      linkMap.set(href.slice(1), link);
    }
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = linkMap.get(id);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.45 });

  sections.forEach(section => sectionObserver.observe(section));

  /* ============================================
     6. SMOOTH SCROLL FALLBACK
     ============================================ */

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================
     7. GALLERY — INFINITE AUTO-SCROLL + LIGHTBOX

     HOW AUTO-SCROLL WORKS:
     - JS clones all gallery items and appends them so the
       track is twice as long (seamless infinite loop).
     - A requestAnimationFrame loop moves the track left
       at a slow, steady speed via CSS transform.
     - When the position reaches the halfway point (the
       original width), it resets to 0 — invisible seam.
     - Hovering pauses the scroll on desktop.
     - On mobile, touch-dragging moves the track manually;
       auto-scroll resumes 2.5 seconds after the finger lifts.

     HOW LIGHTBOX WORKS:
     - Clicking any gallery item (original or clone) opens
       the lightbox showing that item's photo.
     - Prev/next arrows cycle through the original image list.
     - Click the backdrop, the × button, or press ESC to close.
     - Left/right arrow keys also navigate.
     ============================================ */

  const galleryWrapper = document.querySelector('.gallery-scroll-wrapper');
  const galleryTrack   = document.getElementById('galleryTrack');

  if (galleryWrapper && galleryTrack) {

    // ── Build image list from original items ──────────────────
    const originalItems = Array.from(galleryTrack.querySelectorAll('.gallery-item'));

    // Tag each original item with its index so clones inherit it
    originalItems.forEach((item, i) => {
      item.dataset.galleryIndex = i;
    });

    const images = originalItems.map(item => ({
      src: item.querySelector('img').getAttribute('src'),
      alt: item.querySelector('img').getAttribute('alt'),
    }));

    // ── Clone items for seamless infinite loop ────────────────
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      galleryTrack.appendChild(clone);
    });

    // ── Auto-scroll state ─────────────────────────────────────
    let pos         = 0;          // current translation in px
    let paused      = false;      // true while user is interacting
    let pauseTimer  = null;
    const SPEED     = 0.55;       // px per animation frame (~33px/sec)

    function getHalfWidth() {
      // Half the track width = width of the original (un-cloned) items
      return galleryTrack.scrollWidth / 2;
    }

    function tick() {
      if (!paused) {
        pos += SPEED;
        const half = getHalfWidth();
        if (pos >= half) pos -= half;   // reset to create the infinite loop
        galleryTrack.style.transform = `translateX(${-pos}px)`;
      }
      requestAnimationFrame(tick);
    }

    // Pause on mouse hover (desktop)
    galleryWrapper.addEventListener('mouseenter', () => paused = true);
    galleryWrapper.addEventListener('mouseleave', () => {
      clearTimeout(pauseTimer);
      paused = false;
    });

    // ── Touch / drag scroll (mobile + trackpad) ───────────────
    let touchStartX    = 0;
    let touchStartPos  = 0;
    let touchDragging  = false;

    galleryWrapper.addEventListener('touchstart', e => {
      paused        = true;
      touchStartX   = e.touches[0].clientX;
      touchStartPos = pos;
      touchDragging = false;
    }, { passive: true });

    galleryWrapper.addEventListener('touchmove', e => {
      const dx = touchStartX - e.touches[0].clientX;
      if (Math.abs(dx) > 4) touchDragging = true;

      let newPos  = touchStartPos + dx;
      const half  = getHalfWidth();
      // Keep position within [0, half) so the loop stays seamless
      newPos = ((newPos % half) + half) % half;
      pos    = newPos;
      galleryTrack.style.transform = `translateX(${-pos}px)`;
    }, { passive: true });

    galleryWrapper.addEventListener('touchend', () => {
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(() => {
        paused = false;
      }, 2500);
    });

    // Start the loop
    requestAnimationFrame(tick);

    // ── Lightbox ──────────────────────────────────────────────
    const lightbox         = document.getElementById('lightbox');
    const lightboxImg      = document.getElementById('lightboxImg');
    const lightboxClose    = document.getElementById('lightboxClose');
    const lightboxPrev     = document.getElementById('lightboxPrev');
    const lightboxNext     = document.getElementById('lightboxNext');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');

    let currentIndex = 0;

    function openLightbox(index) {
      currentIndex       = ((index % images.length) + images.length) % images.length;
      lightboxImg.src    = images[currentIndex].src;
      lightboxImg.alt    = images[currentIndex].alt;
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      paused = true;  // pause scroll while lightbox is open
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => { lightboxImg.src = ''; }, 300);
      paused = false;
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
    }

    // Click on any gallery item (event delegation handles clones too)
    galleryTrack.addEventListener('click', e => {
      // Don't open if the user was dragging on touch
      if (touchDragging) { touchDragging = false; return; }

      const item = e.target.closest('.gallery-item');
      if (!item) return;

      const idx = parseInt(item.dataset.galleryIndex, 10);
      if (!isNaN(idx)) openLightbox(idx);
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrev);
    lightboxNext.addEventListener('click', showNext);

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   showPrev();
      if (e.key === 'ArrowRight')  showNext();
    });
  }

});
