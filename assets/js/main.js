const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const modal = document.querySelector('[data-modal]');
const modalImage = document.querySelector('[data-modal-image]');
const modalCaption = document.querySelector('[data-modal-caption]');
const modalClose = document.querySelector('[data-modal-close]');
const galleryButtons = document.querySelectorAll('[data-gallery-filter]');
const galleryItems = document.querySelectorAll('[data-gallery-item]');
const galleryFilterItems = document.querySelectorAll('.gallery-item[data-category]');
const contactForm = document.querySelector('[data-contact-form]');
const statusBox = document.querySelector('[data-form-status]');
const slider = document.querySelector('[data-slider]');
const slides = slider ? Array.from(slider.querySelectorAll('[data-slide]')) : [];
const sliderDots = slider ? Array.from(slider.querySelectorAll('[data-slider-dot]')) : [];
let sliderIndex = 0;
let sliderTimer;
let sliderTouchStart;
const sliderDelay = 5000;

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function showSlide(index) {
  if (!slides.length) {
    return;
  }

  sliderIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === sliderIndex;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
  sliderDots.forEach((dot, dotIndex) => {
    const active = dotIndex === sliderIndex;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-current', active ? 'true' : 'false');
  });
}

function restartSlider() {
  window.clearTimeout(sliderTimer);
  if (slides.length > 1) {
    sliderTimer = window.setTimeout(() => {
      showSlide(sliderIndex + 1);
      restartSlider();
    }, sliderDelay);
  }
}

if (slider && slides.length) {
  slider.classList.add('is-scripted');
  showSlide(0);
  slider.querySelector('[data-slider-prev]')?.addEventListener('click', () => {
    showSlide(sliderIndex - 1);
    restartSlider();
  });
  slider.querySelector('[data-slider-next]')?.addEventListener('click', () => {
    showSlide(sliderIndex + 1);
    restartSlider();
  });
  sliderDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.sliderDot));
      restartSlider();
    });
  });
  slider.addEventListener('touchstart', (event) => {
    sliderTouchStart = event.changedTouches[0].clientX;
    window.clearTimeout(sliderTimer);
  }, { passive: true });
  slider.addEventListener('touchend', (event) => {
    if (typeof sliderTouchStart !== 'number') {
      restartSlider();
      return;
    }
    const distance = event.changedTouches[0].clientX - sliderTouchStart;
    if (Math.abs(distance) > 40) {
      showSlide(sliderIndex + (distance < 0 ? 1 : -1));
    }
    sliderTouchStart = undefined;
    restartSlider();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(sliderTimer);
    } else {
      restartSlider();
    }

  });
  restartSlider();
  window.setTimeout(() => {
    if (!document.hidden && !slider.matches(':focus-within')) {
      restartSlider();
    }
  }, 50);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

function openModal(image, caption) {
  if (!modal || !modalImage || !modalCaption) {
    return;
  }

  modalImage.src = image;
  modalImage.alt = caption;
  modalCaption.textContent = caption;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

galleryFilterItems.forEach((item) => {
  item.addEventListener('click', () => openModal(item.dataset.fullImage || '', item.dataset.caption || 'Gallery image'));
});

galleryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.galleryFilter;
    galleryButtons.forEach((control) => control.classList.remove('is-active'));
    button.classList.add('is-active');

    galleryItems.forEach((item) => {
      const matches = filter === 'all' || item.dataset.category === filter;
      item.style.display = matches ? '' : 'none';
    });
  });
});

modalClose?.addEventListener('click', closeModal);
modal?.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

if (contactForm && statusBox) {
  const formStart = contactForm.querySelector('input[name="formStart"]');
  if (formStart) {
    formStart.value = String(Date.now());
  }

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusBox.classList.remove('is-visible');
    statusBox.textContent = 'Sending enquiry...';
    statusBox.classList.add('is-visible');

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send enquiry.');
      }

      statusBox.textContent = data.message || 'Enquiry sent successfully.';
      contactForm.reset();
      if (formStart) {
        formStart.value = String(Date.now());
      }
    } catch (error) {
      statusBox.textContent = error.message;
    }
  });
}