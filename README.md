<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Rom-Com Archive — A Digital Home for Romantic Comedy Cinema</title>
<meta name="description" content="An editorial archive celebrating romantic comedy films from 1990 to 2026.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Playfair+Display:wght@500;600;700&family=Cinzel:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>

<div class="page-loader" id="pageLoader" aria-hidden="true">
  <span class="page-loader__mark">R</span>
</div>

<!-- ============ NAVIGATION ============ -->
<header class="nav" id="siteNav">
  <div class="nav__inner">
    <a href="#home" class="nav__logo">The Rom-Com Archive</a>

    <nav class="nav__links" id="navLinks">
      <a href="#home" class="nav__link is-active">Home</a>
      <a href="#grid" class="nav__link">Movies</a>
      <a href="#browse" class="nav__link">Browse</a>
      <a href="#decades" class="nav__link">Decades</a>
      <a href="#collections" class="nav__link">Collections</a>
      <a href="#about" class="nav__link">About</a>
      <a href="#" class="nav__link nav__link--favorites" id="favoritesLink">Favorites <span id="favCount" class="nav__count">0</span></a>
    </nav>

    <div class="nav__actions">
      <button class="nav__icon-btn" id="searchToggle" aria-label="Open search" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <button class="nav__icon-btn nav__menu-btn" id="menuToggle" aria-label="Open menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</header>

<!-- ============ SEARCH OVERLAY ============ -->
<div class="search-overlay" id="searchOverlay" hidden>
  <div class="search-overlay__inner">
    <input type="text" id="searchInput" class="search-overlay__input" placeholder="Search by title, actor, director, year, genre, or trope…" autocomplete="off">
    <button class="search-overlay__close" id="searchClose" aria-label="Close search">&times;</button>
    <div class="search-overlay__results" id="searchResults"></div>
  </div>
</div>

<main>

  <!-- ============ HERO ============ -->
  <section class="hero" id="home">
    <div class="hero__collage" id="heroCollage" aria-hidden="true"></div>
    <div class="hero__overlay"></div>
    <div class="hero__content">
      <p class="hero__eyebrow">A Digital Museum of Romantic Comedy — 1990&ndash;2026</p>
      <h1 class="hero__title">The Rom-Com<br>Archive</h1>
      <p class="hero__subtitle">Celebrating the greatest romantic comedies from 1990 to 2026.</p>
      <div class="hero__buttons">
        <a href="#grid" class="btn btn--gold">Explore Collection</a>
        <a href="#decades" class="btn btn--ghost">Browse by Decade</a>
      </div>
    </div>
    <div class="hero__scroll-cue" aria-hidden="true"><span></span></div>
  </section>

  <!-- ============ FEATURED MOVIE ============ -->
  <section class="featured" id="featured">
    <div class="section-label"><span>Featured Entry</span></div>
    <div class="featured__card" id="featuredCard"><!-- injected --></div>
  </section>

  <!-- ============ BROWSE: TROPES ============ -->
  <section class="tropes-section" id="browse">
    <div class="section-label"><span>Browse by Trope</span></div>
    <h2 class="section-title">Tell Us How They Fell in Love</h2>
    <div class="tropes" id="tropesList"><!-- injected --></div>
  </section>

  <!-- ============ MOVIE GRID + FILTERS ============ -->
  <section class="archive" id="grid">
    <div class="section-label"><span>The Full Archive</span></div>
    <div class="archive__head">
      <h2 class="section-title">Browse the Collection</h2>
      <p class="archive__count" id="resultCount"></p>
    </div>

    <div class="filters" id="filters">
      <select id="filterGenre" class="filters__select"><option value="">All Genres</option></select>
      <select id="filterDecade" class="filters__select"><option value="">All Decades</option></select>
      <select id="filterCountry" class="filters__select"><option value="">All Countries</option></select>
      <select id="filterRating" class="filters__select">
        <option value="">Any Rating</option>
        <option value="7">7.0 and above</option>
        <option value="6.5">6.5 and above</option>
        <option value="6">6.0 and above</option>
      </select>
      <select id="filterRuntime" class="filters__select">
        <option value="">Any Runtime</option>
        <option value="short">Under 100 min</option>
        <option value="mid">100&ndash;120 min</option>
        <option value="long">Over 120 min</option>
      </select>
      <select id="filterAwards" class="filters__select">
        <option value="">All Films</option>
        <option value="yes">Award Winners Only</option>
      </select>
      <button id="resetFilters" class="filters__reset">Reset Filters</button>
    </div>

    <div class="movie-grid" id="movieGrid"><!-- injected --></div>
    <p class="empty-state" id="emptyState" hidden>No films match these filters. Try widening your search.</p>
  </section>

  <!-- ============ BROWSE BY DECADE ============ -->
  <section class="decades-section" id="decades">
    <div class="section-label"><span>Browse by Decade</span></div>
    <h2 class="section-title">Four Decades of Romance</h2>
    <div class="decades" id="decadesList"><!-- injected --></div>
  </section>

  <!-- ============ BROWSE BY YEAR (TIMELINE) ============ -->
  <section class="timeline-section" id="timeline">
    <div class="section-label"><span>Browse by Year</span></div>
    <h2 class="section-title">1990 &ndash; 2026</h2>
    <div class="timeline" id="yearTimeline"><!-- injected --></div>
  </section>

  <!-- ============ COLLECTIONS ============ -->
  <section class="collections-section" id="collections">
    <div class="section-label"><span>Curated Collections</span></div>
    <h2 class="section-title">Editorial Collections</h2>
    <div class="collections" id="collectionsList"><!-- injected --></div>
  </section>

  <!-- ============ EDITOR'S PICKS + QUOTES ============ -->
  <section class="editorial">
    <div class="editorial__picks">
      <div class="section-label"><span>Editor&rsquo;s Picks</span></div>
      <h2 class="section-title">From the Archive Desk</h2>
      <div class="picks" id="editorPicks"><!-- injected --></div>
    </div>

    <aside class="editorial__quote" id="quoteBlock">
      <div class="section-label"><span>Famous Lines</span></div>
      <blockquote>
        <p id="quoteText">&ldquo;&rdquo;</p>
        <footer id="quoteSource"></footer>
      </blockquote>
    </aside>
  </section>

  <!-- ============ ABOUT ============ -->
  <section class="about" id="about">
    <div class="section-label"><span>About the Archive</span></div>
    <h2 class="section-title">Why This Archive Exists</h2>
    <p class="about__text">The Rom-Com Archive is a growing catalogue dedicated to a genre too often dismissed and too rarely studied with care. From the screwball optimism of the early 1990s to the algorithmic streaming era of today, romantic comedy has quietly chronicled how we hope, flirt, and forgive. This is a place to browse that history the way you'd browse a bound collection on a museum shelf &mdash; slowly, and with attention.</p>
  </section>

</main>

<footer class="site-footer">
  <p>The Rom-Com Archive &mdash; a digital archive of romantic comedy cinema, 1990&ndash;2026.</p>
  <p class="site-footer__attribution">Posters and cast photography courtesy of <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">The Movie Database (TMDB)</a>. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
</footer>

<!-- ============ MOVIE DETAIL VIEW ============ -->
<div class="detail-view" id="detailView" hidden>
  <div class="detail-view__scrim" id="detailScrim"></div>
  <div class="detail-view__panel" id="detailPanel" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
    <button class="detail-view__close" id="detailClose" aria-label="Close movie details">&times;</button>
    <div id="detailContent"><!-- injected --></div>
  </div>
</div>

<!-- ============ FAVORITES VIEW ============ -->
<div class="favorites-view" id="favoritesView" hidden>
  <div class="favorites-view__scrim" id="favScrim"></div>
  <div class="favorites-view__panel" role="dialog" aria-modal="true" aria-labelledby="favTitle">
    <button class="favorites-view__close" id="favClose" aria-label="Close favorites">&times;</button>
    <div class="section-label"><span>Your Archive</span></div>
    <h2 id="favTitle" class="section-title">Favorites</h2>
    <div class="movie-grid movie-grid--favorites" id="favoritesGrid"></div>
    <p class="empty-state" id="favEmpty" hidden>You haven&rsquo;t saved any films yet. Click the heart on any poster to begin your collection.</p>
  </div>
</div>

<script src="config.js"></script>
<script src="tmdb.js"></script>
<script src="data.js"></script>
<script src="script.js"></script>
</body>
</html>
