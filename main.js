document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('mapContainer');
    const mapWrapper = document.getElementById('mapWrapper');
    const boothMap = document.getElementById('boothMap');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetZoomBtn = document.getElementById('resetZoom');

    let scale = 1;
    const ZOOM_SPEED = 0.1;
    const MAX_SCALE = 3;
    const MIN_SCALE = 1;

    // Hover Zoom Logic
    mapContainer.addEventListener('mousemove', (e) => {
        if (scale > 1) {
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            mapWrapper.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            mapWrapper.style.transform = `scale(${scale})`;
        }
    });

    mapContainer.addEventListener('mouseenter', () => {
        if (scale === 1) {
            scale = 1.5; // Default zoom on hover
            updateTransform();
        }
    });

    mapContainer.addEventListener('mouseleave', () => {
        scale = 1;
        updateTransform();
    });

    // Button Controls
    zoomInBtn.addEventListener('click', () => {
        if (scale < MAX_SCALE) {
            scale += 0.5;
            updateTransform();
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (scale > MIN_SCALE) {
            scale -= 0.5;
            updateTransform();
        }
    });

    resetZoomBtn.addEventListener('click', () => {
        scale = 1;
        updateTransform();
    });

    function updateTransform() {
        mapWrapper.style.transform = `scale(${scale})`;
        if (scale === 1) {
            mapWrapper.style.transformOrigin = 'center';
        }
    }

    // Scroll zoom (optional but nice)
    mapContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
        scale = Math.min(Math.max(MIN_SCALE, scale + delta), MAX_SCALE);
        
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        mapWrapper.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        updateTransform();
    }, { passive: false });
});
