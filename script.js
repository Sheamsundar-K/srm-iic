/* ===== HELPER FUNCTIONS ===== */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInitials(name) {
  if (!name) return 'SRM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/* ===== INLINE EXPAND / ACCORDION DEPT RENDERER ===== */
let openCategoryId = null;

function renderDeptCards() {
  const container = document.getElementById('dept-grid-view');
  if (!container || typeof mousData === 'undefined' || !mousData.categories) return;

  container.innerHTML = mousData.categories.map(function(cat, idx) {
    const partnerCount = cat.partners ? cat.partners.length : 0;
    const delayClass = 'delay-' + ((idx % 6) + 1);
    return (
      '<div class="dept-accordion reveal-scale ' + delayClass + '" id="acc-' + escapeHTML(cat.id) + '">' +
        '<div class="dept-acc-header" onclick="toggleAccordion(\'' + escapeHTML(cat.id) + '\')">' +
          '<div class="dept-acc-left">' +
            '<div class="dept-icon-circle">' +
              '<img src="' + escapeHTML(cat.icon) + '" alt="' + escapeHTML(cat.title) + ' Icon" onerror="this.src=\'Images/aiml-icon.jpg\'">' +
            '</div>' +
            '<div class="dept-acc-info">' +
              '<h4 class="dept-acc-title">' + escapeHTML(cat.title) + '</h4>' +
              '<span class="dept-acc-count">' + partnerCount + ' Active MoU' + (partnerCount === 1 ? '' : 's') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="dept-acc-chevron" aria-label="Expand">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="dept-acc-body" id="body-' + escapeHTML(cat.id) + '" hidden>' +
          '<div class="partner-cards-grid">' +
            renderPartnerCards(cat.partners || []) +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  document.querySelectorAll('.reveal-scale').forEach(function(el) {
    revealObserver.observe(el);
  });
  
  // Re-bind tilt & ripple effects to newly rendered cards
  init3DTilt();
  initRippleEffect();
}

function renderPartnerCards(partners) {
  if (!partners || partners.length === 0) {
    return '<div class="mou-empty-state"><h4>Partners Coming Soon</h4><p>Partnerships for this category will be listed here soon.</p></div>';
  }

  return partners.map(function(p) {
    const initials = getInitials(p.name);
    const logoHTML = p.logo
      ? '<img src="' + escapeHTML(p.logo) + '" alt="' + escapeHTML(p.name) + ' Logo" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'">' +
        '<div class="logo-initials-badge" style="display:none">' + initials + '</div>'
      : '<div class="logo-initials-badge">' + initials + '</div>';

    const nameHTML = p.website
      ? '<a href="' + escapeHTML(p.website) + '" target="_blank" rel="noopener noreferrer" class="partner-name-link">' + escapeHTML(p.name) + '</a>'
      : '<span class="partner-name-text">' + escapeHTML(p.name) + '</span>';

    let photos = [];
    if (p.mouPhotos && Array.isArray(p.mouPhotos) && p.mouPhotos.length > 0) {
      photos = p.mouPhotos;
    } else if (p.mouPhoto && p.mouPhoto.trim() !== '') {
      photos = [p.mouPhoto];
    }

    const hasPhoto = photos.length > 0;
    const photosJSON = hasPhoto ? escapeHTML(JSON.stringify(photos)) : '';

    const clickAttr = hasPhoto
      ? 'onclick="openMouModal(' + photosJSON + ', ' + "'" + escapeHTML(p.name) + "'" + ')" role="button" tabindex="0"'
      : '';
    const photoBtnText = photos.length > 1 ? 'View ' + photos.length + ' Photos →' : 'View Photo →';
    const photoBtn = hasPhoto
      ? '<button class="mou-photo-btn" title="Click to view MoU signing ceremony photos">' + photoBtnText + '</button>'
      : '';
    const cardClass = hasPhoto ? 'partner-card has-mou-photo' : 'partner-card';

    return (
      '<div class="' + cardClass + '" ' + clickAttr + '>' +
        '<div class="partner-card-logo-wrap">' + logoHTML + '</div>' +
        '<div class="partner-card-body">' +
          '<div class="partner-card-name">' + nameHTML + '</div>' +
          '<p class="partner-card-about">' + escapeHTML(p.about) + '</p>' +
        '</div>' +
        '<div class="partner-card-footer">' +
          '<span class="mou-year-tag">MoU ' + escapeHTML(p.year) + '</span>' +
          photoBtn +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* ===== MOU PHOTO LIGHTBOX MODAL WITH MULTI-PHOTO GALLERY ===== */
let currentMouPhotos = [];
let currentMouIndex = 0;
let currentMouPartner = '';

function openMouModal(photos, partnerName) {
  const modal = document.getElementById('mou-photo-modal');
  const img = document.getElementById('mou-modal-img');
  const title = document.getElementById('mou-modal-title');
  if (!modal || !img) return;

  if (typeof photos === 'string') {
    try {
      currentMouPhotos = JSON.parse(photos);
    } catch(e) {
      currentMouPhotos = [photos];
    }
  } else if (Array.isArray(photos)) {
    currentMouPhotos = photos;
  } else {
    currentMouPhotos = [];
  }

  currentMouIndex = 0;
  currentMouPartner = partnerName || 'MoU Signing';

  updateMouModalContent();

  modal.classList.add('is-active');
  document.body.style.overflow = 'hidden';
}

function updateMouModalContent() {
  const img = document.getElementById('mou-modal-img');
  const title = document.getElementById('mou-modal-title');
  const thumbContainer = document.getElementById('mou-modal-thumbnails');
  const prevBtn = document.getElementById('mou-prev-btn');
  const nextBtn = document.getElementById('mou-next-btn');

  if (!img) return;

  const currentSrc = currentMouPhotos[currentMouIndex] || '';
  img.src = currentSrc;
  img.alt = currentMouPartner + ' MoU Signing Photo ' + (currentMouIndex + 1);

  if (title) {
    if (currentMouPhotos.length > 1) {
      title.textContent = currentMouPartner + ' — MoU Signing Ceremony (' + (currentMouIndex + 1) + '/' + currentMouPhotos.length + ')';
    } else {
      title.textContent = currentMouPartner + ' — MoU Signing Ceremony';
    }
  }

  // Toggle prev/next buttons
  if (prevBtn) prevBtn.style.display = currentMouPhotos.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = currentMouPhotos.length > 1 ? 'flex' : 'none';

  // Render Thumbnails
  if (thumbContainer) {
    if (currentMouPhotos.length > 1) {
      thumbContainer.style.display = 'flex';
      thumbContainer.innerHTML = currentMouPhotos.map((src, i) => `
        <div class="mou-thumb-item ${i === currentMouIndex ? 'is-active' : ''}" onclick="selectMouPhoto(${i})">
          <img src="${escapeHTML(src)}" alt="Thumbnail ${i + 1}">
        </div>
      `).join('');
    } else {
      thumbContainer.style.display = 'none';
      thumbContainer.innerHTML = '';
    }
  }
}

function selectMouPhoto(index) {
  if (index >= 0 && index < currentMouPhotos.length) {
    currentMouIndex = index;
    updateMouModalContent();
  }
}

function prevMouPhoto() {
  if (currentMouPhotos.length <= 1) return;
  currentMouIndex = (currentMouIndex - 1 + currentMouPhotos.length) % currentMouPhotos.length;
  updateMouModalContent();
}

function nextMouPhoto() {
  if (currentMouPhotos.length <= 1) return;
  currentMouIndex = (currentMouIndex + 1) % currentMouPhotos.length;
  updateMouModalContent();
}

function closeMouModal() {
  const modal = document.getElementById('mou-photo-modal');
  if (!modal) return;
  modal.classList.remove('is-active');
  document.body.style.overflow = '';
  setTimeout(function() {
    const img = document.getElementById('mou-modal-img');
    if (img) img.src = '';
    currentMouPhotos = [];
    currentMouIndex = 0;
  }, 300);
}

function toggleAccordion(categoryId) {
  const acc = document.getElementById('acc-' + categoryId);
  const body = document.getElementById('body-' + categoryId);
  if (!acc || !body) return;

  const isOpen = !body.hidden;

  if (openCategoryId && openCategoryId !== categoryId) {
    const prevBody = document.getElementById('body-' + openCategoryId);
    const prevAcc = document.getElementById('acc-' + openCategoryId);
    if (prevBody) prevBody.hidden = true;
    if (prevAcc) prevAcc.classList.remove('is-open');
  }

  if (isOpen) {
    body.hidden = true;
    acc.classList.remove('is-open');
    openCategoryId = null;
  } else {
    body.hidden = false;
    acc.classList.add('is-open');
    openCategoryId = categoryId;
    setTimeout(function() {
      acc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }
}

/* ===== DYNAMIC TOTAL MOUS MILESTONE COUNTER UPDATE ===== */
function updateMilestoneTotalMoUs() {
  if (typeof mousData === 'undefined' || !mousData.categories) return;
  const totalMoUs = mousData.categories.reduce(function(acc, cat) {
    return acc + (cat.partners ? cat.partners.length : 0);
  }, 0);
  const activeMoUsEl = document.querySelector('.impact-number[data-target]');
  if (activeMoUsEl) {
    activeMoUsEl.setAttribute('data-target', totalMoUs);
  }
}

/* ===== SCROLL COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  if (isNaN(target)) return;
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1800;
  const steps = 60;
  let step = 0;
  const ease = function(t) { return t * (2 - t); };
  const timer = setInterval(function() {
    step++;
    const progress = ease(step / steps);
    const current = Math.round(progress * target);
    el.textContent = current + suffix;
    if (step >= steps) {
      el.textContent = target + suffix;
      clearInterval(timer);
    }
  }, duration / steps);
}

const counterObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      const el = entry.target;
      if (!el.classList.contains('counted')) {
        el.classList.add('counted');
        animateCounter(el);
      }
    }
  });
}, { threshold: 0.25 });

/* ===== SCROLL REVEAL ANIMATION OBSERVER ===== */
const revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -30px 0px'
});

/* ===== INTERACTIVE CANVAS PARTICLE CONSTELLATION (HERO) ===== */
function initHeroParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: null, y: null, radius: 150 };

  function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const heroSection = document.getElementById('hero');
  if (heroSection) {
    heroSection.addEventListener('mousemove', function(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    heroSection.addEventListener('mouseleave', function() {
      mouse.x = null;
      mouse.y = null;
    });
  }

  const particleCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 14000), 75);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.2 + 1,
      color: Math.random() > 0.4 ? 'rgba(245, 197, 24, ' : 'rgba(26, 111, 212, '
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Mouse magnetism
      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          let force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 1.5;
          p.y -= (dy / dist) * force * 1.5;
        }
      }

      // Draw particle dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '0.7)';
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        let p2 = particles[j];
        let dx = p.x - p2.x;
        let dy = p.y - p2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          let alpha = (1 - dist / 130) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(245, 197, 24, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Connect to mouse cursor
      if (mouse.x !== null && mouse.y !== null) {
        let dx = p.x - mouse.x;
        let dy = p.y - mouse.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          let alpha = (1 - dist / 120) * 0.45;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ===== 3D CARD TILT & CURSOR GLOW SPOTLIGHT ===== */
function init3DTilt() {
  const cards = document.querySelectorAll('.eco-card, .vm-card, .vm-stat-card, .impact-item, .dept-acc-header, .partner-card');
  
  cards.forEach(card => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = 'true';

    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -7;
      const rotateY = ((x - centerX) / centerX) * 7;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

/* ===== TOP SCROLL PROGRESS & BACK TO TOP BUTTON ===== */
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress-bar');
  const backToTopBtn = document.getElementById('back-to-top');
  const circle = document.querySelector('.progress-ring-circle');

  const radius = circle ? circle.r.baseVal.value : 20;
  const circumference = 2 * Math.PI * radius;

  if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
  }

  function onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);

    if (progressBar) {
      progressBar.style.width = (progress * 100) + '%';
    }

    if (circle) {
      const offset = circumference - progress * circumference;
      circle.style.strokeDashoffset = offset;
    }

    if (backToTopBtn) {
      if (scrollTop > 300) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ===== SCROLL SPY ACTIVE NAVBAR LINK ===== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', function() {
    let current = '';
    const scrollPosition = window.pageYOffset + 150;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ===== CARD & BUTTON RIPPLE EFFECT ===== */
function initRippleEffect() {
  const rippleElements = document.querySelectorAll('.btn, .clickable-coe, .dept-acc-header');
  
  rippleElements.forEach(el => {
    if (el.dataset.rippleBound) return;
    el.dataset.rippleBound = 'true';

    el.addEventListener('click', function(e) {
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* ===== INITIALIZATION ON DOM LOAD ===== */
document.addEventListener('DOMContentLoaded', function() {
  updateMilestoneTotalMoUs();
  renderDeptCards();

  document.querySelectorAll('[data-target]').forEach(function(el) {
    counterObserver.observe(el);
  });

  document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(function(el) {
    revealObserver.observe(el);
  });

  initHeroParticles();
  init3DTilt();
  initScrollProgress();
  initScrollSpy();
  initRippleEffect();

  // Close modal on backdrop click or Escape key
  const modal = document.getElementById('mou-photo-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeMouModal();
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMouModal();
  });
});
