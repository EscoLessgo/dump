// Admin Console Application
const storage = new PasteStorage();

// DOM Elements
const pasteTitle = document.getElementById('pasteTitle');
const pasteLanguage = document.getElementById('pasteLanguage');
const pasteExpiration = document.getElementById('pasteExpiration');
const pasteContent = document.getElementById('pasteContent');
const burnAfterRead = document.getElementById('burnAfterRead');
const isPublic = document.getElementById('isPublic');
const createPasteBtn = document.getElementById('createPasteBtn');
const clearBtn = document.getElementById('clearBtn');
const refreshBtn = document.getElementById('refreshBtn');
const viewPublicBtn = document.getElementById('viewPublicBtn');
const statsBtn = document.getElementById('statsBtn');
const pasteListContainer = document.getElementById('pasteListContainer');
const successModal = document.getElementById('successModal');
const statsModal = document.getElementById('statsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const pasteUrl = document.getElementById('pasteUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const statsContent = document.getElementById('statsContent');

// Initialize
loadPasteList();

// Event Listeners
createPasteBtn.addEventListener('click', createPaste);
clearBtn.addEventListener('click', clearForm);
refreshBtn.addEventListener('click', loadPasteList);
viewPublicBtn.addEventListener('click', () => {
    window.open('../public/index.html', '_blank');
});
statsBtn.addEventListener('click', showStats);
closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
});
closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.remove('active');
});
copyUrlBtn.addEventListener('click', copyUrl);

// Close modals on background click
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
    }
});

statsModal.addEventListener('click', (e) => {
    if (e.target === statsModal) {
        statsModal.classList.remove('active');
    }
});

// Analytics modal
const analyticsModal = document.getElementById('analyticsModal');
const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');

closeAnalyticsBtn.addEventListener('click', () => {
    analyticsModal.classList.remove('active');
});

analyticsModal.addEventListener('click', (e) => {
    if (e.target === analyticsModal) {
        analyticsModal.classList.remove('active');
    }
});

// Functions
function createPaste() {
    const content = pasteContent.value.trim();

    if (!content) {
        alert('Please enter some content!');
        return;
    }

    const config = {
        title: pasteTitle.value.trim() || 'Untitled Paste',
        language: pasteLanguage.value,
        isPublic: isPublic.checked,
        burnAfterRead: burnAfterRead.checked,
        expiresAt: calculateExpiration(pasteExpiration.value)
    };

    const id = storage.createPaste(content, config);

    // Show success modal
    const publicUrl = `${window.location.origin}/pastebin-dual/public/index.html?id=${id}`;
    pasteUrl.value = publicUrl;
    successModal.classList.add('active');

    // Add animation to the button
    createPasteBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        createPasteBtn.style.transform = '';
    }, 150);

    // Clear form and reload list
    clearForm();
    loadPasteList();
}

function calculateExpiration(expirationValue) {
    if (expirationValue === 'never') return null;

    const now = new Date();
    const expirationMap = {
        '10m': 10 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000,
        '1M': 30 * 24 * 60 * 60 * 1000
    };

    return new Date(now.getTime() + expirationMap[expirationValue]).toISOString();
}

function clearForm() {
    pasteTitle.value = '';
    pasteContent.value = '';
    pasteLanguage.value = 'plaintext';
    pasteExpiration.value = 'never';
    burnAfterRead.checked = false;
    isPublic.checked = true;
}

function loadPasteList() {
    const pastes = storage.getAllPastes();

    // Add rotation animation to refresh button
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshBtn.style.transform = '';
    }, 400);

    if (pastes.length === 0) {
        pasteListContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path d="M16 8L48 8C51.3137 8 54 10.6863 54 14V50C54 53.3137 51.3137 56 48 56H16C12.6863 56 10 53.3137 10 50V14C10 10.6863 12.6863 8 16 8Z" stroke="currentColor" stroke-width="3"/>
                    <path d="M20 24H44M20 32H44M20 40H36" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <p>No pastes yet. Create your first one!</p>
            </div>
        `;
        return;
    }

    pasteListContainer.innerHTML = pastes.map(paste => `
        <div class="paste-item">
            <div class="paste-item-header" onclick="viewPaste('${paste.id}')">
                <div class="paste-item-title">${escapeHtml(paste.title)}</div>
                <div class="paste-item-id">${paste.id}</div>
            </div>
            <div class="paste-item-meta" onclick="viewPaste('${paste.id}')">
                <span class="language-tag">${paste.language}</span>
                <span>👁️ ${paste.views}</span>
                <span>📅 ${formatDate(paste.createdAt)}</span>
                ${paste.burnAfterRead ? '<span>🔥 Burn</span>' : ''}
                ${!paste.isPublic ? '<span>🔒 Private</span>' : ''}
            </div>
            <div class="paste-item-actions">
                <button onclick="event.stopPropagation(); showAnalytics('${paste.id}')" class="btn-small btn-glass" title="View Analytics">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="margin-right: 4px">
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="7" cy="7" r="2" fill="currentColor"/>
                    </svg>
                    Analytics
                </button>
            </div>
        </div>
    `).join('');
}

function showAnalytics(pasteId) {
    const analytics = storage.getAnalytics(pasteId);
    const paste = storage.getAllPastes().find(p => p.id === pasteId);

    if (!paste) return;

    const analyticsModal = document.getElementById('analyticsModal');
    const analyticsContent = document.getElementById('analyticsContent');

    // Calculate unique visitors, countries, cities
    const uniqueIPs = new Set(analytics.views.map(v => v.ip)).size;
    const uniqueCountries = new Set(analytics.views.map(v => v.country)).size;
    const uniqueCities = new Set(analytics.views.map(v => v.city)).size;

    let html = `
        <div style="margin-bottom: 24px">
            <h4 style="font-size: 1.25rem; margin-bottom: 8px">${escapeHtml(paste.title)}</h4>
            <p style="color: var(--text-tertiary)">Paste ID: <code>${pasteId}</code></p>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 24px">
            <div class="stat-card">
                <div class="stat-value">${analytics.totalViews}</div>
                <div class="stat-label">Total Views</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${uniqueIPs}</div>
                <div class="stat-label">Unique IPs</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${uniqueCountries}</div>
                <div class="stat-label">Countries</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${uniqueCities}</div>
                <div class="stat-label">Cities</div>
            </div>
        </div>
    `;

    if (analytics.topLocations && analytics.topLocations.length > 0) {
        html += `
            <h4 style="font-size: 1.1rem; margin: 24px 0 16px 0; color: var(--text-secondary)">📍 Top Locations</h4>
            <div class="location-list">
                ${analytics.topLocations.map(loc => `
                    <div class="location-item">
                        <div class="location-flag">${getFlagEmoji(loc.countryCode)}</div>
                        <div class="location-info">
                            <div class="location-name">${escapeHtml(loc.city)}, ${escapeHtml(loc.region)}</div>
                            <div class="location-country">${escapeHtml(loc.country)}</div>
                        </div>
                        <div class="location-count">${loc.count} ${loc.count === 1 ? 'view' : 'views'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (analytics.views && analytics.views.length > 0) {
        html += `
            <h4 style="font-size: 1.1rem; margin: 24px 0 16px 0; color: var(--text-secondary)">📊 Recent Views</h4>
            <div class="views-table">
                <table style="width: 100%; border-collapse: collapse">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border)">
                            <th style="text-align: left; padding: 12px; color: var(--text-tertiary); font-size: 0.875rem">Time</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-tertiary); font-size: 0.875rem">Location</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-tertiary); font-size: 0.875rem">ISP</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-tertiary); font-size: 0.875rem">IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analytics.views.slice().reverse().slice(0, 20).map(view => `
                            <tr style="border-bottom: 1px solid var(--border)">
                                <td style="padding: 12px; font-size: 0.875rem">${formatDateTime(view.timestamp)}</td>
                                <td style="padding: 12px; font-size: 0.875rem">
                                    ${getFlagEmoji(view.countryCode)} ${escapeHtml(view.city)}, ${escapeHtml(view.region)}
                                </td>
                                <td style="padding: 12px; font-size: 0.875rem; color: var(--text-secondary)">${escapeHtml(view.isp)}</td>
                                <td style="padding: 12px; font-size: 0.875rem; font-family: var(--font-mono); color: var(--text-tertiary)">${view.ip}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `
            <div style="text-align: center; padding: 40px; color: var(--text-tertiary)">
                <p>No view analytics available yet. This paste hasn't been viewed.</p>
                <p style="margin-top: 8px; font-size: 0.875rem">Share the paste URL to start collecting location data!</p>
            </div>
        `;
    }

    analyticsContent.innerHTML = html;
    analyticsModal.classList.add('active');
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function viewPaste(id) {
    window.open(`../public/index.html?id=${id}`, '_blank');
}

function showStats() {
    const stats = storage.getStats();

    const languageCards = Object.entries(stats.languageBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang, count]) => `
            <div class="stat-card">
                <div class="stat-value">${count}</div>
                <div class="stat-label">${lang}</div>
            </div>
        `).join('');

    statsContent.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalPastes}</div>
            <div class="stat-label">Total Pastes</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.totalViews}</div>
            <div class="stat-label">Total Views</div>
        </div>
        ${languageCards}
    `;

    statsModal.classList.add('active');
}

function copyUrl() {
    pasteUrl.select();
    document.execCommand('copy');

    const originalText = copyUrlBtn.textContent;
    copyUrlBtn.textContent = 'Copied!';
    copyUrlBtn.style.background = 'linear-gradient(135deg, #00ff88, #00f5ff)';

    setTimeout(() => {
        copyUrlBtn.textContent = originalText;
        copyUrlBtn.style.background = '';
    }, 2000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to create paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        createPaste();
    }

    // Ctrl/Cmd + K to focus content
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        pasteContent.focus();
    }
});
