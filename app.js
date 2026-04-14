const STORAGE_KEY = 'oxford-burger-battle-reviews-v3';

const categories = [
  {
    name: 'Appearance',
    desc: 'Bun-to-burger ratio, visual appeal, cheese melt, freshness of toppings, and overall presentation.'
  },
  {
    name: 'Patty Quality',
    desc: 'Beef flavor, seasoning, crust or sear, juiciness, and whether it tastes fresh rather than frozen.'
  },
  {
    name: 'Bun Performance',
    desc: 'Softness, toast level, structure, and ability to hold together without collapsing into evidence.'
  },
  {
    name: 'Toppings & Balance',
    desc: 'Quality of cheese, lettuce, tomato, onion, pickles, sauces, and how well everything works together.'
  },
  {
    name: 'Flavor & Craveability',
    desc: 'First-bite impact, overall deliciousness, and whether you immediately want another bite.'
  },
  {
    name: 'Value',
    desc: 'Portion size, quality for the price, and whether you would feel good ordering it again.'
  },
  {
    name: 'Lagniappe',
    desc: 'The little something extra: house sauce, special grind, bacon jam, killer pickles, or swagger.'
  }
];

const fields = {
  reviewer: document.getElementById('reviewer'),
  date: document.getElementById('date'),
  restaurant: document.getElementById('restaurant'),
  burgerType: document.getElementById('burgerType'),
  bestWith: document.getElementById('bestWith'),
  tieBreakerSelect: document.getElementById('tieBreakerSelect'),
  tieNotes: document.getElementById('tieNotes')
};

const scoreTable = document.getElementById('scoreTable');
const totalScore = document.getElementById('totalScore');
const scoreVerdict = document.getElementById('scoreVerdict');
const reviewsDialog = document.getElementById('reviewsDialog');
const reviewsList = document.getElementById('reviewsList');

let currentReviewId = null;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredReviews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function setStoredReviews(reviews) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createScoreRows() {
  scoreTable.innerHTML = '';
  categories.forEach((cat, index) => {
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <div class="top">
        <div>
          <h3>${cat.name}</h3>
          <p>${cat.desc}</p>
        </div>
        <div class="score-input">
          <label for="score-${index}">Score</label>
          <input id="score-${index}" type="number" inputmode="numeric" min="1" max="10" placeholder="1–10" />
        </div>
      </div>
      <div class="notes">
        <label for="notes-${index}">Notes</label>
        <textarea id="notes-${index}" placeholder="What stood out?"></textarea>
      </div>
    `;
    scoreTable.appendChild(row);
  });
}

function getScores() {
  return categories.map((cat, index) => ({
    category: cat.name,
    score: Number(document.getElementById(`score-${index}`).value) || 0,
    notes: document.getElementById(`notes-${index}`).value.trim()
  }));
}

function getVerdict(total) {
  if (total >= 70) return 'The court finds this burger elite.';
  if (total >= 60) return 'A serious contender with persuasive evidence.';
  if (total >= 50) return 'A respectable stop with a workable case.';
  if (total > 0) return 'The case remains open, but the record is mixed.';
  return 'Start scoring to build the case.';
}

function updateTotal() {
  const total = getScores().reduce((sum, item) => sum + item.score, 0);
  totalScore.textContent = total;
  scoreVerdict.textContent = getVerdict(total);
  return total;
}

function buildReviewId(review) {
  return `${review.reviewer || 'unknown'}__${review.restaurant || 'unknown'}__${review.date || 'undated'}__${review.burgerType || 'burger'}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
}

function getFormData() {
  const scores = getScores();
  const review = {
    reviewer: fields.reviewer.value,
    date: fields.date.value,
    restaurant: fields.restaurant.value,
    burgerType: fields.burgerType.value.trim(),
    bestWith: fields.bestWith.value.trim(),
    tieBreaker: fields.tieBreakerSelect.value,
    tieNotes: fields.tieNotes.value.trim(),
    scores,
    total: scores.reduce((sum, item) => sum + item.score, 0),
    updatedAt: new Date().toISOString()
  };
  review.id = currentReviewId || buildReviewId(review);
  return review;
}

function populateForm(review = {}) {
  currentReviewId = review.id || null;
  fields.reviewer.value = review.reviewer || '';
  fields.date.value = review.date || todayIso();
  fields.restaurant.value = review.restaurant || '';
  fields.burgerType.value = review.burgerType || '';
  fields.bestWith.value = review.bestWith || '';
  fields.tieBreakerSelect.value = review.tieBreaker || fields.tieBreakerSelect.options[0].value;
  fields.tieNotes.value = review.tieNotes || '';

  categories.forEach((_, index) => {
    document.getElementById(`score-${index}`).value = review.scores?.[index]?.score || '';
    document.getElementById(`notes-${index}`).value = review.scores?.[index]?.notes || '';
  });

  updateTotal();
}

function saveReview() {
  const review = getFormData();
  if (!review.reviewer) {
    alert('Choose a reviewer first.');
    fields.reviewer.focus();
    return;
  }
  if (!review.restaurant) {
    alert('Choose a restaurant before saving.');
    fields.restaurant.focus();
    return;
  }

  const reviews = getStoredReviews();
  const index = reviews.findIndex((entry) => entry.id === review.id);
  if (index >= 0) {
    reviews[index] = review;
  } else {
    reviews.push(review);
  }
  setStoredReviews(reviews);
  currentReviewId = review.id;
  alert('Review saved on this device.');
}

function openMyReviews() {
  const reviewer = fields.reviewer.value;
  if (!reviewer) {
    alert('Choose a reviewer first.');
    fields.reviewer.focus();
    return;
  }

  const reviews = getStoredReviews()
    .filter((entry) => entry.reviewer === reviewer)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  if (!reviews.length) {
    reviewsList.innerHTML = '<p>No saved reviews for this reviewer yet.</p>';
  } else {
    reviewsList.innerHTML = reviews.map((review) => `
      <article class="review-card">
        <strong>${escapeHtml(review.restaurant || 'Unknown stop')}</strong>
        <div class="review-meta">
          ${escapeHtml(review.burgerType || 'Burger')}<br>
          ${escapeHtml(review.date || 'No date')}<br>
          Score: ${review.total || 0}/70
        </div>
        <div class="review-actions">
          <button class="button button-secondary small-button" type="button" data-load-id="${review.id}">Open</button>
        </div>
      </article>
    `).join('');
  }

  if (typeof reviewsDialog.showModal === 'function') {
    reviewsDialog.showModal();
  } else {
    reviewsDialog.setAttribute('open', 'open');
  }
}

function loadReviewById(id) {
  const review = getStoredReviews().find((entry) => entry.id === id);
  if (!review) return;
  populateForm(review);
  reviewsDialog.close?.();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  document.addEventListener('click', (event) => {
    const loadBtn = event.target.closest('[data-load-id]');
    if (loadBtn) loadReviewById(loadBtn.getAttribute('data-load-id'));
  });

  document.getElementById('saveBtn').addEventListener('click', saveReview);
  document.getElementById('myReviewsBtn').addEventListener('click', openMyReviews);
  document.getElementById('closeDialogBtn').addEventListener('click', () => reviewsDialog.close?.());
}

function init() {
  createScoreRows();
  populateForm({ date: todayIso() });
  wireEvents();
}

init();
