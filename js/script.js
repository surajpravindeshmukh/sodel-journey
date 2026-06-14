// Journey data array - will be populated ONLY from journey.json
let journey = [];
let current = 0;
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let isModalOpen = false;

// Memory words collection - Mix of English and Marathi words
const memoryWordsList = [
    "KB शेठ", "Samosa Scam", "Kokan", "वज्रमूठ", "शेव भाजी", "Appsec - Ek Tool",
    "पश्चिम महाराष्ट्र", "Tapola", "शिंदे साहेब", "Navi Mumbai", "Bisleri Pani Puri", "Nexon",
    "Abdul", "Villa", "मनपसंद", "शिळफाटा", "पंतनगर पोलिस स्टेशन", "इतना मारूंगा ना",
    "संतूर पप्पा", "DMart", "Lunch Group", "Birthdays",
    "खम्मा घणी सा", "वेड्या मना", "उपवास", "साबुदाणा", "हापूस आंबा २२ ₹",
    "4Y 3M", "मटण", "Coffee Group", "Snacks", "बैल",
    "Shegaon Kachori", "Nashik", "Kurla", "Diva",
    "Triumph", "Yamaha", "अंधभक्त", "साप", "Dahi"
];

/* -----------------------------
   LOAD JOURNEY DATA - ONLY FROM JSON
------------------------------*/

$(document).ready(function () {
    // Generate floating words on home screen
    generateMemoryWords();

    // Start button
    $("#startJourneyBtn, .photo-stack").on("click", function () {
        startJourney();
    });

    // Back to home
    $("#backToHome").on("click", function () {
        goBackToHome();
    });

    /* -----------------------------
       GALLERY EVENTS
    ------------------------------*/
    $(document).on("click", ".gallery-stack-image", function () {
        const slideIndex = $(this).data("slide");
        const imageIndex = $(this).data("image");
        openGallery(journey[slideIndex].images, imageIndex);
    });

    $("#galleryClose").on("click", function () {
        closeGallery();
    });

    $(".gallery-backdrop").on("click", function () {
        closeGallery();
    });

    $("#galleryNext").on("click", function () {
        nextGallery();
    });

    $("#galleryPrev").on("click", function () {
        previousGallery();
    });

    /* -----------------------------
       LOAD JOURNEY JSON
    ------------------------------*/
    $.getJSON("js/journey.json")
        .done(function (data) {
            if (data && data.length > 0) {
                journey = data;
                initializeApp();
            } else {
                console.error("journey.json is empty or invalid");
                showError("No journey data found. Please check journey.json file.");
            }
        })
        .fail(function (error) {
            console.error("Failed to load journey.json", error);
            showError("Unable to load journey.json. Please make sure the file exists at: js/journey.json");
        });

    $("#caption").on("click", function () {
        const fullCaption = journey[current]?.caption;
        if (!fullCaption) return;
        openCaptionModal();
    });

    $("#captionClose").on("click", function () {
        closeCaptionModal();
    });

    $(".caption-backdrop").on("click", function () {
        closeCaptionModal();
    });

    $("#captionModal").on(
        "touchstart touchmove touchend",
        function (e) {
            e.stopPropagation();
        }
    );

    $("#captionModal").on(
        "mousedown mousemove mouseup",
        function (e) {
            e.stopPropagation();
        }
    );
});

/* -----------------------------
   GO BACK TO HOME FUNCTION
------------------------------*/
function goBackToHome() {
    // Reset current slide index
    current = 0;

    // Fade out viewer and show home
    $("#viewer").fadeOut(300, function () {
        $("#home").fadeIn(300);
        // Regenerate floating words for fresh look
        generateMemoryWords();
        // Reset journey array to ensure clean state
        if (journey.length > 0) {
            buildHomeStack();
        }
    });
}

function showError(message) {
    $("#home").html(`
        <div style="text-align: center; padding: 30px; max-width: 90%;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <div style="color: #ff6b6b; font-size: 18px; margin-bottom: 15px;">Error Loading Journey</div>
            <div style="color: #aaa; font-size: 14px; margin-bottom: 20px;">${message}</div>
            <div style="color: #888; font-size: 12px;">Please ensure journey.json exists in the 'js' folder with valid journey data.</div>
        </div>
    `);
    $(".start-text").hide();
}

function preloadImages(imageUrls) {
    return Promise.all(
        imageUrls.map(src => {
            return new Promise(resolve => {
                const img = new Image();

                img.onload = resolve;
                img.onerror = resolve;

                img.src = src;
            });
        })
    );
}

function initializeApp() {
    if (!journey.length) {
        console.error("No journey data available");
        showError("No journey data found in journey.json");
        return;
    }

    console.log(`🎉 Initializing app with ${journey.length} journey items`);

    const imageUrls = journey
        .slice(0, 3)
        .reverse()
        .map(item => item.image || item.images?.[0]?.image)
        .filter(Boolean);

    preloadImages(imageUrls).then(() => {
        $("#pageLoader").fadeOut(300);

        buildHomeStack();
        createDots();
        loadSlide(0);
    });
}

/* -----------------------------
   FLOATING MEMORY WORDS
------------------------------*/
function generateMemoryWords() {
    const container = $(".memory-words");
    container.empty();

    const wordCount = Math.floor(Math.random() * 20) + 30;
    const shuffledWords = [...memoryWordsList].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledWords.slice(0, wordCount);

    selectedWords.forEach((word) => {
        const top = Math.random() * 90 + 5;
        const left = Math.random() * 85 + 7.5;
        const fontSize = Math.floor(Math.random() * 24) + 12;
        const rotation = (Math.random() - 0.5) * 16;
        const animationDelay = Math.random() * 14;
        const opacity = Math.random() * 0.3 + 0.1;
        const animDuration = Math.floor(Math.random() * 15) + 16;
        const isMarathi = /[\u0900-\u097F]/.test(word);

        const wordElement = $(`
            <div class="memory-word" ${isMarathi ? 'lang="mr"' : ''} style="
                top: ${top}%;
                left: ${left}%;
                font-size: ${fontSize}px;
                transform: rotate(${rotation}deg);
                animation-delay: ${animationDelay}s;
                animation-duration: ${animDuration}s;
                opacity: ${opacity};
                --rotate-end: ${rotation + (Math.random() - 0.5) * 10}deg;
            ">
                ${word}
            </div>
        `);

        container.append(wordElement);
    });
}

function buildHomeStack() {
    const stackImages = journey.slice(0, 3).reverse();
    let html = "";

    stackImages.forEach((item, index) => {
        const safeImage =
            item.image ||
            item.images?.[0]?.image ||
            `https://picsum.photos/800/1200?random=${index}`;

        html += `
            <img
                src="${safeImage}"
                class="stack stack${index + 1}"
                alt="${item.title || 'memory'}"
                loading="eager"
            >
        `;
    });

    $(".photo-stack").html(html);
}

/* -----------------------------
   CREATE DOTS - LIMITED TO 5 VISIBLE
------------------------------*/
function createDots() {
    const totalDots = journey.length;
    const maxVisible = 5;

    let startIndex = 0;
    let endIndex = totalDots - 1;

    if (totalDots > maxVisible) {
        let halfWindow = Math.floor(maxVisible / 2);
        startIndex = current - halfWindow;
        endIndex = current + halfWindow;

        if (startIndex < 0) {
            startIndex = 0;
            endIndex = maxVisible - 1;
        }
        if (endIndex >= totalDots) {
            endIndex = totalDots - 1;
            startIndex = totalDots - maxVisible;
        }
    }

    let html = '';

    if (startIndex > 0) {
        html += `<div class="dot dot-start-ellipsis" data-index="0">...</div>`;
    }

    for (let i = startIndex; i <= endIndex; i++) {
        const activeClass = i === current ? 'active' : '';
        html += `
            <div class="dot ${activeClass}" data-index="${i}"></div>
        `;
    }

    if (endIndex < totalDots - 1) {
        html += `<div class="dot dot-end-ellipsis" data-index="${totalDots - 1}">...</div>`;
    }

    $("#dots").html(html);

    $(".dot").off("click").on("click", function () {
        const idx = parseInt($(this).data("index"));
        if (!isNaN(idx) && idx !== current && idx >= 0 && idx < journey.length) {
            current = idx;
            loadSlide(current);
            scrollDotsToActive();
        }
    });

    scrollDotsToActive();
}

function scrollDotsToActive() {
    setTimeout(() => {
        const activeDot = $(".dot.active")[0];
        const dotsContainer = $("#dots")[0];
        if (activeDot && dotsContainer) {
            activeDot.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, 50);
}

/* -----------------------------
   LOAD SLIDE
------------------------------*/
function loadSlide(index) {
    if (!journey[index]) return;

    const item = journey[index];

    $("#year").text(item.year || "");
    $("#title").text(item.title || "");

    const fullCaption = item.caption || "";
    const shortCaption = getShortCaption(fullCaption, 10);

    $("#caption")
        .text(shortCaption)
        .css("cursor", fullCaption !== shortCaption ? "pointer" : "default");

    const container = $("#photoContainer");

    // MULTI IMAGE SLIDE
    if (item.images && item.images.length > 0) {
        let stackHtml = `<div class="gallery-stack">`;

        item.images.forEach((img, idx) => {
            stackHtml += `
                <img
                    src="${img.image}"
                    class="gallery-stack-image gallery-stack-${idx + 1}"
                    data-slide="${index}"
                    data-image="${idx}"
                >
            `;
        });

        stackHtml += `</div>`;
        container.html(stackHtml);
    }
    // SINGLE IMAGE SLIDE
    else {
        container.html(`
            <img
                id="storyImage"
                src="${item.image}"
                alt="${item.title}"
            >
        `);
    }

    createDots();
    preloadAdjacentImages();
}

/* -----------------------------
   START JOURNEY
------------------------------*/
function startJourney() {
    if (journey.length === 0) return;
    current = 0;

    $("#home").fadeOut(300, function () {
        $("#viewer").css("display", "flex").hide().fadeIn(280);
        loadSlide(current);
    });
}

/* -----------------------------
   NEXT / PREVIOUS
------------------------------*/
function nextSlide() {
    if (current < journey.length - 1) {
        current++;
        loadSlide(current);
    } else {
        $("#caption").css("transform", "scale(0.99)");
        setTimeout(() => $("#caption").css("transform", ""), 200);
    }
}

function previousSlide() {
    if (current > 0) {
        current--;
        loadSlide(current);
    }
}

/* -----------------------------
   PRELOAD IMAGES
------------------------------*/
function preloadAdjacentImages() {
    const preloadIndices = [current + 1, current + 2, current - 1];

    preloadIndices.forEach(idx => {
        if (!journey[idx]) return;

        if (journey[idx].image) {
            const img = new Image();
            img.src = journey[idx].image;
        }

        if (journey[idx].images) {
            journey[idx].images.forEach(imageObj => {
                const img = new Image();
                img.src = imageObj.image;
            });
        }
    });
}

/* -----------------------------
   TOUCH SWIPE
------------------------------*/
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 50;

document.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

document.addEventListener("touchend", function (e) {
    touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const deltaY = Math.abs(touchEndY - touchStartY);
    const deltaX = Math.abs(touchEndX - touchStartX);

    if (deltaX > deltaY && deltaX > SWIPE_THRESHOLD) {
        handleSwipe();
    }
});

function handleSwipe() {
    if (isModalOpen) {
        return;
    }

    if ($("#captionModal").is(":visible")) {
        return;
    }

    if ($("#galleryModal").is(":visible")) {
        const distance = touchEndX - touchStartX;
        if (distance < -45) {
            nextGallery();
        }
        if (distance > 45) {
            previousGallery();
        }
        return;
    }

    if ($("#viewer").is(":visible")) {
        const distance = touchEndX - touchStartX;
        if (distance < -45) {
            nextSlide();
        }
        if (distance > 45) {
            previousSlide();
        }
    }
}

/* -----------------------------
   MOUSE DRAG (Desktop)
------------------------------*/
let mouseStartX = 0;
let isMouseDown = false;

$("body").on("mousedown", function (e) {
    isMouseDown = true;
    mouseStartX = e.clientX;
});

$("body").on("mouseup", function (e) {
    if (isModalOpen) {
        return;
    }

    if (!isMouseDown) return;
    isMouseDown = false;
    const delta = e.clientX - mouseStartX;

    if (Math.abs(delta) < 40) return;

    if ($("#home").is(":visible")) {
        return;
    }

    if ($("#galleryModal").is(":visible")) {
        return;
    }

    if ($("#viewer").is(":visible")) {
        if (delta < -40) {
            nextSlide();
        }
        if (delta > 40) {
            previousSlide();
        }
    }
});

/* -----------------------------
   KEYBOARD SUPPORT
------------------------------*/
$(document).on("keydown", function (e) {
    if ($("#captionModal").is(":visible")) {
        if (e.key === "Escape") {
            closeCaptionModal();
        }
        return;
    }

    // GALLERY MODE
    if ($("#galleryModal").is(":visible")) {
        if (e.key === "Escape") {
            closeGallery();
        }
        if (e.key === "ArrowRight") {
            nextGallery();
        }
        if (e.key === "ArrowLeft") {
            previousGallery();
        }
        return;
    }

    // HOME SCREEN
    if ($("#home").is(":visible")) {
        return;
    }

    // VIEWER SCREEN
    if ($("#viewer").is(":visible")) {
        if (e.key === "ArrowRight") {
            nextSlide();
        }
        if (e.key === "ArrowLeft") {
            previousSlide();
        }
        if (e.key === "Escape") {
            goBackToHome();
        }
    }
});

function openGallery(images, index) {
    currentGalleryImages = images;
    currentGalleryIndex = index;
    updateGallery();
    $("#galleryModal").fadeIn(200);
}

function updateGallery() {
    const image = currentGalleryImages[currentGalleryIndex];
    $("#galleryImage").attr("src", image.image);
    $("#galleryCaption").text(image.caption || "");
}

function closeGallery() {
    $("#galleryModal").fadeOut(200);
}

function nextGallery() {
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateGallery();
}

function previousGallery() {
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateGallery();
}

function getShortCaption(text, maxWords = 50) {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) {
        return text;
    }
    return words.slice(0, maxWords).join(" ") + "...";
}

function openCaptionModal() {
    $("#fullCaptionText").text($("#caption").text());
    $("#captionModal").fadeIn(200);
}

function closeCaptionModal() {
    $("#captionModal").fadeOut(200);
}

function openCaptionModal() {
    const fullCaption = journey[current]?.caption || "";
    $("#fullCaptionText").text(fullCaption);
    isModalOpen = true;
    $("#captionModal").fadeIn(200);
}

function closeCaptionModal() {
    isModalOpen = false;
    $("#captionModal").fadeOut(200);
}