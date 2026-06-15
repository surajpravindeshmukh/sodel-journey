// Optimized Journey Application
const JourneyApp = (() => {
    // State
    let journey = [];
    let current = 0;
    let currentGalleryImages = [];
    let currentGalleryIndex = 0;
    let isModalOpen = false;
    let isAnimating = false;
    let isGalleryAnimating = false;

    // Touch/mouse state
    let touchStart = { x: 0, y: 0 };
    let mouseStart = 0;
    let isMouseDown = false;
    let galleryTouchStart = 0;
    let isGalleryMouseDown = false;

    // Constants
    const SWIPE_THRESHOLD = 50;
    const MAX_VISIBLE_DOTS = 5;
    const MAX_CAPTION_WORDS = 10;
    const PRELOAD_COUNT = 2;
    const LOADING_TIMEOUT = 5000;

    // Memory words
    const MEMORY_WORDS = [
        "KB शेठ", "Samosa Scam", "Kokan Paglu", "Ratnagiri", "वज्रमूठ", "शेव भाजी",
        "पश्चिम महाराष्ट्र", "Tapola", "शिंदे साहेब", "Ganesh Naik", "Navi Mumbai Paglu",
        "Bisleri Pani Puri", "Nexon", "Abdul", "Villa", "मनपसंद", "शिळफाटा",
        "पंतनगर पोलिस स्टेशन", "इतना मारूंगा ना", "संतूर पप्पा", "DMart", "Lunch Group",
        "Birthdays on Terrace", "Old Monk", "Paan Flavour", "खम्मा घणी सा", "वेड्या मना",
        "उपवास", "साबुदाणा", "हापूस आंबा २२₹", "Chicken Thali", "4Y 3M", "मटण",
        "Coffee Group", "Snacks", "बैल", "साचा", "IRCTC paglu", "Shegaon Kachori",
        "Nashik", "Kurla", "Guna", "Triumph", "Yamaha", "अंधभक्त", "साप", "Dahi",
        "FZ - 35000₹", "Appsec - Ek Tool", "Muft Ka Chandan", "CNG Ninja", "Neele Neele Ambar Par"
    ];

    // DOM Elements cache
    const elements = {};

    // Utility functions
    const isMarathi = (text) => /[\u0900-\u097F]/.test(text);
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    // Initialize DOM references
    function cacheElements() {
        const ids = [
            'home', 'viewer', 'pageLoader', 'rotateOverlay', 'photoContainer',
            'year', 'title', 'caption', 'dots', 'galleryModal', 'galleryImage',
            'galleryCaption', 'galleryClose', 'galleryPrev', 'galleryNext',
            'captionModal', 'fullCaptionText', 'captionClose', 'backToHome'
        ];

        ids.forEach(id => {
            elements[id] = $(`#${id}`);
        });

        elements.memoryWords = $('.memory-words');
        elements.galleryBackdrop = $('.gallery-backdrop');
        elements.captionBackdrop = $('.caption-backdrop');
    }

    // Preload images with Promise
    function preloadImages(imageUrls) {
        if (!imageUrls.length) return Promise.resolve();

        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = img.onerror = () => resolve(src);
                img.src = src;
            });
        };

        return Promise.all(imageUrls.map(loadImage));
    }

    // Preload adjacent slides
    function preloadAdjacentSlides() {
        const indices = [];
        for (let i = 1; i <= PRELOAD_COUNT; i++) {
            if (current + i < journey.length) indices.push(current + i);
            if (current - i >= 0) indices.push(current - i);
        }

        const urls = indices.flatMap(idx => {
            const item = journey[idx];
            if (!item) return [];
            if (item.images) return item.images.map(img => img.image);
            if (item.image) return [item.image];
            return [];
        });

        preloadImages(urls);
    }

    // Load slide content without animation
    function loadSlideContent(index) {
        if (!journey[index]) return;

        const item = journey[index];
        elements.year.text(item.year || "");
        elements.title.text(item.title || "");

        const fullCaption = item.caption || "";
        const shortCaption = getShortCaption(fullCaption);
        const hasMore = fullCaption !== shortCaption;
        elements.caption.text(shortCaption).css("cursor", hasMore ? "pointer" : "default");

        renderMedia(item, index);
        updateDots();
        preloadAdjacentSlides();
    }

    // Render image(s) for current slide
    function renderMedia(item, index) {
        const container = elements.photoContainer;

        if (item.images?.length) {
            renderGalleryStack(item.images, index, container);
        } else if (item.image) {
            container.html(`<img id="storyImage" src="${item.image}" alt="${item.title}" loading="lazy">`);
        }
    }

    // Render multi-image gallery stack
    function renderGalleryStack(images, slideIndex, container) {
        const stackHtml = `
            <div class="gallery-stack loading" style="opacity:0.6; pointer-events:none;">
                ${images.map((img, idx) => `
                    <img src="${img.image}" 
                         class="gallery-stack-image gallery-stack-${idx + 1}" 
                         data-slide="${slideIndex}" 
                         data-image="${idx}"
                         style="display:none;"
                         loading="lazy">
                `).join('')}
            </div>
        `;

        container.html(stackHtml);

        let loadedCount = 0;
        const totalImages = images.length;
        const $stack = container.find('.gallery-stack');

        images.forEach((img, idx) => {
            const $img = $stack.find(`.gallery-stack-image[data-image="${idx}"]`);
            const tempImg = new Image();

            const onLoadComplete = () => {
                loadedCount++;

                $img.attr("src", img.image);

                // Show first image immediately
                if (idx === 0) {
                    $img.show();
                }

                // Show entire stack when all images are loaded
                if (loadedCount === totalImages) {
                    $stack.find(".gallery-stack-image").show();
                    $stack.css({ opacity: "", pointerEvents: "" }).removeClass("loading");
                }
            };

            tempImg.onload = tempImg.onerror = onLoadComplete;
            tempImg.src = img.image;
        });

        // Fallback timeout
        setTimeout(() => {
            if ($stack.hasClass("loading")) {
                $stack.css({ opacity: "", pointerEvents: "" }).removeClass("loading");
            }
        }, LOADING_TIMEOUT);
    }

    // Update navigation dots
    function updateDots() {
        const total = journey.length;
        let start = 0, end = total - 1;

        if (total > MAX_VISIBLE_DOTS) {
            const half = Math.floor(MAX_VISIBLE_DOTS / 2);
            start = Math.max(0, current - half);
            end = Math.min(total - 1, start + MAX_VISIBLE_DOTS - 1);
            start = Math.max(0, end - MAX_VISIBLE_DOTS + 1);
        }

        let html = '';
        if (start > 0) html += `<div class="dot dot-start-ellipsis" data-index="0">...</div>`;

        for (let i = start; i <= end; i++) {
            html += `<div class="dot ${i === current ? 'active' : ''}" data-index="${i}"></div>`;
        }

        if (end < total - 1) html += `<div class="dot dot-end-ellipsis" data-index="${total - 1}">...</div>`;

        elements.dots.html(html);

        // Attach click handlers
        elements.dots.find('.dot').on('click', function () {
            const idx = parseInt($(this).data('index'));
            if (!isNaN(idx) && idx !== current && idx >= 0 && idx < journey.length) {
                current = idx;
                loadSlideContent(current);
                scrollToActiveDot();
            }
        });

        scrollToActiveDot();
    }

    function scrollToActiveDot() {
        setTimeout(() => {
            const activeDot = elements.dots.find('.dot.active')[0];
            const container = elements.dots[0];
            if (activeDot && container) {
                activeDot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 50);
    }

    // Navigation functions
    function nextSlide() {
        if (isAnimating || current >= journey.length - 1) {
            if (current >= journey.length - 1) {
                elements.caption.css("transform", "scale(0.99)");
                setTimeout(() => elements.caption.css("transform", ""), 200);
            }
            return;
        }

        animateTransition(() => {
            current++;
            loadSlideContent(current);
        }, 'left');
    }

    function previousSlide() {
        if (isAnimating || current <= 0) return;

        animateTransition(() => {
            current--;
            loadSlideContent(current);
        }, 'right');
    }

    function animateTransition(updateContent, direction) {
        isAnimating = true;
        const $container = elements.photoContainer.children();
        const outX = direction === 'left' ? '-100%' : '100%';
        const inX = direction === 'left' ? '100%' : '-100%';

        $container.css({ transform: `translateX(${outX})`, opacity: 0 });

        setTimeout(() => {
            updateContent();
            const $newContent = elements.photoContainer.children();
            $newContent.css({ transform: `translateX(${inX})`, opacity: 0 });

            setTimeout(() => {
                $newContent.css({ transform: 'translateX(0)', opacity: 1 });
                setTimeout(() => { isAnimating = false; }, 300);
            }, 50);
        }, 250);
    }

    // Gallery functions
    function openGallery(images, index) {
        currentGalleryImages = images;
        currentGalleryIndex = index;
        updateGallery();
        elements.galleryModal.fadeIn(200);
    }

    function updateGallery() {
        const image = currentGalleryImages[currentGalleryIndex];
        elements.galleryImage.css({ transform: "translateX(0)", opacity: 1 });
        elements.galleryImage.attr("src", image.image);
        elements.galleryCaption.text(image.caption || "");
    }

    function closeGallery() {
        elements.galleryModal.fadeOut(200);
    }

    function nextGallery() {
        if (isGalleryAnimating || !currentGalleryImages.length) return;
        animateGalleryTransition(1);
    }

    function previousGallery() {
        if (isGalleryAnimating || !currentGalleryImages.length) return;
        animateGalleryTransition(-1);
    }

    function animateGalleryTransition(direction) {
        isGalleryAnimating = true;
        const $img = elements.galleryImage;
        const outX = direction === 1 ? '-30px' : '30px';
        const inX = direction === 1 ? '30px' : '-30px';

        $img.css({ transform: `translateX(${outX})`, opacity: 0 });

        setTimeout(() => {
            currentGalleryIndex = (currentGalleryIndex + direction + currentGalleryImages.length) % currentGalleryImages.length;
            const newImage = currentGalleryImages[currentGalleryIndex];

            $img.attr("src", newImage.image);
            $img.css({ transform: `translateX(${inX})`, opacity: 0 });
            elements.galleryCaption.text(newImage.caption || "");

            setTimeout(() => {
                $img.css({ transform: "translateX(0)", opacity: 1 });
                setTimeout(() => { isGalleryAnimating = false; }, 250);
            }, 50);
        }, 200);
    }

    // Caption functions
    function getShortCaption(text, maxWords = MAX_CAPTION_WORDS) {
        if (!text) return "";
        const words = text.trim().split(/\s+/);
        return words.length <= maxWords ? text : words.slice(0, maxWords).join(" ") + "...";
    }

    function openCaptionModal() {
        const fullCaption = journey[current]?.caption || "";
        elements.fullCaptionText.text(fullCaption);
        isModalOpen = true;
        elements.captionModal.fadeIn(200);
    }

    function closeCaptionModal() {
        isModalOpen = false;
        elements.captionModal.fadeOut(200);
    }

    // Memory words generation
    function generateMemoryWords() {
        elements.memoryWords.empty();

        const shuffled = [...MEMORY_WORDS].sort(() => 0.5 - Math.random());
        const COLS = 5, ROWS = 8;

        for (let row = 0, idx = 0; row < ROWS && idx < shuffled.length; row++) {
            for (let col = 0; col < COLS && idx < shuffled.length; col++) {
                const word = shuffled[idx++];
                const left = col * (100 / COLS) + Math.random() * 12 - (col === 0 ? Math.random() * 15 : 0);
                const top = row * (100 / ROWS) + Math.random() * 6;
                const fontSize = Math.floor(Math.random() * 24) + 12;
                const rotation = (Math.random() - 0.5) * 16;
                const opacity = Math.random() * 0.3 + 0.1;
                const animDuration = Math.floor(Math.random() * 15) + 16;
                const animationDelay = Math.random() * 14;

                const wordElement = $(`
                    <div class="memory-word" ${isMarathi(word) ? 'lang="mr"' : ''} style="
                        top:${top}%;
                        left:${left}%;
                        font-size:${fontSize}px;
                        transform:rotate(${rotation}deg);
                        animation-delay:${animationDelay}s;
                        animation-duration:${animDuration}s;
                        opacity:${opacity};
                        --rotate-end:${rotation + (Math.random() - 0.5) * 10}deg;
                    ">${word}</div>
                `);

                elements.memoryWords.append(wordElement);
            }
        }
    }

    // Home screen functions
    function buildHomeStack() {
        const stackImages = journey.slice(0, 3).reverse();
        const html = stackImages.map((item, idx) => `
            <img src="${item.image || item.images?.[0]?.image || `https://picsum.photos/800/1200?random=${idx}`}"
                 class="stack stack${idx + 1}"
                 alt="${item.title || 'memory'}"
                 loading="eager">
        `).join('');

        $('.photo-stack').html(html);
    }

    function startJourney() {
        if (!journey.length) return;
        current = 0;

        elements.home.fadeOut(300, () => {
            elements.viewer.css("display", "flex").hide().fadeIn(280);
            loadSlideContent(current);
        });
    }

    function goBackToHome() {
        current = 0;
        elements.viewer.fadeOut(300, () => {
            elements.home.fadeIn(300);
            generateMemoryWords();
            if (journey.length) buildHomeStack();
        });
    }

    // Orientation check
    function checkOrientation() {
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const isLandscape = window.innerWidth > window.innerHeight;
        elements.rotateOverlay.css("display", (isMobile && isLandscape) ? "flex" : "none");
    }

    // Event handlers
    function setupEventListeners() {
        // Start journey
        $("#startJourneyBtn, .photo-stack").on("click", startJourney);
        elements.backToHome.on("click", goBackToHome);

        // Gallery events
        $(document).on("click", ".gallery-stack-image", function () {
            const slideIndex = $(this).data("slide");
            const imageIndex = $(this).data("image");
            openGallery(journey[slideIndex].images, imageIndex);
        });

        elements.galleryClose.add(elements.galleryBackdrop).on("click", closeGallery);
        elements.galleryNext.on("click", nextGallery);
        elements.galleryPrev.on("click", previousGallery);

        // Caption events
        elements.caption.on("click", () => {
            if (journey[current]?.caption?.split(/\s+/).length > MAX_CAPTION_WORDS) {
                openCaptionModal();
            }
        });
        elements.captionClose.add(elements.captionBackdrop).on("click", closeCaptionModal);

        // Prevent modal event bubbling
        elements.captionModal.on("touchstart touchmove touchend mousedown mousemove mouseup", (e) => e.stopPropagation());

        // Touch swipe for gallery close
        setupSwipeToClose();

        // Touch swipe for navigation
        setupSwipeNavigation();

        // Mouse drag navigation
        setupMouseDrag();

        // Keyboard navigation
        setupKeyboardNavigation();

        // Orientation change
        $(window).on("resize orientationchange", debounce(checkOrientation, 100));
        checkOrientation();
    }

    function setupSwipeToClose() {
        let startY = 0;

        $(document).on("touchstart", "#galleryModal", (e) => {
            startY = e.changedTouches[0].screenY;
        }).on("touchend", "#galleryModal", (e) => {
            if (e.changedTouches[0].screenY - startY > 80) closeGallery();
        });

        $(document).on("mousedown", "#galleryModal", (e) => {
            isGalleryMouseDown = true;
            startY = e.clientY;
        }).on("mouseup", "#galleryModal", (e) => {
            if (isGalleryMouseDown && e.clientY - startY > 80) closeGallery();
            isGalleryMouseDown = false;
        });
    }

    function setupSwipeNavigation() {
        document.addEventListener("touchstart", (e) => {
            touchStart = { x: e.changedTouches[0].screenX, y: e.changedTouches[0].screenY };
        }, { passive: false });

        document.addEventListener("touchend", (e) => {
            const deltaX = e.changedTouches[0].screenX - touchStart.x;
            const deltaY = Math.abs(e.changedTouches[0].screenY - touchStart.y);

            if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > SWIPE_THRESHOLD && !isModalOpen) {
                if (elements.galleryModal.is(":visible")) {
                    deltaX < -45 ? nextGallery() : deltaX > 45 ? previousGallery() : null;
                } else if (elements.viewer.is(":visible") && !elements.captionModal.is(":visible")) {
                    deltaX < -45 ? nextSlide() : deltaX > 45 ? previousSlide() : null;
                }
            }
        });
    }

    function setupMouseDrag() {
        $("body").on("mousedown", (e) => {
            if (!isModalOpen && !elements.galleryModal.is(":visible") && elements.viewer.is(":visible")) {
                isMouseDown = true;
                mouseStart = e.clientX;
            }
        }).on("mouseup", (e) => {
            if (isMouseDown && !isModalOpen && elements.viewer.is(":visible") && !elements.galleryModal.is(":visible")) {
                const delta = e.clientX - mouseStart;
                if (Math.abs(delta) > 40) {
                    delta < -40 ? nextSlide() : delta > 40 ? previousSlide() : null;
                }
            }
            isMouseDown = false;
        });
    }

    function setupKeyboardNavigation() {
        $(document).on("keydown", (e) => {
            if (elements.captionModal.is(":visible")) {
                if (e.key === "Escape") closeCaptionModal();
                return;
            }

            if (elements.galleryModal.is(":visible")) {
                if (e.key === "Escape") closeGallery();
                if (e.key === "ArrowRight") nextGallery();
                if (e.key === "ArrowLeft") previousGallery();
                return;
            }

            if (elements.viewer.is(":visible") && !elements.home.is(":visible")) {
                if (e.key === "ArrowRight") nextSlide();
                if (e.key === "ArrowLeft") previousSlide();
                if (e.key === "Escape") goBackToHome();
            }
        });
    }

    // Initialize app
    function initializeApp() {
        if (!journey.length) {
            console.error("No journey data available");
            showError("No journey data found in journey.json");
            return;
        }

        console.log(`Initializing app with ${journey.length} journey items`);

        const imageUrls = journey.slice(0, 3).reverse()
            .flatMap(item => [item.image, ...(item.images?.map(img => img.image) || [])])
            .filter(Boolean);

        preloadImages(imageUrls).then(() => {
            elements.pageLoader.fadeOut(300);
            buildHomeStack();
            updateDots();
            loadSlideContent(0);
        });
    }

    function showError(message) {
        elements.home.html(`
            <div style="text-align: center; padding: 30px; max-width: 90%;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <div style="color: #ff6b6b; font-size: 18px; margin-bottom: 15px;">Error Loading Journey</div>
                <div style="color: #aaa; font-size: 14px; margin-bottom: 20px;">${message}</div>
                <div style="color: #888; font-size: 12px;">Please ensure journey.json exists in the 'js' folder with valid journey data.</div>
            </div>
        `);
        $(".start-text").hide();
    }

    // Public API
    return {
        init: function () {
            cacheElements();
            setupEventListeners();
            generateMemoryWords();

            $.getJSON("js/journey.json")
                .done((data) => {
                    if (data?.length) {
                        journey = data;
                        initializeApp();
                    } else {
                        showError("No journey data found. Please check journey.json file.");
                    }
                })
                .fail(() => showError("Unable to load journey.json. Please make sure the file exists at: js/journey.json"));
        }
    };
})();

// Start the application
$(document).ready(() => JourneyApp.init());