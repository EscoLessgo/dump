
const videoPlaylist = [
    "/public/uploads/rocky-shore-coast.mp4",
    "/public/uploads/detail-bg.mp4",
];

class VideoSlideshow {
    constructor(containerId, videos) {
        this.container = document.getElementById(containerId);
        this.videos = videos;
        this.currentIndex = 0;
        this.activePlayer = 0; // 0 or 1

        if (!this.container) {
            console.error("Video container not found");
            return;
        }

        // Create two video elements for crossfading
        this.players = [
            this.createVideoElement(),
            this.createVideoElement()
        ];

        // Append to container
        this.players.forEach(p => this.container.appendChild(p));

        // Start the first video
        this.playVideo(0);
    }

    createVideoElement() {
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        // video.loop = false; // We handle looping manually via the slideshow logic

        // Style for full screen background
        Object.assign(video.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: '0', // Start hidden
            transition: 'opacity 1.5s ease-in-out' // Smooth crossfade
        });

        // Listen for end of video to trigger next
        video.addEventListener('ended', () => {
            this.next();
        });

        return video;
    }

    playVideo(index) {
        const video = this.players[this.activePlayer];
        video.src = this.videos[index];

        // Ensure ready to play
        video.onloadeddata = () => {
            video.play().then(() => {
                video.style.opacity = '1'; // Target opacity (full visibility)
                // Hide the other player
                const otherPlayer = this.players[this.activePlayer === 0 ? 1 : 0];
                otherPlayer.style.opacity = '0';

                // After transition, clear the old src to save resources? 
                // Maybe not strictly necessary for simple loops but good practice.
                setTimeout(() => {
                    otherPlayer.pause();
                    otherPlayer.currentTime = 0;
                }, 1500); // match transition duration
            }).catch(e => console.error("Auto-play failed:", e));
        };
    }

    next() {
        // Prepare next index
        this.currentIndex = (this.currentIndex + 1) % this.videos.length;

        // Switch active player
        this.activePlayer = this.activePlayer === 0 ? 1 : 0;

        this.playVideo(this.currentIndex);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we have a container
    if (document.getElementById('video-background-container')) {
        new VideoSlideshow('video-background-container', videoPlaylist);
    }
});
