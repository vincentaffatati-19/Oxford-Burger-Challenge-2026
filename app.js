const STORAGE_KEY = 'oxford-burger-battle-reviews-v6';
const RESTAURANTS = [
  'Phillips Grocery',
  'Bim Bam',
  'Good Day',
  'Handy Andy',
  'Oxford Burger Co',
  'City Grocery'
];

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
const leaderboardList = document.getElementById('leaderboardList');
const leaderSummary = document.getElementById('leaderSummary');
const leaderDetailDialog = document.getElementById('leaderDetailDialog');
const leaderDetailTitle = document.getElementById('leaderDetailTitle');
const leaderDetailContent = document.getElementById('leaderDetailContent');

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
  if (total >= 63) return 'This burger is making a real run at the title.';
  if (total >= 56) return 'A serious contender with a lot going for it.';
  if (total >= 49) return 'A respectable stop with some strong moments.';
  if (total > 0) return 'The record is mixed, but the table has notes.';
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
  renderLeaderboard();
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

  openDialog(reviewsDialog);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', 'open');
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === 'function') {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
  }
}

function loadReviewById(id) {
  const review = getStoredReviews().find((entry) => entry.id === id);
  if (!review) return;
  populateForm(review);
  closeDialog(reviewsDialog);
  showView('scorecard');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function calculateLeaderboard(reviews) {
  const grouped = RESTAURANTS.map((restaurant) => {
    const restaurantReviews = reviews.filter((entry) => entry.restaurant === restaurant);
    if (!restaurantReviews.length) return null;

    const totals = restaurantReviews.map((entry) => Number(entry.total) || 0);
    const categoryAverages = categories.map((cat) => {
      const scores = restaurantReviews.map((entry) => {
        const match = (entry.scores || []).find((score) => score.category === cat.name);
        return Number(match?.score) || 0;
      });
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return { category: cat.name, average: avg };
    });

    const flavorAverage = categoryAverages.find((item) => item.category === 'Flavor & Craveability')?.average || 0;
    const pattyAverage = categoryAverages.find((item) => item.category === 'Patty Quality')?.average || 0;

    return {
      restaurant,
      averageTotal: totals.reduce((sum, total) => sum + total, 0) / totals.length,
      high: Math.max(...totals),
      low: Math.min(...totals),
      reviewCount: restaurantReviews.length,
      categoryAverages,
      flavorAverage,
      pattyAverage,
      reviews: restaurantReviews.slice().sort((a, b) => a.reviewer.localeCompare(b.reviewer))
    };
  }).filter(Boolean);

  grouped.sort((a, b) => {
    if (b.averageTotal !== a.averageTotal) return b.averageTotal - a.averageTotal;
    if (b.flavorAverage !== a.flavorAverage) return b.flavorAverage - a.flavorAverage;
    return b.pattyAverage - a.pattyAverage;
  });

  return grouped.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function renderLeaderboard() {
  const leaderboard = calculateLeaderboard(getStoredReviews());
  if (!leaderboard.length) {
    leaderSummary.innerHTML = '<div class="summary-tile"><strong>Leaderboard</strong><div>No reviews saved yet.</div></div>';
    leaderboardList.innerHTML = '<div class="review-card">Save some reviews and the leaderboard will appear here.</div>';
    return;
  }

  const leader = leaderboard[0];
  const reviewerCount = new Set(getStoredReviews().map((entry) => entry.reviewer).filter(Boolean)).size;
  leaderSummary.innerHTML = `
    <div class="summary-tile">
      <strong>Current Leader</strong>
      <div class="summary-value">${escapeHtml(leader.restaurant)}</div>
    </div>
    <div class="summary-tile">
      <strong>Top Average</strong>
      <div class="summary-value">${leader.averageTotal.toFixed(1)} / 70</div>
    </div>
    <div class="summary-tile">
      <strong>Reviews Counted</strong>
      <div class="summary-value">${reviewerCount}</div>
    </div>
  `;

  leaderboardList.innerHTML = leaderboard.map((entry) => `
    <article class="leader-card" data-leader-restaurant="${escapeHtml(entry.restaurant)}">
      <div class="leader-card-top">
        <div>
          <h3>#${entry.rank} ${escapeHtml(entry.restaurant)}</h3>
          <div class="leader-average">Average: ${entry.averageTotal.toFixed(1)} / 70</div>
          <div class="leader-meta">High: ${entry.high} • Low: ${entry.low}</div>
        </div>
        ${entry.rank === 1 ? '<div class="rank-badge">Leader</div>' : ''}
      </div>
    </article>
  `).join('');
}

function openLeaderDetail(restaurant) {
  const leaderboard = calculateLeaderboard(getStoredReviews());
  const entry = leaderboard.find((item) => item.restaurant === restaurant);
  if (!entry) return;

  leaderDetailTitle.textContent = `${entry.restaurant} — Rank #${entry.rank}`;
  leaderDetailContent.innerHTML = `
    <div class="detail-stats">
      <div class="summary-tile"><strong>Average Total</strong><div class="summary-value">${entry.averageTotal.toFixed(1)}</div></div>
      <div class="summary-tile"><strong>Highest Score</strong><div class="summary-value">${entry.high}</div></div>
      <div class="summary-tile"><strong>Lowest Score</strong><div class="summary-value">${entry.low}</div></div>
      <div class="summary-tile"><strong>Score Range</strong><div class="summary-value">${entry.high - entry.low}</div></div>
    </div>
    <section class="detail-section">
      <h3>Category Averages</h3>
      <div class="category-averages">
        ${entry.categoryAverages.map((cat) => `
          <div class="bar-row">
            <div class="bar-head"><span>${escapeHtml(cat.category)}</span><span>${cat.average.toFixed(1)}</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, cat.average * 10))}%"></div></div>
          </div>
        `).join('')}
      </div>
    </section>
    <section class="detail-section">
      <h3>Reviewer Scores</h3>
      <div class="reviewer-score-list">
        ${entry.reviews.map((review) => `
          <div class="review-card">
            <strong>${escapeHtml(review.reviewer)}</strong>
            <div class="review-meta">Total: ${review.total}/70${review.burgerType ? `<br>${escapeHtml(review.burgerType)}` : ''}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  openDialog(leaderDetailDialog);
}

function showView(viewName) {
  const scorecardView = document.getElementById('scorecardView');
  const leaderboardView = document.getElementById('leaderboardView');
  const showScorecardBtn = document.getElementById('showScorecardBtn');
  const showLeaderboardBtn = document.getElementById('showLeaderboardBtn');

  const scorecardActive = viewName === 'scorecard';
  scorecardView.classList.toggle('hidden', !scorecardActive);
  leaderboardView.classList.toggle('hidden', scorecardActive);
  showScorecardBtn.classList.toggle('nav-button-active', scorecardActive);
  showLeaderboardBtn.classList.toggle('nav-button-active', !scorecardActive);

  if (!scorecardActive) {
    renderLeaderboard();
  }
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
    if (loadBtn) {
      loadReviewById(loadBtn.getAttribute('data-load-id'));
      return;
    }
    const leaderCard = event.target.closest('[data-leader-restaurant]');
    if (leaderCard) {
      openLeaderDetail(leaderCard.getAttribute('data-leader-restaurant'));
    }
  });

  document.getElementById('saveBtn').addEventListener('click', saveReview);
  document.getElementById('myReviewsBtn').addEventListener('click', openMyReviews);
  document.getElementById('closeDialogBtn').addEventListener('click', () => closeDialog(reviewsDialog));
  document.getElementById('closeLeaderDetailBtn').addEventListener('click', () => closeDialog(leaderDetailDialog));
  document.getElementById('showScorecardBtn').addEventListener('click', () => showView('scorecard'));
  document.getElementById('showLeaderboardBtn').addEventListener('click', () => showView('leaderboard'));
}

function init() {
  createScoreRows();
  populateForm({ date: todayIso() });
  wireEvents();
  renderLeaderboard();
}

init();
