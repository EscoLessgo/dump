// API Client for PasteBin Pro
// Uses backend API instead of localStorage

class PasteAPI {
    constructor() {
        this.apiUrl = window.location.origin + '/api';
    }

    async createPaste(content, config) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    content,
                    title: config.title || 'Untitled Paste',
                    language: config.language || 'plaintext',
                    expiresAt: config.expiresAt || null,
                    isPublic: config.isPublic !== false,
                    burnAfterRead: config.burnAfterRead || false,
                    folderId: config.folderId || null
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `HTTP error! status: ${response.status}`);
            }

            const paste = await response.json();
            return paste.id;
        } catch (error) {
            console.error('Error creating paste:', error);
            throw error;
        }
    }

    async getPaste(id, trackLocation = true) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/${id}?track=${trackLocation}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            return await response.json();
        } catch (error) {
            console.error('Error getting paste:', error);
            throw error;
        }
    }

    async getAllPastes() {
        try {
            const response = await fetch(`${this.apiUrl}/pastes`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error getting pastes:', error);
            throw error;
        }
    }

    async deletePaste(id) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error deleting paste:', error);
            throw error;
        }
    }

    async getAnalytics(pasteId) {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/${pasteId}/analytics`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const response = await fetch(`${this.apiUrl}/pastes/stats/summary`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    async trackView(pasteId) {
        console.log('trackView handled by API');
    }

    // FOLDER METHODS
    async getAllFolders() {
        try {
            const response = await fetch(`${this.apiUrl}/folders`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch folders');
            return await response.json();
        } catch (error) {
            console.error('Error getting folders:', error);
            throw error;
        }
    }

    async getFolder(id) {
        try {
            const response = await fetch(`${this.apiUrl}/folders/${id}`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch folder');
            return await response.json();
        } catch (error) {
            console.error('Error getting folder:', error);
            throw error;
        }
    }

    async createFolder(name) {
        try {
            const response = await fetch(`${this.apiUrl}/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create folder');
            return await response.json();
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    async deleteFolder(id) {
        try {
            const response = await fetch(`${this.apiUrl}/folders/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to delete folder');
            return await response.json();
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    }

    // IMAGE METHODS
    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.apiUrl}/images/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to upload image');
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
}

window.PasteAPI = PasteAPI;
window.PasteStorage = PasteAPI;
