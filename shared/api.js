// API Client for PasteBin Pro
// Uses backend API instead of localStorage

class PasteAPI {
    constructor() {
        // Auto-detect API URL
        this.apiUrl = window.location.origin + '/api';
        console.log('API URL:', this.apiUrl);
    }

    // Create a new paste
    async createPaste(content, config) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    title: config.title || 'Untitled Paste',
                    language: config.language || 'plaintext',
                    expiresAt: config.expiresAt || null,
                    isPublic: config.isPublic !== false,
                    password: config.password || null,
                    burnAfterRead: config.burnAfterRead || false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const paste = await response.json();
            return paste.id;
        } catch (error) {
            console.error('Error creating paste:', error);
            throw error;
        }
    }

    // Get a paste by ID
    async getPaste(id, trackLocation = true) {
        try {
            const response = await fetch(
                `${this.apiUrl}/pastes/${id}?track=${trackLocation}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting paste:', error);
            throw error;
        }
    }

    // Get all pastes (admin only)
    async getAllPastes() {
        try {
            const response = await fetch(`${this.apiUrl}/pastes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting pastes:', error);
            throw error;
        }
    }

    // Delete a paste
    async deletePaste(id) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting paste:', error);
            throw error;
        }
    }

    // Get analytics for a paste
    async getAnalytics(pasteId) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/${pasteId}/analytics`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw error;
        }
    }

    // Get statistics
    async getStats() {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/stats/summary`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    // For backward compatibility with old storage.js interface
    async trackView(pasteId) {
        // This is now handled by the getPaste endpoint
        console.log('trackView called - handled by API');
    }
}

// Export for use in both admin and public interfaces
window.PasteAPI = PasteAPI;
// Keep backward compatibility
window.PasteStorage = PasteAPI;
