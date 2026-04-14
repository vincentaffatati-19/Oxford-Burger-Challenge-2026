const REVIEW_STORAGE_KEY = 'oxford-burger-battle-reviews-v2';
const SYNC_URL_STORAGE_KEY = 'oxford-burger-battle-sync-url';

const categories = [
  {
    name: 'Appearance',
    description: 'Bun-to-burger ratio, visual appeal, cheese melt, freshness of toppings, and overall presentation.'
  },
  {
    name: 'Patty Quality',
    description: 'Beef flavor, seasoning, crust or sear, juiciness, and whether it tastes fresh rather than frozen.'
  },
  {
    name: 'Bun Performance',
    description: 'Softness, toast level, structure, and ability to hold together without getting soggy or falling apart.'
  },
  {
    name: 'Toppings & Balance',
    description: 'Quality of cheese, lettuce, tomato, onion, pickles, sauces, and how well everything works together.'
  },
  {
    name: 'Flavor & Craveability',
    description: 'First-bite impact, overall deliciousness, and whether you immediately want another bite.'
  },
  {
    name: 'Value',
    description: 'Portion size, quality for the price, and whether you would feel good ordering it again.'
  },
  {
    name: 'Worth-the-Calories Factor',
    description: 'Is this indulgence justified? Did it feel like a proper splurge?'
  },
  {
    name: 'Lagniappe',
    description: 'The little something extra that made it memorable: house sauce, bacon jam, killer pickles, or swagger.'
  }
];

const elements = {
  reviewer: document.getElementById('reviewer'),
  date: document.getElementById('date'),
  restaurant: document.getElementById('restaurant'),
  burgerName: document.getElementById('burgerName'),
  bestWith: document.getElementById('bestWith'),
  tieNotes: document.getElementById('tieNotes'),
  totalScore: document.getElementById('totalScore'),
  scoreNote: document.getElementById('scoreNote'),
  scoreList: document.getElementById('scoreList'),
  reviewsBtn: document.getElementById('reviewsBtn'),
  saveBtn: document.getElementById('saveBtn'),
  syncBtn: document.getElementById('syncBtn'),
  submitBtn: document.getElementById('submitBtn'),
  reviewsDialog: document.getElementById('reviewsDialog'),
  syncDialog: document.getElementById('syncDialog'),
  reviewsContainer: document.getElementById('reviewsContainer'),
  reviewsEmpty: document.getElementById('reviewsEmpty'),
  googleScriptUrl: document.getElementById('googleScriptUrl'),
  saveSyncBtn: document.getElementById('saveSyncBtn'),
  exportBtn: document.getElementById('exportBtn'),
  reviewCardTemplate: document.getElementById('reviewCardTemplate')
};

let currentReviewId = null;

function todayLocalISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

function escapeSelector(value) {
  return CSS.escape(String(value));
}

function readReviews() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeReviews(reviews) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
}

function createScoreRows() {
  elements.scoreList.innerHTML = '';
  categories.forEach((category, index) => {
    const section = document.createElement('section');
    section.className = 'score-row';
    section.innerHTML = `
      <div class="score-top">
        <div>
          <h2>${category.name}</h2>
          <p>${category.description}</p>
        </div>
        <div class="field score-input">
          <label for="score-${index}">Score</label>
          <input id="score-${index}" type="number" inputmode="numeric" min="1" max="10" placeholder="1–10" />
        </div>
      </div>
      <div class="field">
        <label for="notes-${index}">Notes</label>
        <textarea id="notes-${index}" placeholder="What stood out?"></textarea>
      </div>
    `;
    elements.scoreList.appendChild(section);
  });
}

function scoreInputs() {
  return categories.map((_, index) => document.getElementById(`score-${index}`));
}

function noteInputs() {
  return categories.map((_, index) => document.getElementById(`notes-${index}`));
}

function getScores() {
  return categories.map((category, index) => {
    const scoreValue = Number(document.getElementById(`score-${index}`).value);
    return {
      category: category.name,
      score: Number.isFinite(scoreValue) ? scoreValue : 0,
      notes: document.getElementById(`notes-${index}`).value.trim()
    };
  });
}

function updateTotal() {
  const total = getScores().reduce((sum, entry) => sum + entry.score, 0);
  elements.totalScore.textContent = total;
  if (total >= 70) elements.scoreNote.textContent = 'The court finds this burger elite.';
  else if (total >= 60) elements.scoreNote.textContent = 'A serious contender with persuasive evidence.';
  else if (total >= 50) elements.scoreNote.textContent = 'A respectable stop with a workable case.';
  else if (total > 0) elements.scoreNote.textContent = 'The record is mixed, but proceedings continue.';
  else elements.scoreNote.textContent = 'Start scoring to build the case.';
  return total;
}

function buildReviewId(data) {
  return `${data.reviewer || 'reviewer'}__${data.restaurant || 'restaurant'}__${data.date || 'date'}__${data.burgerName || 'burger'}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
}

function getFormData() {
  const scores = getScores();
  const review = {
    id: currentReviewId,
    reviewer: elements.reviewer.value,
    date: elements.date.value,
    restaurant: elements.restaurant.value,
    burgerName: elements.burgerName.value.trim(),
    bestWith: elements.bestWith.value.trim(),
    tieNotes: elements.tieNotes.value.trim(),
    scores,
    total: scores.reduce((sum, entry) => sum + entry.score, 0),
    updatedAt: new Date().toISOString()
  };
  review.id = review.id || buildReviewId(review);
  return review;
}

function populateForm(review) {
  currentReviewId = review?.id || null;
  elements.reviewer.value = review?.reviewer || '';
  elements.date.value = review?.date || todayLocalISO();
  elements.restaurant.value = review?.restaurant || '';
  elements.burgerName.value = review?.burgerName || '';
  elements.bestWith.value = review?.bestWith || '';
  elements.tieNotes.value = review?.tieNotes || '';

  categories.forEach((_, index) => {
    document.getElementById(`score-${index}`).value = review?.scores?.[index]?.score || '';
    document.getElementById(`notes-${index}`).value = review?.scores?.[index]?.notes || '';
  });

  updateTotal();
}

function resetForm(keepReviewer = true) {
  const reviewer = keepReviewer ? elements.reviewer.value : '';
  populateForm({ reviewer, date: todayLocalISO() });
}

function validateReview(review) {
  if (!review.reviewer) {
    alert('Select a reviewer first.');
    elements.reviewer.focus();
    return false;
  }
  if (!review.restaurant) {
    alert('Select a restaurant first.');
    elements.restaurant.focus();
    return false;
  }
  return true;
}

function saveReview() {
  const review = getFormData();
  if (!validateReview(review)) return;

  const reviews = readReviews();
  const existingIndex = reviews.findIndex((entry) => entry.id === review.id);
  if (existingIndex >= 0) reviews[existingIndex] = review;
  else reviews.push(review);

  writeReviews(reviews);
  currentReviewId = review.id;
  renderReviews();
  alert('Review saved on this device.');
}

function deleteReview(id) {
  const filtered = readReviews().filter((entry) => entry.id !== id);
  writeReviews(filtered);
  if (currentReviewId === id) resetForm();
  renderReviews();
}

function renderReviews() {
  const selectedReviewer = elements.reviewer.value;
  const reviews = readReviews()
    .filter((entry) => !selectedReviewer || entry.reviewer === selectedReviewer)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  elements.reviewsContainer.innerHTML = '';
  elements.reviewsEmpty.style.display = reviews.length ? 'none' : 'block';

  reviews.forEach((review) => {
    const node = elements.reviewCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.review-title').textContent = review.restaurant || 'Unknown restaurant';
    node.querySelector('.review-meta').textContent = `${review.burgerName || 'Burger'} • ${review.date || 'No date'} • ${review.reviewer || 'Unknown reviewer'}`;
    node.querySelector('.review-total').textContent = `${review.total || 0}/80`;
    node.querySelector('.open-review').addEventListener('click', () => {
      populateForm(review);
      elements.reviewsDialog.close();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    node.querySelector('.delete-review').addEventListener('click', () => {
      if (confirm('Delete this saved review?')) deleteReview(review.id);
    });
    elements.reviewsContainer.appendChild(node);
  });
}

function saveSyncUrl() {
  localStorage.setItem(SYNC_URL_STORAGE_KEY, elements.googleScriptUrl.value.trim());
  alert('Sync URL saved.');
}

function loadSyncUrl() {
  elements.googleScriptUrl.value = localStorage.getItem(SYNC_URL_STORAGE_KEY) || '';
}

async function submitReview() {
  const review = getFormData();
  if (!validateReview(review)) return;

  const url = elements.googleScriptUrl.value.trim();
  if (!url) {
    alert('Open Sync and paste your Google Apps Script web app URL first.');
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(review)
    });

    const text = await response.text();
    let payload = {};
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { ok: response.ok, raw: text };
    }

    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || 'Submission failed.');
    }

    alert('Review submitted to the central Google Sheet.');
  } catch (error) {
    alert(`Could not submit review: ${error.message}`);
  }
}

function exportReviews() {
  const selectedReviewer = elements.reviewer.value;
  if (!selectedReviewer) {
    alert('Select a reviewer first.');
    return;
  }

  const reviews = readReviews().filter((entry) => entry.reviewer === selectedReviewer);
  const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${selectedReviewer.toLowerCase()}-burger-reviews.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function wireEvents() {
  document.addEventListener('input', (event) => {
    if (event.target.matches('input[type="number"]')) {
      const value = Number(event.target.value);
      if (value > 10) event.target.value = 10;
      if (value < 1 && event.target.value !== '') event.target.value = 1;
      updateTotal();
    }
  });

  elements.saveBtn.addEventListener('click', saveReview);
  elements.reviewsBtn.addEventListener('click', () => {
    renderReviews();
    elements.reviewsDialog.showModal();
  });
  elements.syncBtn.addEventListener('click', () => elements.syncDialog.showModal());
  elements.submitBtn.addEventListener('click', submitReview);
  elements.saveSyncBtn.addEventListener('click', saveSyncUrl);
  elements.exportBtn.addEventListener('click', exportReviews);

  elements.reviewer.addEventListener('change', renderReviews);

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialog = document.getElementById(button.dataset.close);
      dialog.close();
    });
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveReview();
    }
  });
}

function init() {
  createScoreRows();
  loadSyncUrl();
  wireEvents();
  populateForm({ date: todayLocalISO() });
  renderReviews();
}

init();
