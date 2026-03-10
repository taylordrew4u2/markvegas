/* admin.js – Admin panel logic */

const ADMIN_PASSWORD = 'markvegas';
const SESSION_KEY = 'mv_admin_auth';

/* =========================================
   AUTH
   ========================================= */

const gateEl    = document.getElementById('gate');
const layoutEl  = document.getElementById('admin-layout');
const gateForm  = document.getElementById('gate-form');
const gateError = document.getElementById('gate-error');
const logoutBtn = document.getElementById('logout-btn');

function showAdmin() {
  gateEl.style.display = 'none';
  layoutEl.style.display = 'block';
  initAdmin();
}

function showGate() {
  layoutEl.style.display = 'none';
  gateEl.style.display = 'flex';
}

// Check session on load
if (sessionStorage.getItem(SESSION_KEY) === 'true') {
  showAdmin();
}

gateForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const pw = document.getElementById('gate-password').value;
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    gateError.style.display = 'none';
    showAdmin();
  } else {
    gateError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', function () {
  sessionStorage.removeItem(SESSION_KEY);
  showGate();
});

/* =========================================
   NAVIGATION
   ========================================= */

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const panel = this.dataset.panel;
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + panel).classList.add('active');
  });
});

/* =========================================
   TOAST NOTIFICATIONS
   ========================================= */

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* =========================================
   PROFILE
   ========================================= */

const profileForm      = document.getElementById('profile-form');
const profileStatus    = document.getElementById('profile-status');
const profileSaveBtn   = document.getElementById('profile-save-btn');

async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const data = await res.json();
    if (data.name)      document.getElementById('p-name').value    = data.name;
    if (data.contact)   document.getElementById('p-contact').value = data.contact;
    if (data.bio)       document.getElementById('p-bio').value     = data.bio;
    if (data.photo_url) document.getElementById('p-photo').value   = data.photo_url;
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

profileForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  profileSaveBtn.disabled = true;
  profileSaveBtn.textContent = 'Saving...';

  const body = {
    name:      document.getElementById('p-name').value.trim(),
    contact:   document.getElementById('p-contact').value.trim(),
    bio:       document.getElementById('p-bio').value.trim(),
    photo_url: document.getElementById('p-photo').value.trim(),
  };

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Save failed');
    showToast('Profile saved.', 'success');
  } catch (err) {
    console.error(err);
    showToast('Could not save profile.', 'error');
  } finally {
    profileSaveBtn.disabled = false;
    profileSaveBtn.textContent = 'Save Profile';
  }
});

/* =========================================
   PORTFOLIO
   ========================================= */

let portfolioItems = [];
let editingItemId  = null;

const portfolioList  = document.getElementById('portfolio-list');
const itemsCount     = document.getElementById('items-count');
const showAddBtn     = document.getElementById('show-add-btn');
const addItemForm    = document.getElementById('add-item-form');
const itemFormHead   = document.getElementById('item-form-heading');
const itemSaveBtn    = document.getElementById('item-save-btn');
const itemCancelBtn  = document.getElementById('item-cancel-btn');
const itemTypeInput  = document.getElementById('item-type');
const itemUrlInput   = document.getElementById('item-url');
const itemCaptInput  = document.getElementById('item-caption');

async function loadPortfolio() {
  portfolioList.innerHTML = '<p class="status-msg">Loading items...</p>';
  try {
    const res = await fetch('/api/portfolio');
    if (!res.ok) throw new Error('Failed to load');
    portfolioItems = await res.json();
    renderPortfolioList();
  } catch (err) {
    console.error(err);
    portfolioList.innerHTML = '<p class="status-msg">Could not load portfolio items.</p>';
  }
}

function renderPortfolioList() {
  portfolioList.innerHTML = '';
  itemsCount.textContent = portfolioItems.length + (portfolioItems.length === 1 ? ' item' : ' items');

  if (!portfolioItems.length) {
    portfolioList.innerHTML = '<p class="status-msg">No items yet. Add your first item above.</p>';
    return;
  }

  portfolioItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'portfolio-item-card';
    card.dataset.id = item.id;

    // Thumbnail
    if (item.type === 'image') {
      const img = document.createElement('img');
      img.className = 'portfolio-item-thumb';
      img.src = item.url;
      img.alt = item.caption || '';
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'portfolio-item-thumb-placeholder';
      ph.textContent = 'Video';
      card.appendChild(ph);
    }

    // Info
    const info = document.createElement('div');
    info.className = 'portfolio-item-info';
    const cap = document.createElement('div');
    cap.className = 'portfolio-item-caption';
    cap.textContent = item.caption || '(no caption)';
    const meta = document.createElement('div');
    meta.className = 'portfolio-item-meta';
    meta.textContent = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    info.appendChild(cap);
    info.appendChild(meta);
    card.appendChild(info);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'portfolio-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditForm(item));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger btn-sm';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteItem(item.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);

    portfolioList.appendChild(card);
  });
}

// Show the add-item form
showAddBtn.addEventListener('click', function () {
  editingItemId = null;
  itemFormHead.textContent = 'Add Item';
  itemSaveBtn.textContent = 'Add Item';
  itemTypeInput.value  = 'image';
  itemUrlInput.value   = '';
  itemCaptInput.value  = '';
  addItemForm.classList.add('open');
  itemUrlInput.focus();
  showAddBtn.disabled = true;
});

// Cancel
itemCancelBtn.addEventListener('click', function () {
  closeItemForm();
});

function closeItemForm() {
  addItemForm.classList.remove('open');
  editingItemId = null;
  showAddBtn.disabled = false;
}

// Open edit form
function openEditForm(item) {
  editingItemId = item.id;
  itemFormHead.textContent = 'Edit Item';
  itemSaveBtn.textContent = 'Save Changes';
  itemTypeInput.value  = item.type;
  itemUrlInput.value   = item.url;
  itemCaptInput.value  = item.caption || '';
  addItemForm.classList.add('open');
  showAddBtn.disabled = true;
  addItemForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Save item (add or edit)
itemSaveBtn.addEventListener('click', async function () {
  const url     = itemUrlInput.value.trim();
  const caption = itemCaptInput.value.trim();
  const type    = itemTypeInput.value;

  if (!url) {
    showToast('Please enter a URL.', 'error');
    itemUrlInput.focus();
    return;
  }

  itemSaveBtn.disabled = true;
  itemSaveBtn.textContent = 'Saving...';

  try {
    let res;
    if (editingItemId) {
      res = await fetch('/api/portfolio/' + editingItemId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url, caption }),
      });
    } else {
      res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, url, caption }),
      });
    }

    if (!res.ok) throw new Error('Save failed');
    showToast(editingItemId ? 'Item updated.' : 'Item added.', 'success');
    closeItemForm();
    await loadPortfolio();
  } catch (err) {
    console.error(err);
    showToast('Could not save item.', 'error');
  } finally {
    itemSaveBtn.disabled = false;
    itemSaveBtn.textContent = editingItemId ? 'Save Changes' : 'Add Item';
  }
});

// Delete item
async function deleteItem(id) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  try {
    const res = await fetch('/api/portfolio/' + id, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    showToast('Item deleted.', 'success');
    await loadPortfolio();
  } catch (err) {
    console.error(err);
    showToast('Could not delete item.', 'error');
  }
}

/* =========================================
   INIT
   ========================================= */

function initAdmin() {
  loadProfile();
  loadPortfolio();
}
