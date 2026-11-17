/**
 * NovaFlow — Landing page interactions
 * Vanilla JavaScript, no dependencies.
 * Author: Anis Jamil
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initSmoothScroll();
    initHeaderState();
    initActiveNav();
    initPricingToggle();
    initAccordion();
    initContactForm();
    initScrollTop();
    initReveal();
    setYear();
  });

  /* ---------------------------------------------------------------
   * Mobile hamburger navigation
   * ------------------------------------------------------------- */
  var navToggle, primaryNav;
  var mobileQuery = window.matchMedia('(max-width: 960px)');

  function setNavHidden() {
    // Hide the off-canvas menu from assistive tech & tab order when closed on mobile.
    if (!primaryNav) return;
    var isOpen = primaryNav.classList.contains('is-open');
    if (mobileQuery.matches && !isOpen) {
      primaryNav.setAttribute('inert', '');
      primaryNav.setAttribute('aria-hidden', 'true');
    } else {
      primaryNav.removeAttribute('inert');
      primaryNav.removeAttribute('aria-hidden');
    }
  }

  function openNav() {
    primaryNav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('nav-open');
    setNavHidden();
    // Wait a frame so the menu is visible before moving focus into it.
    window.setTimeout(function () {
      var firstLink = primaryNav.querySelector('a');
      if (firstLink) firstLink.focus();
    }, 60);
  }

  function closeNav(returnFocus) {
    if (!primaryNav || !primaryNav.classList.contains('is-open')) return;
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('nav-open');
    setNavHidden();
    if (returnFocus) navToggle.focus();
  }

  function initMobileNav() {
    navToggle = document.getElementById('navToggle');
    primaryNav = document.getElementById('primaryNav');
    if (!navToggle || !primaryNav) return;

    setNavHidden();

    navToggle.addEventListener('click', function () {
      if (primaryNav.classList.contains('is-open')) {
        closeNav(false);
      } else {
        openNav();
      }
    });

    // Close when a link inside the menu is chosen.
    primaryNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav(false);
    });

    // Escape closes the menu and returns focus to the toggle.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav(true);
    });

    // Reset state when resizing up to desktop.
    var onChange = function () {
      if (!mobileQuery.matches) closeNav(false);
      setNavHidden();
    };
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', onChange);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(onChange);
    }
  }

  /* ---------------------------------------------------------------
   * Smooth section scrolling (with focus management)
   * ------------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      var target = document.getElementById(id.slice(1));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });

      // Move focus for keyboard and screen-reader users without a second jump.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });

      if (history.pushState) history.pushState(null, '', id);
    });
  }

  /* ---------------------------------------------------------------
   * Sticky header shadow
   * ------------------------------------------------------------- */
  function initHeaderState() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ---------------------------------------------------------------
   * Active navigation state
   * ------------------------------------------------------------- */
  function initActiveNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    // Map extra sections onto the closest nav item.
    var aliases = { preview: 'how-it-works', faq: 'reviews' };
    var sections = ['home', 'features', 'how-it-works', 'preview', 'pricing', 'reviews', 'faq', 'contact']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    function setActive(id) {
      var navId = aliases[id] || id;
      links.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + navId;
        link.classList.toggle('is-active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
    setActive('home');
  }

  /* ---------------------------------------------------------------
   * Pricing toggle (monthly / yearly, 20% discount)
   * ------------------------------------------------------------- */
  function formatPrice(value) {
    var number = parseFloat(value);
    return '$' + (number % 1 === 0 ? number.toFixed(0) : number.toFixed(2));
  }

  function initPricingToggle() {
    var toggle = document.getElementById('billingSwitch');
    if (!toggle) return;

    var labelMonthly = document.getElementById('labelMonthly');
    var labelYearly = document.getElementById('labelYearly');
    var amounts = document.querySelectorAll('.price-amount[data-monthly]');
    var notes = document.querySelectorAll('.price-note[data-monthly-note]');

    function render(isYearly) {
      toggle.setAttribute('aria-checked', String(isYearly));
      labelMonthly.classList.toggle('is-active', !isYearly);
      labelYearly.classList.toggle('is-active', isYearly);

      Array.prototype.forEach.call(amounts, function (el) {
        var next = formatPrice(isYearly ? el.dataset.yearly : el.dataset.monthly);
        if (prefersReducedMotion.matches) {
          el.textContent = next;
          return;
        }
        el.classList.add('is-updating');
        window.setTimeout(function () {
          el.textContent = next;
          el.classList.remove('is-updating');
        }, 160);
      });

      Array.prototype.forEach.call(notes, function (el) {
        el.textContent = isYearly ? el.dataset.yearlyNote : el.dataset.monthlyNote;
      });
    }

    toggle.addEventListener('click', function () {
      render(toggle.getAttribute('aria-checked') !== 'true');
    });

    // Clicking the text labels also switches billing.
    labelMonthly.addEventListener('click', function () { render(false); });
    labelYearly.addEventListener('click', function () { render(true); });
    labelMonthly.style.cursor = 'pointer';
    labelYearly.style.cursor = 'pointer';
  }

  /* ---------------------------------------------------------------
   * FAQ accordion (WAI-ARIA pattern)
   * ------------------------------------------------------------- */
  function initAccordion() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.accordion-trigger'));
    if (!triggers.length) return;

    function setState(trigger, open) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', String(open));
      trigger.closest('.accordion-item').classList.toggle('is-open', open);
      if (panel) panel.classList.toggle('is-open', open);
    }

    triggers.forEach(function (trigger, index) {
      trigger.addEventListener('click', function () {
        var willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        // Keep one item open at a time for a tidy layout.
        triggers.forEach(function (other) {
          if (other !== trigger) setState(other, false);
        });
        setState(trigger, willOpen);
      });

      // Arrow / Home / End key support between headers.
      trigger.addEventListener('keydown', function (event) {
        var next = null;
        switch (event.key) {
          case 'ArrowDown': next = triggers[(index + 1) % triggers.length]; break;
          case 'ArrowUp': next = triggers[(index - 1 + triggers.length) % triggers.length]; break;
          case 'Home': next = triggers[0]; break;
          case 'End': next = triggers[triggers.length - 1]; break;
          default: return;
        }
        event.preventDefault();
        next.focus();
      });
    });

    // Open the first question by default.
    setState(triggers[0], true);
  }

  /* ---------------------------------------------------------------
   * Contact form validation (front-end demo only)
   * ------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    var success = document.getElementById('formSuccess');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var rules = {
      name: function (value) {
        if (!value) return 'Please enter your name.';
        if (value.length < 2) return 'Your name should be at least 2 characters.';
        return '';
      },
      email: function (value) {
        if (!value) return 'Please enter your email address.';
        if (!emailPattern.test(value)) return 'Please enter a valid email address, e.g. jane@company.com.';
        return '';
      },
      message: function (value) {
        if (!value) return 'Please enter a message.';
        if (value.length < 10) return 'Your message should be at least 10 characters.';
        return '';
      }
    };

    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var message = rule(field.value.trim());
      var wrapper = field.closest('.form-field');
      var errorEl = document.getElementById(field.name + '-error');

      wrapper.classList.toggle('has-error', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (errorEl) errorEl.textContent = message;
      return !message;
    }

    // Validate on blur, and re-validate live once a field has shown an error.
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!rules[field.name]) return;
      field.addEventListener('blur', function () {
        if (field.value.trim() !== '') validateField(field);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        if (success && !success.hidden) success.hidden = true;
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = null;
      ['name', 'email', 'message'].forEach(function (name) {
        var field = form.elements[name];
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Demo only: nothing is sent to a server.
      var firstName = form.elements.name.value.trim().split(/\s+/)[0];
      success.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#10B981"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span><strong>Thanks, ' + escapeHTML(firstName) + '! Your message passed validation.</strong><br>' +
        'This is a demo form, so nothing was sent or stored — in a live project it would be connected to an email or form service.</span>';
      success.hidden = false;
      success.focus();

      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) {
        el.removeAttribute('aria-invalid');
      });
    });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ---------------------------------------------------------------
   * Scroll-to-top buttons
   * ------------------------------------------------------------- */
  function initScrollTop() {
    var floating = document.getElementById('backToTop');
    var buttons = document.querySelectorAll('[data-scroll-top]');

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
        var logo = document.querySelector('.site-header .logo');
        if (logo) logo.focus({ preventScroll: true });
      });
    });

    if (!floating) return;
    var ticking = false;
    function update() {
      floating.classList.toggle('is-visible', window.scrollY > 640);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------
   * Subtle scroll reveal animations
   * ------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    function showAll() {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-visible'); });
    }

    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    // Stagger siblings inside grids for a polished cascade.
    Array.prototype.forEach.call(items, function (el) {
      var parent = el.parentElement;
      var siblings = parent ? parent.querySelectorAll(':scope > .reveal') : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.setProperty('--reveal-delay', (index * 0.08).toFixed(2) + 's');
    });

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------
   * Footer year
   * ------------------------------------------------------------- */
  function setYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();
