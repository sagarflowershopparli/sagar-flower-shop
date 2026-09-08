'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const animate = () => !motion.matches;
const smooth = () => animate() ? 'smooth' : 'auto';

const whatsapp = (title, marathi = '') => {
  const item = marathi ? `${marathi} (${title})` : title;
  return 'https://wa.me/917620644158?text=' + encodeURIComponent(`नमस्कार! मला ${item} याबद्दल माहिती हवी आहे. / Hello, I would like to order ${item}.`);
};

// --- HERO DELIVERY VIDEO (SILENT AUTOPLAY LOOP) ---
const heroVideo = $('#hero-delivery-video');
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.playsInline = true;
  heroVideo.loop = true;
}

// --- STORY REEL VIDEOS (AUTOPLAY IN LOOP, STRICTLY MUTED) ---
const storyVideos = $$('.story-video');
storyVideos.forEach(video => {
  video.loop = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  const card = video.closest('.film-card');
  const progressFill = card?.querySelector('.film-progress-fill');

  // Track progress bar smoothly
  video.addEventListener('timeupdate', () => {
    if (progressFill && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      progressFill.style.width = `${pct}%`;
    }
  });

  // Tap/click video to toggle play/pause silently
  video.addEventListener('click', () => {
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
});

// Film rail horizontal scroll controls
const rail = $('.film-rail');
if (rail) {
  const scrollFilms = direction => {
    const card = $('.film-card', rail);
    const cardWidth = card ? card.offsetWidth + 20 : 300;
    rail.scrollBy({ left: direction * cardWidth, behavior: smooth() });
  };
  $('.film-prev')?.addEventListener('click', () => scrollFilms(-1));
  $('.film-next')?.addEventListener('click', () => scrollFilms(1));
  rail.addEventListener('keydown', event => {
    if (event.target === rail && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      scrollFilms(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
}

// --- PORTFOLIO FILTERING & FLUID CONNECTED PILL RIBBON ---
const cards = $$('.work-card');
const filterButtons = $$('[data-filter]');
const filterContainer = $('.fluid-filter-ribbon-wrap') || $('.dynamic-island-ticker-wrap') || $('.neo-filter-container') || $('.filter-flow-wrapper');
let currentFilter = 'all';

function centerActiveButton(activeBtn) {
  if (!filterContainer || !activeBtn) return;
  if (filterContainer.scrollWidth > filterContainer.clientWidth) {
    const containerRect = filterContainer.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const scrollTarget = filterContainer.scrollLeft + (btnRect.left - containerRect.left) - (filterContainer.clientWidth / 2) + (btnRect.width / 2);
    filterContainer.scrollTo({ left: Math.max(0, scrollTarget), behavior: smooth() });
  }
}

const getMatchingCards = () => cards.filter(card => currentFilter === 'all' || card.dataset.category === currentFilter);

function renderCollection() {
  const matches = getMatchingCards();
  cards.forEach(card => {
    card.hidden = currentFilter !== 'all' && card.dataset.category !== currentFilter;
  });
  const status = $('#filter-status');
  if (status) {
    status.textContent = `${matches.length} floral designs`;
  }

  requestScrollUpdate();
}

filterButtons.forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  if (filterContainer) filterContainer.dataset.activeFilter = currentFilter;
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  centerActiveButton(button);
  renderCollection();
  if (animate()) {
    const portfolio = $('.portfolio');
    if (portfolio) {
      portfolio.animate([
        { opacity: 0.5, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
  }
}));

// --- LIGHTBOX MODAL (100% Full uncropped view) ---
const dialog = $('#lightbox');
let activePhoto, lastTrigger, photoGroup = [];
let imageVersion = 0;

function showPhoto(button) {
  if (!button || !dialog) return;
  activePhoto = button;
  const photo = $('#lightbox-photo');
  const title = button.dataset.title || '';
  const marathi = button.dataset.marathi || '';
  const displayTitle = marathi ? `${marathi} · ${title}` : title;

  photo.src = button.dataset.image;
  photo.alt = displayTitle;
  $('#lightbox-title').textContent = displayTitle;
  $('#lightbox-inquire').href = whatsapp(title, marathi);
  $('#lightbox-count').textContent = `${photoGroup.indexOf(button) + 1} / ${photoGroup.length} · सागर फ्लॉवर सेंटर, परळी`;

  const version = ++imageVersion;
  photo.decode().catch(() => {}).then(() => {
    if (version === imageVersion && animate()) {
      photo.animate([{ opacity: 0.6 }, { opacity: 1 }], { duration: 160 });
    }
  });

  // Pre-load next & previous images offscreen so arrow navigation never lags
  const currentIdx = photoGroup.indexOf(button);
  if (currentIdx !== -1 && photoGroup.length > 1) {
    const nextBtn = photoGroup[(currentIdx + 1) % photoGroup.length];
    const prevBtn = photoGroup[(currentIdx - 1 + photoGroup.length) % photoGroup.length];
    if (nextBtn?.dataset.image) { const imgNext = new Image(); imgNext.src = nextBtn.dataset.image; }
    if (prevBtn?.dataset.image) { const imgPrev = new Image(); imgPrev.src = prevBtn.dataset.image; }
  }
}

function nextPhoto(direction) {
  if (!photoGroup.length) return;
  const currentIndex = photoGroup.indexOf(activePhoto);
  const nextIndex = (currentIndex + direction + photoGroup.length) % photoGroup.length;
  showPhoto(photoGroup[nextIndex]);
}

$$('.photo-button[data-image]').forEach(button => button.addEventListener('click', () => {
  lastTrigger = button;
  photoGroup = button.dataset.group === 'collection'
    ? getMatchingCards().map(card => $('.photo-button', card))
    : $$(`.photo-button[data-group="${button.dataset.group}"]`);
  showPhoto(button);
  dialog.showModal();
  document.body.classList.add('modal-open');
}));

$('.lightbox-close')?.addEventListener('click', () => dialog.close());
$('.lightbox-next')?.addEventListener('click', () => nextPhoto(1));
$('.lightbox-prev')?.addEventListener('click', () => nextPhoto(-1));

dialog?.addEventListener('click', event => {
  const r = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) {
    dialog.close();
  }
});
dialog?.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  lastTrigger?.focus({ preventScroll: true });
});
dialog?.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    nextPhoto(event.key === 'ArrowRight' ? 1 : -1);
  }
});

function onSwipe(element, callback) {
  if (!element) return;
  let start = null;
  element.addEventListener('touchstart', event => {
    start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  element.addEventListener('touchend', event => {
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      callback(dx < 0 ? 1 : -1);
    }
    start = null;
  }, { passive: true });
}
onSwipe($('#lightbox-photo'), nextPhoto);

// --- 3D FLOATING SHOWCASE HERO CAROUSEL ---
function initHero3DShowcase() {
  const container = document.querySelector('#home.hero-3d-showcase') || document.querySelector('.hero-3d-showcase');
  if (!container) return;

  const slides = container.querySelectorAll('.hero-slide');
  const pills = container.querySelectorAll('.hero-pagination-pill');
  const glider = document.getElementById('heroPaginationGlider');
  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');
  const morphTurbulence = document.getElementById('morphTurbulence');
  const morphDisplacement = document.getElementById('morphDisplacement');
  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  let isPaused = false;
  let morphAnimFrame = null;
  const ROTATION_MS = 7000;
  let manuallyPaused = false;
  const pauseButton = document.getElementById('heroPauseBtn');
  function syncSlides() {
    slides.forEach((slide, index) => {
      slide.inert = index !== currentIndex;
      slide.setAttribute('aria-hidden', String(index !== currentIndex));
    });
  }
  syncSlides();
  pauseButton?.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    pauseButton.textContent = manuallyPaused ? 'Play slideshow' : 'Pause slideshow';
    pauseButton.setAttribute('aria-pressed', String(manuallyPaused));
    restartAutoplay();
  });
  container.addEventListener('focusin', stopAutoplay);
  container.addEventListener('focusout', () => setTimeout(startAutoplay, 0));

  function updateGlider() {
    if (!glider || currentIndex < 0 || currentIndex >= pills.length) return;
    const activePill = pills[currentIndex];
    if (!activePill) return;
    const leftOffset = activePill.offsetLeft;
    const pillWidth = activePill.offsetWidth;
    glider.style.transform = `translateX(${leftOffset}px)`;
    glider.style.width = `${pillWidth}px`;
  }

  // Asynchronously pre-decode all hero images in the background to ensure instantaneous slide switches with 0 lag
  slides.forEach(slide => {
    slide.querySelectorAll('img').forEach(img => {
      if (img.decode) {
        img.decode().catch(() => {});
      }
    });
  });

  function setSlide(targetIndex, dir = 'next') {
    if (targetIndex === currentIndex && slides[currentIndex].classList.contains('active')) {
      updateGlider();
      return;
    }

    const outgoingSlide = slides[currentIndex];
    const incomingSlide = slides[targetIndex];

    if (outgoingSlide && outgoingSlide !== incomingSlide) {
      outgoingSlide.classList.remove('active', 'slide-morph-blooming');
      outgoingSlide.classList.add('slide-morph-out');
      setTimeout(() => {
        outgoingSlide.classList.remove('slide-morph-out');
      }, 480);
    }

    if (incomingSlide) {
      incomingSlide.classList.remove('slide-morph-out');
      incomingSlide.classList.add('slide-morph-in');
      void incomingSlide.offsetWidth;
      requestAnimationFrame(() => {
        incomingSlide.classList.add('active', 'slide-morph-blooming');
        incomingSlide.classList.remove('slide-morph-in');
      });
    }

    pills.forEach((pill, idx) => {
      const isActive = idx === targetIndex;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    currentIndex = targetIndex;
    syncSlides();
    updateGlider();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const initialSlide = parseInt(urlParams.get('slide'), 10);
  if (!isNaN(initialSlide) && initialSlide >= 0 && initialSlide < slides.length) {
    setSlide(initialSlide);
  } else {
    // Initial glider layout
    requestAnimationFrame(updateGlider);
  }

  function nextSlide() {
    const nextIdx = (currentIndex + 1) % slides.length;
    setSlide(nextIdx, 'next');
  }

  function prevSlide() {
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    setSlide(prevIdx, 'prev');
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      restartAutoplay();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      restartAutoplay();
    });
  }

  pills.forEach((pill, idx) => {
    pill.addEventListener('click', () => {
      const dir = idx >= currentIndex ? 'next' : 'prev';
      setSlide(idx, dir);
      restartAutoplay();
    });
  });

  function startAutoplay() {
    stopAutoplay();
    if (!isPaused && !manuallyPaused && !document.hidden && animate() && !container.contains(document.activeElement)) {
      autoplayTimer = setInterval(nextSlide, ROTATION_MS);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  container.addEventListener('mouseenter', () => {
    isPaused = true;
    stopAutoplay();
  });

  container.addEventListener('mouseleave', () => {
    isPaused = false;
    startAutoplay();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (!animate()) stopAutoplay();
      else startAutoplay();
    });
  }

  // Touch swipe support
  let touchStartX = 0;
  let touchStartY = 0;
  container.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      restartAutoplay();
    }
    touchStartX = 0;
  }, { passive: true });

  // Keyboard arrow navigation
  window.addEventListener('keydown', (e) => {
    const rect = container.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft') {
      prevSlide();
      restartAutoplay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      restartAutoplay();
    }
  });

  // Secondary button category filter trigger
  container.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('[data-filter]');
    if (filterBtn) {
      const filter = filterBtn.dataset.filter;
      const targetPill = document.querySelector('.fluid-filter-pill[data-filter="' + filter + '"]') || document.querySelector('.filter-pill[data-filter="' + filter + '"]');
      if (targetPill) {
        targetPill.click();
      }
    }
  });

  window.addEventListener('resize', updateGlider, { passive: true });
  window.addEventListener('load', updateGlider);
  document.fonts?.ready?.then(updateGlider);

  startAutoplay();
}

// --- NAVIGATION & SCROLL PROGRESS ---
const navLinks = $$('[data-section]');
const sections = $$('main section[id]');
let framePending = false;

function requestScrollUpdate() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(updateScroll);
  }
}

function updateScroll() {
  const y = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = $('.scroll-progress');
  if (progress) {
    progress.style.transform = `scaleX(${scrollable > 0 ? y / scrollable : 0})`;
  }

  let current = 'home';
  for (const section of sections) {
    if (section.offsetTop <= y + window.innerHeight * 0.35) {
      current = section.id;
    }
  }

  const mobileMap = { inspiration: 'collection', services: 'collection', story: 'collection' };
  navLinks.forEach(link => {
    const target = link.closest('.mobile-nav') ? (mobileMap[current] || current) : current;
    const active = link.dataset.section === target;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });

  framePending = false;
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);

// --- INTERSECTION OBSERVER FOR POWER OPTIMIZATION ---
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    });
  }, { threshold: 0.15 });

  if (heroVideo) videoObserver.observe(heroVideo);
  storyVideos.forEach(video => videoObserver.observe(video));
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (heroVideo) heroVideo.pause();
    storyVideos.forEach(v => v.pause());
  } else {
    if (heroVideo) heroVideo.play().catch(() => {});
    storyVideos.forEach(v => v.play().catch(() => {}));
  }
});


// Initialize
renderCollection();
initHero3DShowcase();
requestScrollUpdate();

const initialActiveBtn = $('.fluid-filter-pill.active') || $('.island-btn.active') || $('.neo-btn.active') || $('.filter-pill.active');
if (initialActiveBtn) {
  if (filterContainer) filterContainer.dataset.activeFilter = initialActiveBtn.dataset.filter || 'all';
  centerActiveButton(initialActiveBtn);
}
window.addEventListener('resize', () => {
  const currentBtn = $('.fluid-filter-pill.active') || $('.island-btn.active') || $('.neo-btn.active') || $('.filter-pill.active');
  if (currentBtn) centerActiveButton(currentBtn);
});

// --- SMOOTH ANIMATED SCROLL ENGINE (Slow, Organic Physics with Cubic Easing) ---
let activeScrollAnim = null;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function slowSmoothScrollTo(targetY, customDuration, onComplete) {
  if (motion.matches) {
    window.scrollTo(0, targetY);
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  if (activeScrollAnim) {
    cancelAnimationFrame(activeScrollAnim);
    activeScrollAnim = null;
  }

  const startY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  const distance = targetY - startY;

  if (Math.abs(distance) < 2) {
    if (typeof onComplete === 'function') onComplete();
    return;
  }

  // Base duration ~1420ms for long hero-to-collection glides (~1600-2000px)
  const duration = customDuration || Math.min(1600, Math.max(900, Math.round(Math.abs(distance) * 0.72 + 320)));
  let startTime = null;
  let cancelled = false;

  // Temporarily disable CSS scroll-behavior: smooth so rAF positions apply instantly without browser fight
  const prevScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';

  const cleanupListeners = () => {
    window.removeEventListener('wheel', handleInterrupt, { passive: true });
    window.removeEventListener('touchstart', handleInterrupt, { passive: true });
    window.removeEventListener('pointerdown', handleInterrupt, { passive: true });
    window.removeEventListener('keydown', handleKeyInterrupt);
    document.documentElement.style.scrollBehavior = prevScrollBehavior;
  };

  const handleInterrupt = () => {
    cancelled = true;
    if (activeScrollAnim) {
      cancelAnimationFrame(activeScrollAnim);
      activeScrollAnim = null;
    }
    cleanupListeners();
  };

  const handleKeyInterrupt = (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
      handleInterrupt();
    }
  };

  window.addEventListener('wheel', handleInterrupt, { passive: true });
  window.addEventListener('touchstart', handleInterrupt, { passive: true });
  window.addEventListener('pointerdown', handleInterrupt, { passive: true });
  window.addEventListener('keydown', handleKeyInterrupt);

  function step(timestamp) {
    if (cancelled) return;
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo(0, Math.round(startY + distance * eased));

    if (progress < 1) {
      activeScrollAnim = requestAnimationFrame(step);
    } else {
      activeScrollAnim = null;
      window.scrollTo(0, targetY);
      cleanupListeners();
      if (typeof onComplete === 'function') onComplete();
    }
  }

  activeScrollAnim = requestAnimationFrame(step);
}

function highlightBouquetArrival() {
  const bouquetPill = $('.fluid-filter-pill[data-filter="bouquets"]');
  if (bouquetPill) {
    bouquetPill.classList.add('arrival-pulse');
    setTimeout(() => bouquetPill.classList.remove('arrival-pulse'), 1100);
  }
  const firstCard = $('.work-card[data-category="bouquets"]:not([hidden])');
  if (firstCard && animate()) {
    firstCard.animate([
      { transform: 'scale(1.025)', filter: 'brightness(1.06)' },
      { transform: 'scale(1)', filter: 'none' }
    ], { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }
}

function navigateToCategoryWithSlowScroll(categoryName, event) {
  if (event) event.preventDefault();
  const filter = categoryName || 'bouquets';

  // 1. Activate the target filter button in the collection ribbon
  const targetBtn = $(`.fluid-filter-pill[data-filter="${filter}"]`) ||
                    $(`.island-btn[data-filter="${filter}"]`) ||
                    $(`.neo-btn[data-filter="${filter}"]`) ||
                    $(`.filter-pill[data-filter="${filter}"]`);
  if (targetBtn) {
    targetBtn.click();
  }

  // 2. Measure target coordinate (placing the filter ribbon comfortably below sticky header)
  const header = $('.header');
  const headerHeight = header ? header.offsetHeight : 68;
  const ribbonWrap = $('.fluid-filter-ribbon-wrap') || $('#collection');
  const targetY = Math.max(0, Math.round(ribbonWrap.getBoundingClientRect().top + window.scrollY - headerHeight - 12));

  // 3. Distance-based slow smooth scroll duration (~1420ms for hero-to-collection)
  const currentY = window.scrollY || window.pageYOffset || 0;
  const dist = Math.abs(targetY - currentY);
  const duration = Math.min(1600, Math.max(850, Math.round(dist * 0.72 + 320)));

  slowSmoothScrollTo(targetY, duration, () => {
    if (filter === 'bouquets') {
      highlightBouquetArrival();
    }
  });
}

// Quick filter click from fluid tags ribbon & values ribbon
$$('.fluid-tag-pill[data-filter-trigger], .fluid-val-pill[data-filter-trigger]').forEach(tag => {
  tag.addEventListener('click', (e) => {
    const filter = tag.dataset.filterTrigger;
    if (filter) {
      navigateToCategoryWithSlowScroll(filter, e);
    }
  });
});

// Smooth in-page navigation for header and section anchors
$$('a[href^="#"]').forEach(anchor => {
  if (anchor.classList.contains('living-word-slot') ||
      anchor.classList.contains('living-scroll-cue') ||
      anchor.hasAttribute('data-filter-trigger')) {
    return;
  }
  anchor.addEventListener('click', (e) => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#' || href === '#main') return;
    const target = $(href);
    if (!target) return;

    e.preventDefault();
    const header = $('.header');
    const headerHeight = header ? header.offsetHeight : 68;
    const targetY = href === '#home' ? 0 : Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - headerHeight - 10));

    const currentY = window.scrollY || 0;
    const dist = Math.abs(targetY - currentY);
    const duration = Math.min(1400, Math.max(700, Math.round(dist * 0.5 + 300)));

    slowSmoothScrollTo(targetY, duration);
  });
});

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- LIVING TYPOGRAPHY HERO AUTO-ANIMATION & SYNCHRONIZED BACKDROP ---
function initLivingTypography() {
  const stage = $('.living-typography-stage');
  if (!stage) return;

  const slots = $$('.living-word-slot', stage);
  const slides = $$('.living-bg-slide');
  const scrollCue = $('.living-scroll-cue', stage);
  if (!slots.length) return;

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    slots.forEach(slot => slot.classList.remove('active'));
    return;
  }

  const SERVICES = ['bouquets', 'garlands', 'wedding', 'decor', 'gifts'];
  const cueTexts = {
    bouquets: 'खास बुके पहा · Explore Bouquets',
    garlands: 'शाही लग्नहार पहा · Explore Garlands',
    wedding: 'लग्न फुले पहा · Wedding Flowers',
    decor: 'सजावट डिझाईन्स पहा · Explore Décor',
    gifts: 'भेटवस्तू व कंबरपट्टा · Floral Jewellery'
  };
  const cueFilters = {
    bouquets: 'bouquets',
    garlands: 'garlands',
    wedding: 'garlands',
    decor: 'decor',
    gifts: 'belts'
  };

  let currentIndex = 0;
  let timerId = null;
  let isPaused = false;

  const STAND_DURATION = 1800; // 1.8s per service
  const RESET_PAUSE = 700;     // ~700ms intentional pause when all sit down

  function setService(index) {
    // If index is -1: all five words become equal and sit down
    if (index === -1) {
      slots.forEach(slot => {
        slot.classList.remove('active');
        slot.setAttribute('aria-current', 'false');
      });
      // Gently dim backdrops during reset
      slides.forEach(slide => slide.classList.remove('active'));
      if (scrollCue) {
        scrollCue.dataset.filter = 'all';
        const textEl = scrollCue.querySelector('.scroll-cue-text');
        if (textEl) textEl.textContent = 'सर्व फुले पहा · Explore All Flowers';
      }
      return;
    }

    const serviceId = SERVICES[index];
    slots.forEach((slot, idx) => {
      const isActive = (idx === index);
      slot.classList.toggle('active', isActive);
      slot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    slides.forEach(slide => {
      const match = (slide.dataset.service === serviceId);
      slide.classList.toggle('active', match);
    });

    if (scrollCue) {
      const targetFilter = cueFilters[serviceId] || 'bouquets';
      scrollCue.dataset.filter = targetFilter;
      const textEl = scrollCue.querySelector('.scroll-cue-text');
      if (textEl) textEl.textContent = cueTexts[serviceId] || 'खास बुके पहा · Explore Bouquets';
    }
  }

  function nextStep() {
    if (isPaused) return;

    if (currentIndex < SERVICES.length - 1) {
      currentIndex++;
      setService(currentIndex);
      timerId = setTimeout(nextStep, STAND_DURATION);
    } else {
      // Step: after Gifts sits down, have all five words briefly become equal, pause for ~700ms
      setService(-1);
      timerId = setTimeout(() => {
        if (!isPaused) {
          currentIndex = 0;
          setService(currentIndex); // Bouquets starts again!
          timerId = setTimeout(nextStep, STAND_DURATION);
        }
      }, RESET_PAUSE);
    }
  }

  // Interactive Hover / Tap exploration
  slots.forEach((slot, idx) => {
    slot.addEventListener('mouseenter', () => {
      isPaused = true;
      clearTimeout(timerId);
      currentIndex = idx;
      setService(idx);
    });

    slot.addEventListener('mouseleave', () => {
      isPaused = false;
      clearTimeout(timerId);
      timerId = setTimeout(nextStep, STAND_DURATION);
    });

    slot.addEventListener('click', (e) => {
      const filter = slot.dataset.filter || 'bouquets';
      navigateToCategoryWithSlowScroll(filter, e);
    });
  });

  if (scrollCue) {
    scrollCue.addEventListener('click', (e) => {
      const filter = scrollCue.dataset.filter || 'bouquets';
      navigateToCategoryWithSlowScroll(filter, e);
    });
  }

  // Power optimization on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isPaused = true;
      clearTimeout(timerId);
    } else {
      isPaused = false;
      clearTimeout(timerId);
      timerId = setTimeout(nextStep, 1000);
    }
  });

  // Initial Start: Bouquets stands up
  setService(0);
  timerId = setTimeout(nextStep, STAND_DURATION);
}

// Start Living Typography
initLivingTypography();

// --- ELASTIC SECTION BOUNDARIES PHYSICS ENGINE ---
// dividing edges subtly bend/stretch before settling organically on scroll
function initElasticBoundaries() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const boundaries = [
    {
      id: 'col-to-films',
      fillEl: document.querySelector('.boundary-collection-to-films .elastic-boundary-fill'),
      edgeEl: document.querySelector('.boundary-collection-to-films .elastic-boundary-edge'),
      container: document.querySelector('.boundary-collection-to-films'),
      base: { x0: 0, y0: 75, cp1x: 440, cp1y: 135, cp2x: 1000, cp2y: 15, x1: 1440, y1: 70 },
      factors: { cp1: 1.35, cp2: -0.9, y0: 0.2, y1: -0.2 },
      currentStretch: 0,
      targetStretch: 0,
      velocity: 0,
      stiffness: 0.1,
      damping: 0.76
    },
    {
      id: 'films-to-inspire',
      fillEl: document.querySelector('.boundary-films-to-inspiration .elastic-boundary-fill'),
      edgeEl: document.querySelector('.boundary-films-to-inspiration .elastic-boundary-edge'),
      container: document.querySelector('.boundary-films-to-inspiration'),
      base: { x0: 0, y0: 65, cp1x: 480, cp1y: 15, cp2x: 960, cp2y: 130, x1: 1440, y1: 60 },
      factors: { cp1: -0.95, cp2: 1.25, y0: -0.2, y1: 0.2 },
      currentStretch: 0,
      targetStretch: 0,
      velocity: 0,
      stiffness: 0.1,
      damping: 0.76
    },
    {
      id: 'inspire-to-services',
      fillEl: document.querySelector('.boundary-inspiration-to-services .elastic-boundary-fill'),
      edgeEl: document.querySelector('.boundary-inspiration-to-services .elastic-boundary-edge'),
      container: document.querySelector('.boundary-inspiration-to-services'),
      base: { x0: 0, y0: 70, cp1x: 400, cp1y: 120, cp2x: 1040, cp2y: 25, x1: 1440, y1: 65 },
      factors: { cp1: 1.1, cp2: -0.85, y0: 0.15, y1: -0.15 },
      currentStretch: 0,
      targetStretch: 0,
      velocity: 0,
      stiffness: 0.11,
      damping: 0.78
    },
    {
      id: 'services-to-story',
      fillEl: document.querySelector('.boundary-services-to-story .elastic-boundary-fill'),
      edgeEl: document.querySelector('.boundary-services-to-story .elastic-boundary-edge'),
      container: document.querySelector('.boundary-services-to-story'),
      base: { x0: 0, y0: 60, cp1x: 500, cp1y: 20, cp2x: 940, cp2y: 120, x1: 1440, y1: 70 },
      factors: { cp1: -0.85, cp2: 1.1, y0: -0.15, y1: 0.15 },
      currentStretch: 0,
      targetStretch: 0,
      velocity: 0,
      stiffness: 0.11,
      damping: 0.78
    },
    {
      id: 'contact-to-footer',
      fillEl: document.querySelector('.boundary-contact-to-footer .elastic-boundary-fill'),
      edgeEl: document.querySelector('.boundary-contact-to-footer .elastic-boundary-edge'),
      container: document.querySelector('.boundary-contact-to-footer'),
      base: { x0: 0, y0: 70, cp1x: 450, cp1y: 125, cp2x: 990, cp2y: 30, x1: 1440, y1: 65 },
      factors: { cp1: 1.1, cp2: -0.85, y0: 0.15, y1: -0.15 },
      currentStretch: 0,
      targetStretch: 0,
      velocity: 0,
      stiffness: 0.11,
      damping: 0.78
    }
  ].filter(b => b.fillEl && b.edgeEl && b.container);

  if (!boundaries.length) return;

  function renderBoundary(b) {
    const s = b.currentStretch;
    const y0 = Math.round((b.base.y0 + s * b.factors.y0) * 10) / 10;
    const cp1y = Math.round((b.base.cp1y + s * b.factors.cp1) * 10) / 10;
    const cp2y = Math.round((b.base.cp2y + s * b.factors.cp2) * 10) / 10;
    const y1 = Math.round((b.base.y1 + s * b.factors.y1) * 10) / 10;

    const curve = `M ${b.base.x0},${y0} C ${b.base.cp1x},${cp1y} ${b.base.cp2x},${cp2y} ${b.base.x1},${y1}`;
    const fillPath = `${curve} L 1440,140 L 0,140 Z`;

    b.edgeEl.setAttribute('d', curve);
    b.fillEl.setAttribute('d', fillPath);
  }

  // Initial render of all natural resting curves
  boundaries.forEach(renderBoundary);

  let lastScrollY = window.scrollY;
  let lastTime = performance.now();
  let isSpringActive = false;

  function springStep() {
    let hasMotion = false;
    const vh = window.innerHeight;

    for (let i = 0; i < boundaries.length; i++) {
      const b = boundaries[i];
      
      const rect = b.container.getBoundingClientRect();
      const inViewport = rect.top < vh + 100 && rect.bottom > -100;

      // Spring physics: force = displacement * stiffness
      const force = (b.targetStretch - b.currentStretch) * b.stiffness;
      b.velocity = (b.velocity + force) * b.damping;
      b.currentStretch += b.velocity;

      // Organic relaxation of target towards equilibrium
      b.targetStretch *= 0.88;
      if (Math.abs(b.targetStretch) < 0.01) b.targetStretch = 0;

      if (inViewport) {
        renderBoundary(b);
      }

      if (Math.abs(b.velocity) > 0.008 || Math.abs(b.currentStretch - b.targetStretch) > 0.01) {
        hasMotion = true;
      }
    }

    if (hasMotion) {
      requestAnimationFrame(springStep);
    } else {
      isSpringActive = false;
      boundaries.forEach(b => {
        b.currentStretch = 0;
        b.velocity = 0;
        renderBoundary(b);
      });
    }
  }

  function onScroll() {
    const now = performance.now();
    const dt = Math.max(8, now - lastTime);
    const scrollY = window.scrollY;
    const delta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    lastTime = now;

    // Normalize impulse by time delta
    const speed = delta / (dt / 16.67);
    const impulse = Math.max(-34, Math.min(34, speed * 1.6));

    for (let i = 0; i < boundaries.length; i++) {
      const b = boundaries[i];
      b.targetStretch += impulse;
      b.targetStretch = Math.max(-44, Math.min(44, b.targetStretch));
    }

    if (!isSpringActive) {
      isSpringActive = true;
      requestAnimationFrame(springStep);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// Start Elastic Section Boundaries
initElasticBoundaries();




// Premium editorial carousel: light, touch-friendly morphing deck.
(() => {
  const root = document.querySelector('.premium-carousel');
  if (!root) return;
  const slides = [...root.querySelectorAll('[data-premium-slide]')];
  const dots = [...root.querySelectorAll('[data-premium-dot]')];
  const prev = root.querySelector('[data-premium-prev]');
  const next = root.querySelector('[data-premium-next]');
  if (!slides.length) return;
  let current = 0;
  let timer;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const render = index => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  };
  const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };
  const start = () => { stop(); if (!reduceMotion.matches) timer = window.setInterval(() => render(current + 1), 5200); };
  prev?.addEventListener('click', () => { render(current - 1); start(); });
  next?.addEventListener('click', () => { render(current + 1); start(); });
  dots.forEach(dot => dot.addEventListener('click', () => { render(Number(dot.dataset.premiumDot)); start(); }));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  root.addEventListener('touchstart', stop, { passive: true });
  root.addEventListener('touchend', start, { passive: true });
  reduceMotion.addEventListener?.('change', start);
  render(0);
  start();
})();

// Progressive, stutter-free image revelation & proactive offscreen pre-decoding
(() => {
  function markImageLoaded(img) {
    if (!img) return;
    img.classList.add('is-loaded');
    const container = img.closest('.photo-button') || img.closest('.premium-slide-media');
    if (container) container.classList.add('is-loaded');
  }

  // 1. Immediately reveal pre-cached or complete images to prevent any delay/flicker
  document.querySelectorAll('.photo-button > img, .premium-slide-media img').forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      markImageLoaded(img);
    }
  });

  // 2. Global load event capturing: smoothly reveals images the instant they finish loading
  document.addEventListener('load', event => {
    if (event.target && event.target.tagName === 'IMG') {
      markImageLoaded(event.target);
    }
  }, { capture: true, passive: true });

  // 3. Proactive offscreen observer (600px ahead of viewport):
  // Triggers async decoding before the user scrolls to the card, completely preventing pop-in and frame drops
  if ('IntersectionObserver' in window) {
    const prefetchObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('img') || (entry.target.tagName === 'IMG' ? entry.target : null);
          if (img) {
            if (img.loading === 'lazy') {
              img.loading = 'eager';
            }
            if (img.decode) {
              img.decode().catch(() => {}).then(() => markImageLoaded(img));
            }
          }
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '600px 0px' });

    document.querySelectorAll('.work-card, .premium-slide').forEach(card => prefetchObserver.observe(card));
  }
})();

