// Shared storage layer for pastebin
// This uses localStorage to simulate a backend database

class PasteStorage {
    constructor() {
        this.storageKey = 'pastebin_data';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                pastes: {},
                nextId: 1
            }));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey));
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Create a new paste
    createPaste(content, config) {
        const data = this.getData();
        const id = this.generateId();

        const paste = {
            id,
            content,
            language: config.language || 'plaintext',
            title: config.title || 'Untitled Paste',
            expiresAt: config.expiresAt || null,
            createdAt: new Date().toISOString(),
            views: 0,
            isPublic: config.isPublic !== false,
            password: config.password || null,
            burnAfterRead: config.burnAfterRead || false
        };

        data.pastes[id] = paste;
        data.nextId++;
        this.saveData(data);

        return id;
    }

    // Get a paste by ID
    async getPaste(id, trackLocation = true) {
        const data = this.getData();
        const paste = data.pastes[id];

        if (!paste) return null;

        // Check if expired
        if (paste.expiresAt && new Date(paste.expiresAt) < new Date()) {
            this.deletePaste(id);
            return null;
        }

        // Handle burn after read BEFORE incrementing views
        if (paste.burnAfterRead) {
            const content = paste.content;
            this.deletePaste(id);
            return { ...paste, content, burned: true };
        }

        // Increment view count and save IMMEDIATELY to avoid race condition
        paste.views++;
        this.saveData(data);

        // Track location data AFTER saving (async operation won't overwrite)
        if (trackLocation) {
            await this.trackView(id);
        }

        return paste;
    }

    // Track view with detailed geolocation
    async trackView(pasteId) {
        try {
            const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query');
            const locationData = await response.json();

            if (locationData.status === 'success') {
                const data = this.getData();
                if (!data.pastes[pasteId]) return;

                // Initialize analytics if not exists
                if (!data.pastes[pasteId].analytics) {
                    data.pastes[pasteId].analytics = {
                        views: [],
                        locationSummary: {}
                    };
                }

                // Add view record
                data.pastes[pasteId].analytics.views.push({
                    timestamp: new Date().toISOString(),
                    ip: locationData.query,
                    country: locationData.country,
                    countryCode: locationData.countryCode,
                    region: locationData.regionName,
                    regionCode: locationData.region,
                    city: locationData.city,
                    zip: locationData.zip,
                    lat: locationData.lat,
                    lon: locationData.lon,
                    timezone: locationData.timezone,
                    isp: locationData.isp,
                    org: locationData.org,
                    asn: locationData.as
                });

                // Update location summary
                const locationKey = `${locationData.city}, ${locationData.regionName}, ${locationData.country}`;
                if (!data.pastes[pasteId].analytics.locationSummary[locationKey]) {
                    data.pastes[pasteId].analytics.locationSummary[locationKey] = {
                        count: 0,
                        city: locationData.city,
                        region: locationData.regionName,
                        country: locationData.country,
                        countryCode: locationData.countryCode,
                        lat: locationData.lat,
                        lon: locationData.lon
                    };
                }
                data.pastes[pasteId].analytics.locationSummary[locationKey].count++;

                this.saveData(data);
            }
        } catch (error) {
            console.warn('Failed to track location:', error);
            // Silently fail - don't block paste viewing if geolocation fails
        }
    }

    // Get analytics for a paste
    getAnalytics(pasteId) {
        const data = this.getData();
        const paste = data.pastes[pasteId];

        if (!paste || !paste.analytics) {
            return {
                totalViews: paste ? paste.views : 0,
                views: [],
                locationSummary: {}
            };
        }

        return {
            totalViews: paste.views,
            views: paste.analytics.views,
            locationSummary: paste.analytics.locationSummary,
            topLocations: Object.entries(paste.analytics.locationSummary)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10)
                .map(([location, data]) => ({
                    location,
                    ...data
                }))
        };
    }

    // Get all pastes (admin only)
    getAllPastes() {
        const data = this.getData();
        return Object.values(data.pastes).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    // Delete a paste
    deletePaste(id) {
        const data = this.getData();
        delete data.pastes[id];
        this.saveData(data);
    }

    // Update a paste
    updatePaste(id, updates) {
        const data = this.getData();
        if (data.pastes[id]) {
            data.pastes[id] = { ...data.pastes[id], ...updates };
            this.saveData(data);
            return true;
        }
        return false;
    }

    // Generate a unique ID
    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id;
        const data = this.getData();

        do {
            id = '';
            for (let i = 0; i < 8; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (data.pastes[id]);

        return id;
    }

    // Get statistics
    getStats() {
        const data = this.getData();
        const pastes = Object.values(data.pastes);

        return {
            totalPastes: pastes.length,
            totalViews: pastes.reduce((sum, p) => sum + p.views, 0),
            languageBreakdown: pastes.reduce((acc, p) => {
                acc[p.language] = (acc[p.language] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Export for use in both admin and public interfaces
window.PasteStorage = PasteStorage;
