'use strict';

/* ============================================================
   THE ROM-COM ARCHIVE — TMDB Integration
   Fetches real posters + real cast photos from The Movie Database.
   Falls back silently to placeholder artwork if no key is set,
   the network is unavailable, or a film isn't found.
   ============================================================ */

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/';
const TMDB_POSTER_SIZE = 'w500';
const TMDB_PROFILE_SIZE = 'w185';
const TMDB_CACHE_PREFIX = 'romcomArchive.tmdb.';
const TMDB_CACHE_VERSION = 'v1';

function getStoredApiKey() {
  try {
    return localStorage.getItem('romcomArchive.tmdbKey') || null;
  } catch (e) {
    return null;
  }
}

function setStoredApiKey(key) {
  try {
    if (key) localStorage.setItem('romcomArchive.tmdbKey', key);
    else localStorage.removeItem('romcomArchive.tmdbKey');
  } catch (e) {
    /* ignore storage errors */
  }
}

function getApiKey() {
  const stored = getStoredApiKey();
  if (stored) return stored;
  if (typeof TMDB_API_KEY === 'string' && TMDB_API_KEY && !TMDB_API_KEY.startsWith('YOUR_')) return TMDB_API_KEY;
  return null;
}

function hasApiKey() {
  return Boolean(getApiKey());
}

function tmdbCacheKey(movieId) {
  return `${TMDB_CACHE_PREFIX}${TMDB_CACHE_VERSION}.${movieId}`;
}

function readCache(movieId) {
  try {
    const raw = localStorage.getItem(tmdbCacheKey(movieId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeCache(movieId, data) {
  try {
    localStorage.setItem(tmdbCacheKey(movieId), JSON.stringify(data));
  } catch (e) {
    /* storage full or unavailable — safe to ignore */
  }
}

const inFlight = new Map();

/**
 * Returns { poster: string|null, cast: [{name, character, photo}] }
 * for a given local movie object. Results are cached in localStorage
 * so each film is only requested from TMDB once per browser.
 */
async function getMovieMedia(movie) {
  const cached = readCache(movie.id);
  if (cached) return cached;

  if (!hasApiKey()) return { poster: null, cast: [] };

  if (inFlight.has(movie.id)) return inFlight.get(movie.id);

  const promise = (async () => {
    try {
      const apiKey = getApiKey();
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(movie.title)}&year=${movie.year}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`TMDB search failed: ${searchRes.status}`);
      const searchData = await searchRes.json();
      const match = (searchData.results && searchData.results[0]) || null;
      if (!match) {
        const empty = { poster: null, cast: [] };
        writeCache(movie.id, empty);
        return empty;
      }

      const creditsUrl = `https://api.themoviedb.org/3/movie/${match.id}/credits?api_key=${apiKey}`;
      const creditsRes = await fetch(creditsUrl);
      const creditsData = creditsRes.ok ? await creditsRes.json() : { cast: [] };

      const cast = (creditsData.cast || [])
        .slice(0, 10)
        .map(c => ({
          name: c.name,
          character: c.character || '',
          photo: c.profile_path ? `${TMDB_IMG_BASE}${TMDB_PROFILE_SIZE}${c.profile_path}` : null
        }));

      const result = {
        poster: match.poster_path ? `${TMDB_IMG_BASE}${TMDB_POSTER_SIZE}${match.poster_path}` : null,
        cast
      };
      writeCache(movie.id, result);
      return result;
    } catch (err) {
      console.warn('[TMDB] Could not load media for', movie.title, err);
      return { poster: null, cast: [] };
    } finally {
      inFlight.delete(movie.id);
    }
  })();

  inFlight.set(movie.id, promise);
  return promise;
}

/**
 * Kicks off a fetch for every movie in the catalogue and swaps in
 * real poster art wherever a matching [data-poster-id] element
 * exists on the page, across every section of the site at once.
 */
async function enrichAllPosters(movies) {
  if (!hasApiKey()) {
    showApiKeyNotice();
    return;
  }
  movies.forEach(async movie => {
    const media = await getMovieMedia(movie);
    if (!media.poster) return;
    document.querySelectorAll(`[data-poster-id="${movie.id}"]`).forEach(el => {
      el.style.backgroundImage = `url('${media.poster}')`;
      el.classList.add('has-real-art');
    });
  });
}

/**
 * Small dismissible banner shown only when no API key is configured,
 * pointing the developer to config.js.
 */
function showApiKeyNotice() {
  if (sessionStorage.getItem('romcomArchive.hideApiNotice')) return;
  const banner = document.createElement('div');
  banner.className = 'api-notice api-notice--interactive';
  banner.innerHTML = `
    <p>Posters and cast are currently using placeholder art. Paste your TMDB API key here to enable real images.</p>
    <div class="api-notice__controls">
      <input class="api-notice__input" placeholder="Enter TMDB API key" aria-label="TMDB API key">
      <button type="button" class="api-notice__save">Save</button>
      <button type="button" aria-label="Dismiss" class="api-notice__dismiss">&times;</button>
    </div>`;

  const input = banner.querySelector('.api-notice__input');
  const save = banner.querySelector('.api-notice__save');
  const dismiss = banner.querySelector('.api-notice__dismiss');

  // Prefill if user previously saved a key
  const existing = getStoredApiKey();
  if (existing) input.value = existing;

  save.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) return;
    setStoredApiKey(val);
    // Immediately kick off enrichment using the newly saved key
    if (typeof enrichAllPosters === 'function' && typeof MOVIES !== 'undefined') {
      enrichAllPosters(MOVIES);
    }
    banner.remove();
    sessionStorage.setItem('romcomArchive.hideApiNotice', '1');
  });

  dismiss.addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('romcomArchive.hideApiNotice', '1');
  });

  document.body.prepend(banner);
}
