const productDetails = {
  'ebook-1': { title: 'The first edition' },
  'ebook-2': { title: 'Second ebook title' },
  'ebook-3': { title: 'Third ebook title' }
};

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const dialog = document.querySelector('#info-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogMessage = document.querySelector('#dialog-message');

function showInfo(title, message) {
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialog.showModal();
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    mainNav.classList.toggle('is-open', !isOpen);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      mainNav.classList.remove('is-open');
    });
  });
}

document.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]');
  if (!action) return;

  const actionType = action.dataset.action;
  if (actionType === 'preview') {
    const product = productDetails[action.dataset.product];
    const title = product?.title ?? 'This ebook';
    showInfo('Preview coming soon', `A sample or excerpt for “${title}” can be added here when it is ready.`);
  }

  if (actionType === 'checkout') {
    const product = productDetails[action.dataset.product];
    const title = product?.title ?? 'This ebook';
    showInfo('This edition is coming soon', `Checkout for “${title}” will be available when the ebook is released.`);
  }

  if (actionType === 'social') {
    const platform = action.dataset.social || 'Social profile';
    showInfo(`${platform} link to be added`, `Share the exact Old World Proof ${platform} address and this footer link can point directly to it.`);
  }
});

document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
document.querySelector('.dialog-ok')?.addEventListener('click', () => dialog.close());

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const year = document.querySelector('#current-year');
if (year) year.textContent = new Date().getFullYear();

// Native details keeps each question usable with touch, mouse, or keyboard.
document.querySelectorAll('.faq-item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    item.parentElement.querySelectorAll('.faq-item').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const track = document.querySelector('#review-track');
// Readers can swipe, scroll, or use arrow keys without extra controls.
track?.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const card = track.querySelector('.review-card');
  if (!card) return;
  event.preventDefault();
  const step = card.getBoundingClientRect().width + 20;
  track.scrollBy({
    left: event.key === 'ArrowRight' ? step : -step,
    behavior: reducedMotion.matches ? 'instant' : 'smooth'
  });
});
const joinForm = document.querySelector('#join-form');
const verifyForm = document.querySelector('#verify-form');
const signupStatus = document.querySelector('#join-status');
let signupTicket = '';
async function signupRequest(path, data, form) {
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  signupStatus.textContent = 'Please wait…';
  try {
    const response = await fetch(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) throw new Error('Signup requires the community server. Please open the latest preview link.');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    signupStatus.textContent = result.message;
    return result;
  } catch (error) {
    signupStatus.textContent = error.message || 'Unable to connect. Please try again.';
    return null;
  } finally { button.disabled = false; }
}
joinForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(joinForm);
  const result = await signupRequest('/api/signup/request', {name: data.get('name'), email: data.get('email'), consent: data.has('consent')}, joinForm);
  if (!result) return;
  signupTicket = result.ticket;
  joinForm.hidden = true; verifyForm.hidden = false;
  document.querySelector('#join-code').focus();
});
verifyForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await signupRequest('/api/signup/verify', {ticket: signupTicket, code: new FormData(verifyForm).get('code')}, verifyForm);
  if (!result) return;
  verifyForm.hidden = true;
  signupStatus.textContent = '';
  const thanks = document.querySelector('#join-thanks');
  thanks.hidden = false; thanks.focus();
  signupTicket = ''; joinForm.reset(); verifyForm.reset();
});
document.querySelector('#join-back')?.addEventListener('click', () => {
  signupTicket = ''; verifyForm.reset(); verifyForm.hidden = true; joinForm.hidden = false;
  signupStatus.textContent = 'You can request another code after one minute.';
  document.querySelector('#join-email').focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mainNav?.classList.contains('is-open')) {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    menuToggle.focus();
  }
});

// Keep navigation and motion controls consistent across devices.
function closeNavigation() {
  mainNav?.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
}
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeNavigation();
});
window.matchMedia('(min-width: 1051px)').addEventListener('change', closeNavigation);
const purchaseBar = document.querySelector('.sticky-purchase');
const purchaseMotion = document.querySelector('.purchase-motion');
let purchasePaused = reducedMotion.matches;
function updatePurchaseMotion() {
  purchaseBar?.classList.toggle('motion-paused', purchasePaused);
  if (!purchaseMotion) return;
  purchaseMotion.textContent = purchasePaused ? 'Resume motion' : 'Pause motion';
  purchaseMotion.setAttribute('aria-pressed', String(purchasePaused));
  purchaseMotion.setAttribute('aria-label', purchasePaused ? 'Resume purchase bar motion' : 'Pause purchase bar motion');
  purchaseMotion.hidden = reducedMotion.matches;
}
purchaseMotion?.addEventListener('click', () => {
  purchasePaused = !purchasePaused;
  updatePurchaseMotion();
});
reducedMotion.addEventListener('change', () => {
  purchasePaused = reducedMotion.matches;

  updatePurchaseMotion();

});
updatePurchaseMotion();
