function toggleDeptBox(boxId) {
  const box = document.getElementById(boxId);
  const isExpanded = box.classList.contains('expanded');

  // Close any currently open box first (smooth collapse)
  document.querySelectorAll('.dept-box.expanded').forEach(function(openBox) {
    openBox.classList.remove('expanded');
    const hint = openBox.querySelector('.close-hint');
    if (hint) hint.textContent = 'Click to expand';
  });

  // Un-fade all boxes
  document.querySelectorAll('.dept-box').forEach(function(b) {
    b.classList.remove('faded');
  });

  if (!isExpanded) {
    setTimeout(function() {
      box.classList.add('expanded');

      // Fade out all other boxes
      document.querySelectorAll('.dept-box').forEach(function(b) {
        if (b !== box) b.classList.add('faded');
      });

      // Update hint text
      const hint = box.querySelector('.close-hint');
      if (hint) hint.textContent = '✕ Click to close';

      // Smooth scroll to the card
      setTimeout(function() {
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }, 50);
  }
}

/* ===== SCROLL COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1800; // ms
  const steps = 60;
  const increment = target / steps;
  let current = 0;
  let step = 0;

  // Easing: ease-out quad
  const ease = function(t) { return t * (2 - t); };

  const timer = setInterval(function() {
    step++;
    const progress = ease(step / steps);
    current = Math.round(progress * target);
    el.textContent = current + suffix;
    if (step >= steps) {
      el.textContent = target + suffix;
      clearInterval(timer);
    }
  }, duration / steps);
}

// IntersectionObserver — fires once when impact section enters viewport
const impactObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      document.querySelectorAll('.impact-number[data-target]').forEach(function(el) {
        animateCounter(el);
      });
      impactObserver.disconnect(); // only run once
    }
  });
}, { threshold: 0.3 });

document.addEventListener('DOMContentLoaded', function() {
  const impactSection = document.getElementById('impact');
  if (impactSection) impactObserver.observe(impactSection);
});
