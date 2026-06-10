// Journey data array - will be populated ONLY from journey.json
let journey = [];
let current = 0;

// Memory words collection - Mix of English and Marathi words
const memoryWordsList = ["भावा", "KB शेठ", "Abdul", "Samosa", "Kokan", "पश्चिम महाराष्ट्र", "Tapola",
    "शिंदे साहेब", "Villa", "Navi Mumbai", "मनपसंद",
    "शिळफाटा", "संतूर पप्पा", "DMart", "वज्रमुठ",
    "मटण", "Lunch Group", "Coffee Group", "Snacks", "हिशोब", "Biryani", "Shegaon", "Nashik",
    "खम्मा घणी सा", "Nexon", "Triumph", "FZ", "Marathi", "Bisleri Pani Puri", "Plans", "Chai",
    "friendships", "Teamwork", "Deadlines", "Celebrations", "Growth",
    "Support", "Releases", "Retrospectives", "Arguments", "Knowledge Sharing", "पंतनगर पोलिस स्टेशन",
    "Kurla", "Diva", "Appsec Tool", "Juice", "Temple", "Birthdays", "शेव भाजी", "Vidarbha"
];

/* -----------------------------
   LOAD JOURNEY DATA - ONLY FROM JSON
------------------------------*/

$(document).ready(function () {
    // Generate floating words on home screen
    generateMemoryWords();

    // Back to home button functionality
    $("#backToHome").on("click", function () {
        goBackToHome();
    });

    // Load journey data from JSON
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

function initializeApp() {
    if (!journey.length) {
        console.error("No journey data available");
        showError("No journey data found in journey.json");
        return;
    }
    console.log(`🎉 Initializing app with ${journey.length} journey items`);
    buildHomeStack();
    createDots();
    loadSlide(0);
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

/* -----------------------------
   HOME SCREEN STACK
------------------------------*/

function buildHomeStack() {
    const stackImages = journey.slice(0, 3);
    let html = "";

    stackImages.forEach((item, index) => {
        const safeImage = item.image || "https://picsum.photos/800/1200?random=" + index;
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

    const $img = $("#storyImage");
    $img.css("opacity", "0.5");
    setTimeout(() => {
        $img.attr("src", item.image);
        $img.on("load", function () {
            $img.css("opacity", "1");
        });
    }, 50);

    $("#year").text(item.year || "");
    $("#title").text(item.title || "");
    $("#caption").text(item.caption || "");

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
        if (journey[idx] && journey[idx].image) {
            const img = new Image();
            img.src = journey[idx].image;
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
    const distance = touchEndX - touchStartX;

    // HOME SCREEN swipe detection
    if ($("#home").is(":visible") && $("#home").css("display") !== "none") {
        if (distance > 45) {
            startJourney();
        }
        return;
    }

    // STORY SCREEN swipe: right = previous, left = next
    if ($("#viewer").is(":visible")) {
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
    if (!isMouseDown) return;
    isMouseDown = false;
    const mouseEndX = e.clientX;
    const delta = mouseEndX - mouseStartX;

    if (Math.abs(delta) < 40) return;

    if ($("#home").is(":visible")) {
        if (delta > 40) startJourney();
        return;
    }

    if ($("#viewer").is(":visible")) {
        if (delta < -40) nextSlide();
        if (delta > 40) previousSlide();
    }
});

/* -----------------------------
   KEYBOARD SUPPORT
------------------------------*/

$(document).on("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
    }

    // HOME SCREEN controls
    if ($("#home").is(":visible")) {
        if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
            startJourney();
        }
        return;
    }

    // VIEWER controls
    if ($("#viewer").is(":visible")) {
        if (e.key === "ArrowRight") {
            nextSlide();
        }
        if (e.key === "ArrowLeft") {
            previousSlide();
        }
        // ESC key to go back to home
        if (e.key === "Escape") {
            goBackToHome();
        }
    }
});