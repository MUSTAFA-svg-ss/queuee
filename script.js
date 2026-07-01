'use strict';

/* ============================================================
   THE ROM-COM ARCHIVE — Application Logic
   ============================================================ */

const STORAGE_KEY = 'romcomArchive.favorites';

/* ---------- Utilities ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const escapeHtml = str => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};
const posterStyle = movie => `background-image:${movie.poster}`;
const starRating = rating => {
  const filled = Math.round(rating / 2);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

/* ---------- Favorites (localStorage) ---------- */
function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function saveFavorites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function isFavorite(id) {
  return getFavorites().includes(id);
}
function toggleFavorite(id) {
  let list = getFavorites();
  if (list.includes(id)) {
    list = list.filter(x => x !== id);
  } else {
    list.push(id);
  }
  saveFavorites(list);
  updateFavCount();
  return list.includes(id);
}
function updateFavCount() {
  $('#favCount').textContent = getFavorites().length;
}

/* ---------- Movie card builder ---------- */
function movieCardHTML(movie) {
  const fav = isFavorite(movie.id) ? ' is-fav' : '';
  return `
    <article class="movie-card" data-id="${movie.id}">
      <div class="movie-card__poster-wrap">
        <div class="movie-card__poster" data-poster-id="${movie.id}" style="${posterStyle(movie)}"></div>
        <button class="movie-card__fav${fav}" data-fav-id="${movie.id}" aria-label="Toggle favorite">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.2C.5 8 2.3 4.5 5.8 4c2-.3 3.9.7 6.2 3 2.3-2.3 4.2-3.3 6.2-3 3.5.5 5.3 4 3.8 7.8C19.5 16.4 12 21 12 21z"/></svg>
        </button>
        <span class="movie-card__rating-badge">★ ${movie.rating.toFixed(1)}</span>
      </div>
      <div class="movie-card__body">
        <h3 class="movie-card__title">${escapeHtml(movie.title)}</h3>
        <div class="movie-card__meta">
          <span>${movie.year}</span><span>${movie.runtime} min</span><span>${escapeHtml(movie.genres[0])}</span>
        </div>
      </div>
    </article>`;
}

/* ============================================================
   HERO COLLAGE
   ============================================================ */
function renderHeroCollage() {
  const collage = $('#heroCollage');
  const shuffled = [...MOVIES].sort(() => Math.random() - 0.5).slice(0, 12);
  collage.innerHTML = shuffled.map(m => `<div data-poster-id="${m.id}" data-collage-tile style="${posterStyle(m)}"></div>`).join('');

  // Slowly cross-fade tiles for ambient motion
  const tiles = $$('#heroCollage > div');
  const pool = MOVIES;
  setInterval(() => {
    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    const next = pool[Math.floor(Math.random() * pool.length)];
    tile.style.opacity = '0';
    setTimeout(() => {
      tile.dataset.posterId = next.id;
      tile.style.backgroundImage = next.poster;
      tile.classList.remove('has-real-art');
      getMovieMedia(next).then(media => {
        if (media.poster && tile.dataset.posterId === next.id) {
          tile.style.backgroundImage = `url('${media.poster}')`;
          tile.classList.add('has-real-art');
        }
      });
      tile.style.opacity = '1';
    }, 600);
  }, 3200);
}

/* ============================================================
   FEATURED MOVIE (random each load)
   ============================================================ */
function renderFeatured() {
  const movie = MOVIES[Math.floor(Math.random() * MOVIES.length)];
  const el = $('#featuredCard');
  el.innerHTML = `
    <div class="featured__poster" data-poster-id="${movie.id}" style="${posterStyle(movie)}"></div>
    <div class="featured__body">
      <h3 class="featured__title">${escapeHtml(movie.title)}</h3>
      <div class="featured__meta">
        <span>${movie.year}</span><span>${movie.runtime} min</span><span>${escapeHtml(movie.genres.join(', '))}</span>
        <span class="featured__rating">★ ${movie.rating.toFixed(1)}</span>
      </div>
      <p class="featured__synopsis">${escapeHtml(movie.synopsis)}</p>
      <button class="btn btn--gold" data-open-detail="${movie.id}">Read More</button>
    </div>`;
}

/* ============================================================
   TROPES
   ============================================================ */
let activeTrope = null;
const ALL_TROPES = [...new Set(MOVIES.flatMap(m => m.tropes))].sort();

function renderTropes() {
  const wrap = $('#tropesList');
  wrap.innerHTML = ALL_TROPES.map(t =>
    `<button type="button" class="trope-tag" data-trope="${escapeHtml(t)}">${escapeHtml(t)}</button>`
  ).join('');
}

/* ============================================================
   FILTERS + GRID
   ============================================================ */
const filterState = { genre: '', decade: '', country: '', rating: '', runtime: '', awards: '', trope: '', year: '', search: '' };

function populateFilterOptions() {
  const genres = [...new Set(MOVIES.flatMap(m => m.genres))].sort();
  const decades = [...new Set(MOVIES.map(m => m.decade))].sort();
  const countries = [...new Set(MOVIES.map(m => m.country))].sort();

  $('#filterGenre').insertAdjacentHTML('beforeend', genres.map(g => `<option value="${g}">${g}</option>`).join(''));
  $('#filterDecade').insertAdjacentHTML('beforeend', decades.map(d => `<option value="${d}">${d}</option>`).join(''));
  $('#filterCountry').insertAdjacentHTML('beforeend', countries.map(c => `<option value="${c}">${c}</option>`).join(''));
}

function matchesFilters(movie) {
  if (filterState.genre && !movie.genres.includes(filterState.genre)) return false;
  if (filterState.decade && movie.decade !== filterState.decade) return false;
  if (filterState.country && movie.country !== filterState.country) return false;
  if (filterState.rating && movie.rating < parseFloat(filterState.rating)) return false;
  if (filterState.runtime === 'short' && movie.runtime >= 100) return false;
  if (filterState.runtime === 'mid' && (movie.runtime < 100 || movie.runtime > 120)) return false;
  if (filterState.runtime === 'long' && movie.runtime <= 120) return false;
  if (filterState.awards === 'yes' && !movie.awardWinner) return false;
  if (filterState.trope && !movie.tropes.includes(filterState.trope)) return false;
  if (filterState.year && movie.year !== filterState.year) return false;
  return true;
}

function renderGrid() {
  const grid = $('#movieGrid');
  const results = MOVIES.filter(matchesFilters);

  grid.innerHTML = results.map(movieCardHTML).join('');
  $('#resultCount').textContent = `${results.length} film${results.length === 1 ? '' : 's'}`;
  $('#emptyState').hidden = results.length !== 0;

  // Stagger the card entrance animation
  $$('#movieGrid .movie-card').forEach((card, i) => {
    card.style.animationDelay = `${Math.min(i, 12) * 0.05}s`;
  });
}

function bindFilterControls() {
  $('#filterGenre').addEventListener('change', e => { filterState.genre = e.target.value; renderGrid(); });
  $('#filterDecade').addEventListener('change', e => { filterState.decade = e.target.value; renderGrid(); });
  $('#filterCountry').addEventListener('change', e => { filterState.country = e.target.value; renderGrid(); });
  $('#filterRating').addEventListener('change', e => { filterState.rating = e.target.value; renderGrid(); });
  $('#filterRuntime').addEventListener('change', e => { filterState.runtime = e.target.value; renderGrid(); });
  $('#filterAwards').addEventListener('change', e => { filterState.awards = e.target.value; renderGrid(); });

  $('#resetFilters').addEventListener('click', () => {
    Object.keys(filterState).forEach(k => (filterState[k] = ''));
    $$('.filters__select').forEach(sel => (sel.value = ''));
    activeTrope = null;
    $$('.trope-tag').forEach(t => t.classList.remove('is-active'));
    $$('.year-chip').forEach(y => y.classList.remove('is-active'));
    renderGrid();
  });
}

/* ============================================================
   TROPE CLICK => FILTER
   ============================================================ */
function bindTropeClicks() {
  $('#tropesList').addEventListener('click', e => {
    const btn = e.target.closest('.trope-tag');
    if (!btn) return;
    const trope = btn.dataset.trope;
    const turningOn = filterState.trope !== trope;
    filterState.trope = turningOn ? trope : '';
    $$('.trope-tag').forEach(t => t.classList.toggle('is-active', turningOn && t === btn));
    renderGrid();
    $('#grid').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ============================================================
   DECADES
   ============================================================ */
function renderDecades() {
  const decades = ['1990s', '2000s', '2010s', '2020s'];
  const wrap = $('#decadesList');
  wrap.innerHTML = decades.map(d => {
    const count = MOVIES.filter(m => m.decade === d).length;
    return `<button type="button" class="decade-card" data-decade="${d}">
      <p class="decade-card__year">${d}</p>
      <p class="decade-card__count">${count} film${count === 1 ? '' : 's'}</p>
    </button>`;
  }).join('');

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('.decade-card');
    if (!btn) return;
    filterState.decade = btn.dataset.decade;
    $('#filterDecade').value = btn.dataset.decade;
    renderGrid();
    $('#grid').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ============================================================
   TIMELINE (browse by year, 1990-2026)
   ============================================================ */
function renderTimeline() {
  const wrap = $('#yearTimeline');
  const yearsWithFilms = new Set(MOVIES.map(m => m.year));
  let html = '';
  for (let y = 1990; y <= 2026; y++) {
    const has = yearsWithFilms.has(y);
    html += `<button type="button" class="year-chip${has ? ' has-films' : ''}" data-year="${y}" ${has ? '' : 'disabled'}>${y}</button>`;
  }
  wrap.innerHTML = html;

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('.year-chip.has-films');
    if (!btn) return;
    const year = parseInt(btn.dataset.year, 10);
    const turningOn = filterState.year !== year;
    filterState.year = turningOn ? year : '';
    $$('.year-chip').forEach(y => y.classList.toggle('is-active', turningOn && y === btn));
    renderGrid();
    $('#grid').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ============================================================
   COLLECTIONS
   ============================================================ */
function renderCollections() {
  const wrap = $('#collectionsList');
  wrap.innerHTML = COLLECTIONS.map(c => {
    const count = MOVIES.filter(c.filter).length;
    return `<button type="button" class="collection-card" data-collection="${c.id}">
      <h3 class="collection-card__title">${escapeHtml(c.title)}</h3>
      <p class="collection-card__blurb">${escapeHtml(c.blurb)}</p>
      <p class="collection-card__count">${count} film${count === 1 ? '' : 's'}</p>
    </button>`;
  }).join('');

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('.collection-card');
    if (!btn) return;
    const collection = COLLECTIONS.find(c => c.id === btn.dataset.collection);
    if (!collection) return;
    // Apply as an ad-hoc filter override by re-rendering the grid manually
    const results = MOVIES.filter(collection.filter);
    const grid = $('#movieGrid');
    grid.innerHTML = results.map(movieCardHTML).join('');
    $('#resultCount').textContent = `${results.length} film${results.length === 1 ? '' : 's'} — ${collection.title}`;
    $('#emptyState').hidden = results.length !== 0;
    $$('#movieGrid .movie-card').forEach((card, i) => { card.style.animationDelay = `${Math.min(i, 12) * 0.05}s`; });
    $('#grid').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ============================================================
   EDITOR'S PICKS
   ============================================================ */
function renderEditorPicks() {
  const picks = [...MOVIES].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const notes = [
    'A masterclass in slow-burn chemistry that never overplays its hand.',
    'The rare rom-com that earns both its laughs and its ache.',
    'Endlessly rewatchable — the kind of comfort film you return to every year.',
    'Quietly one of the most influential entries in the genre\u2019s recent history.'
  ];
  $('#editorPicks').innerHTML = picks.map((m, i) => `
    <div class="pick" data-open-detail="${m.id}" style="cursor:pointer">
      <div class="pick__poster" data-poster-id="${m.id}" style="${posterStyle(m)}background-size:cover;"></div>
      <div>
        <h4 class="pick__title">${escapeHtml(m.title)}</h4>
        <p class="pick__year">${m.year}</p>
        <p class="pick__stars">${starRating(m.rating)}</p>
        <p class="pick__note">${escapeHtml(notes[i % notes.length])}</p>
      </div>
    </div>`).join('');
}

/* ============================================================
   ROTATING QUOTE
   ============================================================ */
function renderQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const textEl = $('#quoteText');
  const sourceEl = $('#quoteSource');
  textEl.style.opacity = '0';
  setTimeout(() => {
    textEl.textContent = `\u201c${q.quote}\u201d`;
    sourceEl.textContent = `${q.movie}, ${q.year}`;
    textEl.style.opacity = '1';
  }, 250);
}

function startQuoteRotation() {
  renderQuote();
  setInterval(renderQuote, 7000);
}

/* ============================================================
   MOVIE DETAIL VIEW
   ============================================================ */
function findMovie(id) { return MOVIES.find(m => m.id === id); }

function openDetail(id) {
  const movie = findMovie(id);
  if (!movie) return;

  const similar = MOVIES
    .filter(m => m.id !== movie.id && m.tropes.some(t => movie.tropes.includes(t)))
    .slice(0, 4);

  const fav = isFavorite(movie.id);

  $('#detailContent').innerHTML = `
    <div class="detail">
      <div>
        <div class="detail__poster" data-poster-id="${movie.id}" style="${posterStyle(movie)}"></div>
      </div>
      <div>
        <h2 class="detail__title" id="detailTitle">${escapeHtml(movie.title)}</h2>
        <div class="detail__meta-row">
          <span>${movie.year}</span><span>${movie.runtime} min</span><span>${escapeHtml(movie.country)}</span>
          <span class="featured__rating">★ ${movie.rating.toFixed(1)}</span>
        </div>

        <div class="detail__grid">
          <div><p class="detail__field-label">Director</p><p class="detail__field-value">${escapeHtml(movie.director)}</p></div>
          <div><p class="detail__field-label">Writer</p><p class="detail__field-value">${escapeHtml(movie.writer)}</p></div>
          <div><p class="detail__field-label">Cast</p><p class="detail__field-value">${escapeHtml(movie.cast.join(', '))}</p></div>
          <div><p class="detail__field-label">Genres</p><p class="detail__field-value">${escapeHtml(movie.genres.join(', '))}</p></div>
        </div>

        <div class="detail__section">
          <h4>Synopsis</h4>
          <p>${escapeHtml(movie.synopsis)}</p>
        </div>

        <div class="detail__section">
          <h4>Full Cast</h4>
          <div class="cast-grid" id="castGrid">
            ${movie.cast.map(name => `
              <div class="cast-chip" data-cast-name="${escapeHtml(name)}">
                <div class="cast-chip__photo cast-chip__photo--placeholder">${escapeHtml(name.split(' ').map(n => n[0]).join('').slice(0,2))}</div>
                <p class="cast-chip__name">${escapeHtml(name)}</p>
              </div>`).join('')}
          </div>
        </div>

        <div class="detail__section">
          <h4>Awards</h4>
          <p>${escapeHtml(movie.awards)}</p>
        </div>

        <div class="detail__section">
          <h4>Trivia</h4>
          <p>${escapeHtml(movie.trivia)}</p>
        </div>

        <div class="detail__section">
          <h4>Tropes</h4>
          <div class="detail__tags">${movie.tropes.map(t => `<span class="detail__tag">${escapeHtml(t)}</span>`).join('')}</div>
        </div>

        <div class="detail__section">
          <h4>Trailer</h4>
          <p class="detail__trailer-note">Trailer playback isn\u2019t hosted in this archive edition. Connect a video source in script.js (openDetail) to embed one here.</p>
        </div>

        ${similar.length ? `
        <div class="detail__section">
          <h4>Similar Films</h4>
          <div class="detail__similar">
            ${similar.map(s => `
              <div class="detail__similar-card" data-open-detail="${s.id}">
                <div class="detail__similar-poster" data-poster-id="${s.id}" style="${posterStyle(s)}background-size:cover;height:150px;"></div>
                <p class="detail__similar-title">${escapeHtml(s.title)}</p>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <div class="detail__actions">
          <button type="button" class="detail__fav-btn${fav ? ' is-fav' : ''}" data-fav-id="${movie.id}">
            <svg viewBox="0 0 24 24" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-7.5-4.6-10-9.2C.5 8 2.3 4.5 5.8 4c2-.3 3.9.7 6.2 3 2.3-2.3 4.2-3.3 6.2-3 3.5.5 5.3 4 3.8 7.8C19.5 16.4 12 21 12 21z"/></svg>
            ${fav ? 'Saved to Favorites' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </div>`;

  $('#detailView').hidden = false;
  document.body.style.overflow = 'hidden';

  // Swap in the real poster + real cast photos for this film, if available
  enrichAllPosters([movie]);
  getMovieMedia(movie).then(media => {
    if (!media.cast || !media.cast.length) return;
    const grid = $('#castGrid');
    if (!grid) return;
    grid.innerHTML = movie.cast.map(name => {
      const match = media.cast.find(c => c.name.toLowerCase() === name.toLowerCase())
        || media.cast.find(c => c.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]));
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
      return `
        <div class="cast-chip">
          ${match && match.photo
            ? `<div class="cast-chip__photo" style="background-image:url('${match.photo}')"></div>`
            : `<div class="cast-chip__photo cast-chip__photo--placeholder">${escapeHtml(initials)}</div>`}
          <p class="cast-chip__name">${escapeHtml(name)}</p>
        </div>`;
    }).join('');
  });
}

function closeDetail() {
  $('#detailView').hidden = true;
  document.body.style.overflow = '';
}

/* ============================================================
   FAVORITES VIEW
   ============================================================ */
function renderFavoritesView() {
  const ids = getFavorites();
  const movies = MOVIES.filter(m => ids.includes(m.id));
  $('#favoritesGrid').innerHTML = movies.map(movieCardHTML).join('');
  $('#favEmpty').hidden = movies.length !== 0;
}

function openFavorites() {
  renderFavoritesView();
  $('#favoritesView').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeFavorites() {
  $('#favoritesView').hidden = true;
  document.body.style.overflow = '';
}

/* ============================================================
   SEARCH
   ============================================================ */
function searchMovies(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOVIES.filter(m =>
    m.title.toLowerCase().includes(q) ||
    String(m.year).includes(q) ||
    m.director.toLowerCase().includes(q) ||
    m.cast.some(c => c.toLowerCase().includes(q)) ||
    m.genres.some(g => g.toLowerCase().includes(q)) ||
    m.tropes.some(t => t.toLowerCase().includes(q))
  );
}

function renderSearchResults(query) {
  const results = searchMovies(query);
  const wrap = $('#searchResults');
  if (!query.trim()) { wrap.innerHTML = ''; return; }
  if (!results.length) { wrap.innerHTML = `<p class="search-empty">No films match &ldquo;${escapeHtml(query)}&rdquo;.</p>`; return; }
  wrap.innerHTML = results.slice(0, 20).map(m => `
    <div class="search-result" data-open-detail="${m.id}">
      <div class="search-result__poster" data-poster-id="${m.id}" style="${posterStyle(m)}background-size:cover;"></div>
      <div>
        <p class="search-result__title">${escapeHtml(m.title)}</p>
        <p class="search-result__meta">${m.year} \u00b7 ${escapeHtml(m.director)} \u00b7 ${escapeHtml(m.genres.join(', '))}</p>
      </div>
    </div>`).join('');
}

function openSearch() {
  $('#searchOverlay').hidden = false;
  $('#searchToggle').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#searchInput').focus(), 50);
}
function closeSearch() {
  $('#searchOverlay').hidden = true;
  $('#searchToggle').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  $('#searchInput').value = '';
  $('#searchResults').innerHTML = '';
}

/* ============================================================
   GLOBAL CLICK DELEGATION (favorite hearts + open-detail links)
   ============================================================ */
function bindGlobalDelegation() {
  document.addEventListener('click', e => {
    const favBtn = e.target.closest('[data-fav-id]');
    if (favBtn) {
      e.stopPropagation();
      const nowFav = toggleFavorite(favBtn.dataset.favId);
      // Update all matching hearts on the page (grid + favorites view + detail)
      $$(`[data-fav-id="${favBtn.dataset.favId}"]`).forEach(btn => {
        btn.classList.toggle('is-fav', nowFav);
        if (btn.classList.contains('detail__fav-btn')) {
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="${nowFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-7.5-4.6-10-9.2C.5 8 2.3 4.5 5.8 4c2-.3 3.9.7 6.2 3 2.3-2.3 4.2-3.3 6.2-3 3.5.5 5.3 4 3.8 7.8C19.5 16.4 12 21 12 21z"/></svg> ${nowFav ? 'Saved to Favorites' : 'Add to Favorites'}`;
        }
      });
      if (!$('#favoritesView').hidden) renderFavoritesView();
      return;
    }

    const openBtn = e.target.closest('[data-open-detail]');
    if (openBtn) {
      closeSearch();
      closeFavorites();
      openDetail(openBtn.dataset.openDetail);
      return;
    }

    const card = e.target.closest('.movie-card');
    if (card && !e.target.closest('[data-fav-id]')) {
      openDetail(card.dataset.id);
    }
  });
}

/* ============================================================
   NAV: scroll state, mobile menu, active link
   ============================================================ */
function bindNav() {
  const nav = $('#siteNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  $('#menuToggle').addEventListener('click', () => {
    const links = $('#navLinks');
    const open = links.classList.toggle('is-open');
    $('#menuToggle').setAttribute('aria-expanded', String(open));
  });

  $$('.nav__link:not(.nav__link--favorites)').forEach(link => {
    link.addEventListener('click', () => {
      $$('.nav__link').forEach(l => l.classList.remove('is-active'));
      link.classList.add('is-active');
      $('#navLinks').classList.remove('is-open');
    });
  });

  $('#favoritesLink').addEventListener('click', e => {
    e.preventDefault();
    openFavorites();
  });
}

function bindSearch() {
  $('#searchToggle').addEventListener('click', openSearch);
  $('#searchClose').addEventListener('click', closeSearch);
  $('#searchInput').addEventListener('input', e => renderSearchResults(e.target.value));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); closeDetail(); closeFavorites(); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });
}

function bindModals() {
  $('#detailClose').addEventListener('click', closeDetail);
  $('#detailScrim').addEventListener('click', closeDetail);
  $('#favClose').addEventListener('click', closeFavorites);
  $('#favScrim').addEventListener('click', closeFavorites);
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  const targets = $$('main > section, .movie-card, .decade-card, .collection-card');
  targets.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  targets.forEach(el => observer.observe(el));
}

/* ============================================================
   PAGE LOADER
   ============================================================ */
function hideLoader() {
  window.addEventListener('load', () => {
    setTimeout(() => $('#pageLoader').classList.add('is-hidden'), 400);
  });
  // Fallback in case load already fired
  setTimeout(() => $('#pageLoader').classList.add('is-hidden'), 2500);
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  updateFavCount();
  renderHeroCollage();
  renderFeatured();
  renderTropes();
  populateFilterOptions();
  renderGrid();
  renderDecades();
  renderTimeline();
  renderCollections();
  renderEditorPicks();
  startQuoteRotation();

  bindFilterControls();
  bindTropeClicks();
  bindGlobalDelegation();
  bindNav();
  bindSearch();
  bindModals();

  initScrollReveal();
  enrichAllPosters(MOVIES);
});
