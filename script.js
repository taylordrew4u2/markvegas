/* script.js – Landing page logic */

(async function () {
  await Promise.all([loadProfile(), loadPortfolio()]);
})();

async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const data = await res.json();

    // Name
    const nameEl = document.getElementById('hero-name');
    if (data.name) nameEl.textContent = data.name;

    // Bio
    const bioEl = document.getElementById('hero-bio');
    if (data.bio) bioEl.textContent = data.bio;

    // Contact chips
    const contactEl = document.getElementById('hero-contact');
    if (data.contact) {
      // Split on newlines or commas to support multiple contact items
      const items = data.contact
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);
      items.forEach(item => {
        const a = document.createElement('a');
        a.className = 'contact-chip';
        // If it looks like a URL, linkify it
        if (/^https?:\/\//i.test(item)) {
          a.href = item;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          // Display just the hostname
          try {
            a.textContent = new URL(item).hostname.replace(/^www\./, '');
          } catch (_) {
            a.textContent = item;
          }
        } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)) {
          a.href = 'mailto:' + item;
          a.textContent = item;
        } else {
          a.textContent = item;
        }
        contactEl.appendChild(a);
      });
    }

    // Photo
    if (data.photo_url) {
      const placeholder = document.getElementById('hero-photo-placeholder');
      const img = document.createElement('img');
      img.className = 'hero-photo';
      img.src = data.photo_url;
      img.alt = data.name || 'Profile photo';
      placeholder.replaceWith(img);
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

async function loadPortfolio() {
  const grid = document.getElementById('bento-grid');
  const loading = document.getElementById('loading-state');

  try {
    const res = await fetch('/api/portfolio');
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    const items = await res.json();

    // Remove loading indicator
    loading.remove();

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const p = document.createElement('p');
      p.textContent = 'No portfolio items yet.';
      empty.appendChild(p);
      grid.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'bento-card';

      if (item.type === 'video') {
        const video = document.createElement('video');
        video.className = 'bento-media';
        video.src = item.url;
        video.controls = true;
        video.preload = 'metadata';
        card.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.className = 'bento-media';
        img.src = item.url;
        img.alt = item.caption || '';
        img.loading = 'lazy';
        card.appendChild(img);
      }

      if (item.caption) {
        const cap = document.createElement('p');
        cap.className = 'bento-caption';
        cap.textContent = item.caption;
        card.appendChild(cap);
      }

      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading portfolio:', err);
    if (loading) {
      loading.textContent = 'Could not load portfolio items.';
    }
  }
}
