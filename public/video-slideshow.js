
const oceanVideo = "/public/uploads/rocky-shore-coast.mp4";

// Simple single-video background player
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('video-background-container');
    if (!container) return;

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.loop = true; // Seamless loop
    video.src = oceanVideo;

    // Style for full screen background
    Object.assign(video.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: '1'
    });

    container.appendChild(video);

    // Auto-play with error handling
    video.play().catch(e => console.log('Auto-play blocked:', e));
});
