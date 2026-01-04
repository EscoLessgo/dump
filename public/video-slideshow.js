
const videoPlaylist = [
    "/public/uploads/rocky-shore-coast.mp4",
];

class VideoSlideshow {
    constructor(playlist) {
        this.playlist = playlist;
        this.currentIndex = 0;
        this.container = document.getElementById('video-background-container');
        this.currentVideo = null;
        this.nextVideo = null;
        this.init();
    }

    init() {
        if (!this.container || this.playlist.length === 0) return;
        this.playVideo(this.playlist[0]);
    }

    createVideoElement(src) {
        const video = document.createElement('video');
        video.src = src;
        video.autoplay = true;
        video.muted = true;
        video.loop = true; // Loop single video if only 1, or playlist logic
        video.playsInline = true;
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.opacity = '0';
        video.style.transition = 'opacity 1.5s ease-in-out';
        video.style.zIndex = '-1';
        return video;
    }

    playVideo(src) {
        const video = this.createVideoElement(src);
        this.container.appendChild(video);

        // Wait for load
        video.addEventListener('loadeddata', () => {
            video.style.opacity = '0.6'; // Target opacity
            video.play().catch(e => console.log("Autoplay blocked", e));

            if (this.currentVideo) {
                this.currentVideo.style.opacity = '0';
                setTimeout(() => {
                    if (this.currentVideo && this.currentVideo.parentNode) {
                        this.currentVideo.parentNode.removeChild(this.currentVideo);
                    }
                    this.currentVideo = video;
                }, 1500);
            } else {
                this.currentVideo = video;
            }
        });

        // Loop Logic
        video.addEventListener('ended', () => {
            this.next();
        });
    }

    next() {
        if (this.playlist.length <= 1) return; // Loop handled by video.loop attribute
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.playVideo(this.playlist[this.currentIndex]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VideoSlideshow(videoPlaylist);
});
