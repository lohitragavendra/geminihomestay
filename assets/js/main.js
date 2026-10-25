const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
const modal = document.querySelector('[data-modal]');
const modalImage = document.querySelector('[data-modal-image]');
const modalCaption = document.querySelector('[data-modal-caption]');
const modalClose = document.querySelector('[data-modal-close]');
const galleryButtons = document.querySelectorAll('[data-gallery-filter]');
const galleryItems = document.querySelectorAll('[data-gallery-item]');
const contactForm = document.querySelector('[data-contact-form]');
const statusBox = document.querySelector('[data-form-status]');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
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

galleryItems.forEach((item) => {
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