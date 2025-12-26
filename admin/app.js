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
window.addEventListener('DOMContentLoaded', async () => {
    await loadPasteList();
});

// Event Listeners
if (createPasteBtn) createPasteBtn.addEventListener('click', createPaste);
if (clearBtn) clearBtn.addEventListener('click', clearForm);
if (refreshBtn) refreshBtn.addEventListener('click', loadPasteList);
if (viewPublicBtn) viewPublicBtn.addEventListener('click', () => {
    window.open('/public/index.html', '_blank');
});
if (statsBtn) statsBtn.addEventListener('click', showStats);

if (closeModalBtn) closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
});
if (closeStatsBtn) closeStatsBtn.addEventListener('click', () => {
    statsModal.classList.remove('active');
});
if (copyUrlBtn) copyUrlBtn.addEventListener('click', copyUrl);

// Close modals on background click
if (successModal) {
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('active');
        }
    });
}

if (statsModal) {
    statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) {
            statsModal.classList.remove('active');
        }
    });
}

// Analytics modal
const analyticsModal = document.getElementById('analyticsModal');
const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');

if (closeAnalyticsBtn) {
    closeAnalyticsBtn.addEventListener('click', () => {
        analyticsModal.classList.remove('active');
    });
}

if (analyticsModal) {
    analyticsModal.addEventListener('click', (e) => {
        if (e.target === analyticsModal) {
            analyticsModal.classList.remove('active');
        }
    });
}

// Functions
async function createPaste() {
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

    try {
        const id = await storage.createPaste(content, config);

        // Show success modal
        const publicUrl = `${window.location.origin}/public/index.html?id=${id}`;
        pasteUrl.value = publicUrl;
        successModal.classList.add('active');

        // Add animation to the button
        createPasteBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            createPasteBtn.style.transform = '';
        }, 150);

        // Clear form and reload list
        clearForm();
        await loadPasteList();
    } catch (error) {
        alert('Failed to create paste. Error: ' + error.message);
        console.error(error);
    }
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

async function loadPasteList() {
    try {
        const pastes = await storage.getAllPastes();

        // Add rotation animation to refresh button
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshBtn.style.transform = '';
            }, 400);
        }

        if (!pastes || pastes.length === 0) {
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
            <div class="paste-item" onclick="viewPaste('${paste.id}')">
                <div class="paste-item-header">
                    <div class="paste-item-title">${escapeHtml(paste.title)}</div>
                    <div class="paste-item-id">${paste.id}</div>
                </div>
                <div class="paste-item-meta">
                    <span class="language-tag">${paste.language}</span>
                    <span>👁️ ${paste.views}</span>
                    <span>📅 ${formatDate(paste.createdAt)}</span>
                    ${paste.burnAfterRead ? '<span>🔥 Burn</span>' : ''}
                    ${!paste.isPublic ? '<span>🔒 Private</span>' : ''}
                </div>
                <div class="paste-item-actions">
                    <button onclick="event.stopPropagation(); showAnalytics('${paste.id}')" class="btn-small btn-glass" title="View Analytics">
                        📈 Analytics
                    </button>
                    <button onclick="event.stopPropagation(); deletePaste('${paste.id}')" class="btn-small btn-glass" title="Delete" style="color: #ff006e">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading paste list:', error);
        pasteListContainer.innerHTML = `<p style="padding: 20px; color: #ff006e">Error: ${error.message}</p>`;
    }
}

async function showAnalytics(pasteId) {
    try {
        const analytics = await storage.getAnalytics(pasteId);
        const pastes = await storage.getAllPastes();
        const paste = pastes.find(p => p.id === pasteId);

        if (!paste) return;

        const analyticsContent = document.getElementById('analyticsContent');

        // Calculate unique visitors
        const uniqueIPs = new Set(analytics.recentViews?.map(v => v.ip) || []).size;

        let html = `
            <div style="margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                <h4 style="font-size: 1.5rem; margin-bottom: 8px; color: var(--primary-start)">${escapeHtml(paste.title)}</h4>
                <div style="display: flex; gap: 16px; font-size: 0.875rem; color: var(--text-tertiary)">
                    <span>ID: <code>${pasteId}</code></span>
                    <span>Created: ${formatDateTime(paste.createdAt)}</span>
                </div>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 32px">
                <div class="stat-card">
                    <div class="stat-value">${analytics.totalViews}</div>
                    <div class="stat-label">Total Views</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analytics.uniqueIPs}</div>
                    <div class="stat-label">Unique Visitors</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analytics.uniqueCountries || 0}</div>
                    <div class="stat-label">Countries</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
                <div>
                    <h4 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--secondary-start)">📍 Top Cities</h4>
                    <div class="location-list">
                        ${(analytics.topLocations || []).map(loc => `
                            <div class="location-item" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <div style="display: flex; justify-content: space-between; align-items: center">
                                    <span style="font-weight: 500">${escapeHtml(loc.name)}</span>
                                    <span class="badge" style="background: rgba(0,245,255,0.1); color: var(--primary-start)">${loc.count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h4 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--secondary-start)">🏢 Top ISPs</h4>
                    <div class="location-list">
                        ${(analytics.topISPs || []).map(isp => `
                            <div class="location-item" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <div style="display: flex; justify-content: space-between; align-items: center">
                                    <span style="font-weight: 500; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;" title="${escapeHtml(isp.name)}">${escapeHtml(isp.name)}</span>
                                    <span class="badge" style="background: rgba(255,0,110,0.1); color: var(--secondary-start)">${isp.count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
                <div>
                    <h4 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--secondary-start)">🗺️ Top Regions</h4>
                    <div class="location-list">
                        ${(analytics.topRegions || []).map(reg => `
                            <div class="location-item" style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>${escapeHtml(reg.name)}</span>
                                    <span style="color: var(--text-tertiary)">${reg.count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h4 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--secondary-start)">💻 Browsers</h4>
                    <div class="location-list">
                        ${(analytics.topBrowsers || []).map(br => `
                            <div class="location-item" style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>${escapeHtml(br.name)}</span>
                                    <span style="color: var(--text-tertiary)">${br.count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <h4 style="font-size: 1.2rem; margin: 32px 0 16px 0; color: var(--primary-start); border-top: 1px solid var(--border); pt: 24px;">📋 Detailed View Log</h4>
            <div class="views-table" style="overflow-x: auto; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--border)">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.05)">
                            <th style="text-align: left; padding: 12px; color: var(--text-secondary)">Timestamp</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-secondary)">IP Address</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-secondary)">Location</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-secondary)">Zip</th>
                            <th style="text-align: left; padding: 12px; color: var(--text-secondary)">ISP / Network</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(analytics.recentViews || []).map(view => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)">
                                <td style="padding: 12px; white-space: nowrap">${formatDateTime(view.timestamp)}</td>
                                <td style="padding: 12px; font-family: var(--font-mono)">${view.ip}</td>
                                <td style="padding: 12px">
                                    ${getFlagEmoji(view.countryCode)} ${escapeHtml(view.city)}, ${escapeHtml(view.regionName)}<br>
                                    <small style="color: var(--text-tertiary)">${escapeHtml(view.country)} (${view.lat}, ${view.lon})</small>
                                </td>
                                <td style="padding: 12px">${view.zip || '-'}</td>
                                <td style="padding: 12px">
                                    <span style="color: var(--secondary-start)">${escapeHtml(view.isp)}</span><br>
                                    <small style="color: var(--text-tertiary)">${escapeHtml(view.org || view.asName || '')}</small>
                                </td>
                            </tr>
                        `).join('')}
                        ${(!analytics.recentViews || analytics.recentViews.length === 0) ? '<tr><td colspan="5" style="padding: 20px; text-align: center">No view data available yet.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;

        analyticsContent.innerHTML = html;
        analyticsModal.classList.add('active');
    } catch (error) {
        console.error('Error showing analytics:', error);
        alert('Failed to load analytics: ' + error.message);
    }
}

async function deletePaste(id) {
    if (!confirm('Are you sure you want to delete this paste?')) return;
    try {
        await storage.deletePaste(id);
        await loadPasteList();
    } catch (error) {
        alert('Failed to delete paste: ' + error.message);
    }
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
    return date.toLocaleString();
}

function viewPaste(id) {
    window.open(`/public/index.html?id=${id}`, '_blank');
}

async function showStats() {
    try {
        const stats = await storage.getStats();

        const languageCards = Object.entries(stats.languageBreakdown || {})
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
            <div class="grid col-3" style="width: 100%; margin-top: 16px">
                ${languageCards}
            </div>
        `;

        statsModal.classList.add('active');
    } catch (error) {
        console.error('Error showing stats:', error);
        alert('Failed to load stats: ' + error.message);
    }
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
        const activeElement = document.activeElement;
        if (activeElement === pasteContent || activeElement === pasteTitle) {
            e.preventDefault();
            createPaste();
        }
    }
});
