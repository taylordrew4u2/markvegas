/* Mark Vegas — public site
   Loads profile + portfolio from Turso-backed API and renders:
   - Work: mosaic grid of full-bleed tiles (images loop, videos autoplay)
   - About: photo + name + bio
   - Contact: one row per link / email
   Theme: data-theme on <html>. Unknown values fall back to "noir". */

const VALID_THEMES = new Set([
  "noir",
  "paper",
  "midnight",
  "bone",
  "ember",
  "steel",
]);

/* Legacy theme ids → closest new scheme */
const THEME_ALIASES = {
  default: "noir",
  dark: "noir",
  warm: "paper",
  cool: "midnight",
  rose: "paper",
};

/* Mosaic span pattern — drives varied tile sizes from a flat item list */
const SPAN_PATTERN = [
  { c: 3, r: 2 },
  { c: 2, r: 2 },
  { c: 1, r: 2 },
  { c: 2, r: 1 },
  { c: 2, r: 1 },
  { c: 2, r: 1 },
];

initNav();
initYearParity();

Promise.all([loadProfile(), loadPortfolio()]);

function initNav() {
  const buttons = document.querySelectorAll(".subnav button[data-view]");
  const views = document.querySelectorAll(".view");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;
      buttons.forEach((b) => b.classList.toggle("on", b === btn));
      views.forEach((v) =>
        v.classList.toggle("on", v.id === "view-" + target),
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function initYearParity() {
  /* Footer year already hard-coded as MMXXVI; noop hook for future use. */
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile");
    if (!res.ok) return;
    const data = await res.json();

    applyTheme(data.color_scheme);

    if (data.name) {
      document.title = data.name + " — Portfolio";
      document.getElementById("wordmark").textContent = data.name.toUpperCase();
      document.getElementById("about-name").textContent = data.name;
    }

    if (data.bio) {
      document.getElementById("about-bio").textContent = data.bio;
    }

    if (data.photo_url) {
      const placeholder = document.getElementById("about-photo");
      const img = document.createElement("img");
      img.className = "about-photo";
      img.src = data.photo_url;
      img.alt = data.name || "Portrait";
      img.loading = "lazy";
      placeholder.replaceWith(img);
    }

    renderContact(data.contact || "");
  } catch (err) {
    console.error("profile load failed:", err);
  }
}

function applyTheme(raw) {
  const key = (raw || "").toLowerCase().trim();
  const resolved = VALID_THEMES.has(key)
    ? key
    : THEME_ALIASES[key] || "noir";
  document.documentElement.setAttribute("data-theme", resolved);
}

function renderContact(raw) {
  const host = document.getElementById("contact-list");
  host.innerHTML = "";
  const items = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!items.length) {
    const row = document.createElement("div");
    row.className = "contact-row";
    row.innerHTML =
      '<span class="contact-kind">Email</span>' +
      '<span class="contact-val">Coming soon.</span>' +
      '<span class="contact-arrow"></span>';
    host.appendChild(row);
    return;
  }

  items.forEach((item) => host.appendChild(contactRow(item)));
}

function contactRow(item) {
  const kind = classifyContact(item);
  const row = document.createElement(kind.href ? "a" : "div");
  row.className = "contact-row";
  if (kind.href) {
    row.href = kind.href;
    if (kind.external) {
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    }
  }
  row.innerHTML =
    '<span class="contact-kind"></span>' +
    '<span class="contact-val"></span>' +
    '<span class="contact-arrow">' +
    (kind.external ? "↗" : "→") +
    "</span>";
  row.querySelector(".contact-kind").textContent = kind.label;
  row.querySelector(".contact-val").textContent = kind.display;
  return row;
}

function classifyContact(raw) {
  const item = raw.trim();
  if (/^https?:\/\//i.test(item)) {
    let host = item;
    try {
      host = new URL(item).hostname.replace(/^www\./, "");
    } catch (_) {}
    const label = platformLabel(host);
    return { label, display: host, href: item, external: true };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)) {
    return {
      label: "Email",
      display: item,
      href: "mailto:" + item,
      external: false,
    };
  }
  return { label: "Elsewhere", display: item, href: null, external: false };
}

function platformLabel(host) {
  const lower = host.toLowerCase();
  if (lower.includes("instagram")) return "Instagram";
  if (lower.includes("vimeo")) return "Vimeo";
  if (lower.includes("youtube") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("twitter") || lower === "x.com" || lower.endsWith(".x.com"))
    return "Twitter";
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower.includes("tiktok")) return "TikTok";
  if (lower.includes("github")) return "GitHub";
  if (lower.includes("behance")) return "Behance";
  if (lower.includes("dribbble")) return "Dribbble";
  return "Link";
}

async function loadPortfolio() {
  const grid = document.getElementById("work-grid");
  const loading = document.getElementById("work-loading");

  try {
    const res = await fetch("/api/portfolio");
    if (!res.ok) throw new Error("fetch failed");
    const items = await res.json();

    if (loading) loading.remove();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "status-msg";
      empty.textContent = "No work yet";
      grid.appendChild(empty);
      return;
    }

    const total = items.length;
    items.forEach((item, i) => {
      grid.appendChild(makeTile(item, i, total));
    });
  } catch (err) {
    console.error("portfolio load failed:", err);
    if (loading) loading.textContent = "Could not load work";
  }
}

function makeTile(item, index, total) {
  const span = SPAN_PATTERN[index % SPAN_PATTERN.length];
  const tile = document.createElement("article");
  tile.className = "tile";
  tile.style.setProperty("--span-c", span.c);
  tile.style.setProperty("--span-r", span.r);
  tile.tabIndex = 0;

  if (item.type === "video") {
    const v = document.createElement("video");
    v.className = "tile-media";
    v.src = item.url;
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    tile.appendChild(v);

    const badge = document.createElement("span");
    badge.className = "tile-badge";
    badge.textContent = "Motion";
    tile.appendChild(badge);
  } else {
    const img = document.createElement("img");
    img.className = "tile-media";
    img.src = item.url;
    img.alt = item.caption || "Untitled";
    img.loading = "lazy";
    img.decoding = "async";
    tile.appendChild(img);
  }

  const veil = document.createElement("div");
  veil.className = "tile-veil";

  const title = document.createElement("div");
  title.className = "tile-title";
  title.textContent = item.caption || "Untitled";

  const mono = document.createElement("div");
  mono.className = "tile-mono";
  mono.textContent =
    "No. " + pad2(index + 1) + " / " + pad2(total);

  veil.appendChild(title);
  veil.appendChild(mono);
  tile.appendChild(veil);

  if (item.url && item.type !== "video") {
    tile.addEventListener("click", () => {
      window.open(item.url, "_blank", "noopener");
    });
  }

  return tile;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
