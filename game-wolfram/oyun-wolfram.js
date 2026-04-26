/* ========================================================
   MADEN HARİTA OYUNU
   ======================================================== */

const GAME_CONFIG = Object.freeze({
  title: 'Türkiye Wolfram (Tungsten) Yatakları Oyunu',
  menuTitle: "Türkiye'nin Wolfram (Tungsten) Yatakları",
  taskText: 'Wolfram (Tungsten) yatağı bulunan illeri bul.',
  learnTitle: 'Wolfram (Tungsten) Yatakları Öğren Modu',
  finishTitle: 'Tüm Wolfram (Tungsten) Yatakları Bulundu',
  cityLabelOverrides: Object.freeze({
    // Örnek: izmir: { x: 92, y: 235 }
  }),
  mineData: Object.freeze([
{ "label": "Uludağ", "cityId": "bursa", "x": 167.35, "y": 147.74 },
{ "label": "Gümüşler", "cityId": "nigde", "x": 455.72, "y": 299.74 },
{ "label": "Keban", "cityId": "elazig", "x": 678.75, "y": 254.99 }
])
});

const MINE_DATA = GAME_CONFIG.mineData;
const TASK_TEXT = GAME_CONFIG.taskText;
const CITY_LABEL_OVERRIDES = GAME_CONFIG.cityLabelOverrides;

// === DOM REFERANSLARI ===
const questionText   = document.getElementById('question-area');
const timerText      = document.getElementById('timer');
const scoreText      = document.getElementById('score');
const scoreBox       = document.getElementById('score-box');
const startBtn       = document.getElementById('start-btn');
const gameTitle      = document.getElementById('game-title');
const menuTitle      = document.querySelector('#diff-selectionArea .cog-diff-header-title');
const topBar         = document.getElementById('top-bar');
const topStats       = document.querySelector('.cog-top-stats');
const supportActions = document.querySelector('.cog-support-actions');
const topActions     = document.querySelector('.cog-top-actions');
const progressBarShell = document.getElementById('progress-bar-shell');
const progressBarFill  = document.getElementById('progress-bar-fill');
const progressBarLabel = document.getElementById('progress-bar-label');
const startArea      = document.getElementById('start-area');
const welcomeText    = document.getElementById('welcome-text');
const gameFrameShell = document.getElementById('game-frame');
const mapContainer   = document.querySelector('.cog-svg-turkiye-haritasi');
const svgEl          = document.getElementById('svg-turkiye-haritasi');
const hintBtn        = document.getElementById('hint-btn');
const answerBtn      = document.getElementById('answer-btn');
const hintCard       = document.getElementById('hint-card');
const hintCardText   = document.getElementById('hint-card-text');
const statusToast    = document.getElementById('status-toast');
const feedbackLayer  = document.getElementById('feedback-layer');
const confettiLayer  = document.getElementById('confetti-layer');
const pauseOverlay   = document.getElementById('pause-overlay');
const pauseTimeText  = document.getElementById('pause-time');
const fsBtn          = document.getElementById('fullscreen-btn');
const pauseBtn       = document.getElementById('pause-btn');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const pauseFullscreenBtn = document.getElementById('pause-fullscreen-btn');
const pauseSoundBtn  = document.getElementById('pause-sound-btn');
const pauseHelpBtn   = document.getElementById('pause-help-btn');
const pauseHelpPanel = document.getElementById('pause-help-panel');
const startFullscreenBtn = document.getElementById('start-fullscreen-btn');
const startSoundBtn  = document.getElementById('start-sound-btn');
const startHelpBtn   = document.getElementById('start-help-btn');
const startHelpPanel = document.getElementById('start-help-panel');
const learnBtn       = document.getElementById('learn-btn');
const learnBar       = document.getElementById('learn-bar');
const learnTitleText = document.querySelector('#learn-bar .cog-learn-title');
const learnMenuBtn   = document.getElementById('learn-menu-btn');
const diffSelectionArea = document.getElementById('diff-selectionArea');
const diffDescription = document.getElementById('diff-description');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const zoomHint = document.getElementById('zoom-hint');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

const DISPLAY_MODES = Object.freeze({
    none: 'none',
    block: 'block',
    flex: 'flex',
    inlineBlock: 'inline-block'
});

const DIFFICULTY_DESCRIPTIONS = Object.freeze({
    easy: 'Harita üzerinde isimler açık başlar. Yeni başlayanlar için ideal.',
    normal: 'Şehir adları gizli başlar, buldukça açılır. Standart deneyim.',
    hard: 'Sadece şehri bulmak yetmez, aynı bölgeye maden kapasitesi kadar tıkla.'
});

const UI_TIMINGS = Object.freeze({
    hintCardMs: 3200,
    statusToastMs: 1600,
    wrongFlashMs: 850,
    finishDelayMs: 500,
    mobileHintFadeMs: 3000,
    mobileHintHideMs: 4500,
    initialViewBoxDelayMs: 150
});

const GAME_PENALTIES = Object.freeze({
    hint: 50,
    answer: 100
});

const INTERACTION_LIMITS = Object.freeze({
    cityClickThrottleMs: 250,
    mouseDragThresholdPx: 5,
    touchDragThresholdPx: 10
});

const MOBILE_DEVICE_PATTERN = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobi/i;

// === OYUN DEÄÄ°ÅKENLERÄ° ===
let cities = [];
let citiesById = new Map();
let minesByCity = new Map();
let discoveredCities = new Set();
let revealedMineKeys = new Set();
let cityHitCounts = new Map();
let gameActive = false;
let seconds = 0;
let timerInterval = null;
let hintTimeout = null;
let statusTimeout = null;
let lastHandledTime = 0;
let mineLayer = null;
let remainingMineCount = MINE_DATA.length;
let score = 0;
let currentCombo = 0;
let longestCombo = 0;
let correctCount = 0;
let wrongCount = 0;
let consecutiveWrongCount = 0;
let hintUseCount = 0;
let answerUseCount = 0;
let autoRevealCount = 0;
let assistedMineKeys = new Set();
let gamePaused = false;
let learnModeActive = false;
let isMuted = false;
let isPseudoFullscreen = false;
let activeStreakNotice = null;
let scorePulseTimeout = null;
let frameShakeTimeout = null;
const SOUND_FILES = {
    click: '../sounds/click.mp3',
    combo1: '../sounds/combo1.mp3',
    combo2: '../sounds/combo2.mp3',
    combo3: '../sounds/combo3.mp3',
    combo4: '../sounds/combo4.mp3',
    combo5: '../sounds/combo5.mp3',
    correct: '../sounds/correct.mp3',
    wrong: '../sounds/wrong.mp3',
    complete: '../sounds/complete.mp3',
    hint: '../sounds/hint.mp3'
};
const SOUND_VOLUMES = {
    click: 0.04,
    combo1: 0.04,
    combo2: 0.04,
    combo3: 0.04,
    combo4: 0.04,
    combo5: 0.04,
    correct: 0.04,
    wrong: 0.04,
    complete: 0.04,
    hint: 0.04
};
const STREAK_NOTICES = Object.freeze({
    3: { text: "3'LÜ SERİ!", sound: 'combo1', volume: 0.045, sparks: 0 },
    5: { text: 'HARİKA SERİ!', sound: 'combo2', volume: 0.058, sparks: 5 },
    8: { text: 'MÜTHİŞ!', sound: 'combo3', volume: 0.072, sparks: 5 },
    10: { text: 'DURDURULAMAZ!', sound: 'combo4', volume: 0.088, sparks: 5 },
    15: { text: 'EFSANE!', sound: 'combo5', volume: 0.1, sparks: 5 }
});
const soundPlayers = Object.fromEntries(
    Object.entries(SOUND_FILES).map(([key, src]) => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = SOUND_VOLUMES[key] ?? 0.25;
        return [key, audio];
    })
);

const ICONS = {
    settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/></svg>',
    fullscreenOn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M408 64L552 64C565.3 64 576 74.7 576 88L576 232C576 241.7 570.2 250.5 561.2 254.2C552.2 257.9 541.9 255.9 535 249L496 210L409 297C399.6 306.4 384.4 306.4 375.1 297L343.1 265C333.7 255.6 333.7 240.4 343.1 231.1L430.1 144.1L391.1 105.1C384.2 98.2 382.2 87.9 385.9 78.9C389.6 69.9 398.3 64 408 64zM232 576L88 576C74.7 576 64 565.3 64 552L64 408C64 398.3 69.8 389.5 78.8 385.8C87.8 382.1 98.1 384.2 105 391L144 430L231 343C240.4 333.6 255.6 333.6 264.9 343L296.9 375C306.3 384.4 306.3 399.6 296.9 408.9L209.9 495.9L248.9 534.9C255.8 541.8 257.8 552.1 254.1 561.1C250.4 570.1 241.7 576 232 576z"/></svg>',
    fullscreenOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M503.5 71C512.9 61.6 528.1 61.6 537.4 71L569.4 103C578.8 112.4 578.8 127.6 569.4 136.9L482.4 223.9L521.4 262.9C528.3 269.8 530.3 280.1 526.6 289.1C522.9 298.1 514.2 304 504.5 304L360.5 304C347.2 304 336.5 293.3 336.5 280L336.5 136C336.5 126.3 342.3 117.5 351.3 113.8C360.3 110.1 370.6 112.1 377.5 119L416.5 158L503.5 71zM136.5 336L280.5 336C293.8 336 304.5 346.7 304.5 360L304.5 504C304.5 513.7 298.7 522.5 289.7 526.2C280.7 529.9 270.4 527.9 263.5 521L224.5 482L137.5 569C128.1 578.4 112.9 578.4 103.6 569L71.6 537C62.2 527.6 62.2 512.4 71.6 503.1L158.6 416.1L119.6 377.1C112.7 370.2 110.7 359.9 114.4 350.9C118.1 341.9 126.8 336 136.5 336z"/></svg>',
    volumeOn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M112 416L160 416L294.1 535.2C300.5 540.9 308.7 544 317.2 544C336.4 544 352 528.4 352 509.2L352 130.8C352 111.6 336.4 96 317.2 96C308.7 96 300.5 99.1 294.1 104.8L160 224L112 224C85.5 224 64 245.5 64 272L64 368C64 394.5 85.5 416 112 416zM505.1 171C494.8 162.6 479.7 164.2 471.3 174.5C462.9 184.8 464.5 199.9 474.8 208.3C507.3 234.7 528 274.9 528 320C528 365.1 507.3 405.3 474.8 431.8C464.5 440.2 463 455.3 471.3 465.6C479.6 475.9 494.8 477.4 505.1 469.1C548.3 433.9 576 380.2 576 320.1C576 260 548.3 206.3 505.1 171.1zM444.6 245.5C434.3 237.1 419.2 238.7 410.8 249C402.4 259.3 404 274.4 414.3 282.8C425.1 291.6 432 305 432 320C432 335 425.1 348.4 414.3 357.3C404 365.7 402.5 380.8 410.8 391.1C419.1 401.4 434.3 402.9 444.6 394.6C466.1 376.9 480 350.1 480 320C480 289.9 466.1 263.1 444.5 245.5z"/></svg>',
    volumeOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M80 416L128 416L262.1 535.2C268.5 540.9 276.7 544 285.2 544C304.4 544 320 528.4 320 509.2L320 130.8C320 111.6 304.4 96 285.2 96C276.7 96 268.5 99.1 262.1 104.8L128 224L80 224C53.5 224 32 245.5 32 272L32 368C32 394.5 53.5 416 80 416zM399 239C389.6 248.4 389.6 263.6 399 272.9L446 319.9L399 366.9C389.6 376.3 389.6 391.5 399 400.8C408.4 410.1 423.6 410.2 432.9 400.8L479.9 353.8L526.9 400.8C536.3 410.2 551.5 410.2 560.8 400.8C570.1 391.4 570.2 376.2 560.8 366.9L513.8 319.9L560.8 272.9C570.2 263.5 570.2 248.3 560.8 239C551.4 229.7 536.2 229.6 526.9 239L479.9 286L432.9 239C423.5 229.6 408.3 229.6 399 239z"/></svg>',
    help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M224 224C224 171 267 128 320 128C373 128 416 171 416 224C416 266.7 388.1 302.9 349.5 315.4C321.1 324.6 288 350.7 288 392L288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416L352 392C352 390.3 352.6 387.9 355.5 384.7C358.5 381.4 363.4 378.2 369.2 376.3C433.5 355.6 480 295.3 480 224C480 135.6 408.4 64 320 64C231.6 64 160 135.6 160 224C160 241.7 174.3 256 192 256C209.7 256 224 241.7 224 224zM320 576C342.1 576 360 558.1 360 536C360 513.9 342.1 496 320 496C297.9 496 280 513.9 280 536C280 558.1 297.9 576 320 576z"/></svg>'
};

function applyGameConfigText() {
    if (gameTitle) gameTitle.textContent = GAME_CONFIG.title;
    if (menuTitle) menuTitle.textContent = GAME_CONFIG.menuTitle;
    if (questionText) questionText.textContent = GAME_CONFIG.taskText;
    if (learnTitleText) learnTitleText.textContent = GAME_CONFIG.learnTitle;
}

applyGameConfigText();

function setButtonIcon(button, iconMarkup, label, title) {
    if (!button) return;
    button.innerHTML = iconMarkup;
    if (label) button.setAttribute('aria-label', label);
    if (title) button.title = title;
}

function setHelpPanelVisible(button, panel, visible) {
    if (!button || !panel) return;
    panel.classList.toggle('cog-visible', visible);
    panel.setAttribute('aria-hidden', visible ? 'false' : 'true');
    button.setAttribute('aria-expanded', visible ? 'true' : 'false');
    button.setAttribute('aria-label', visible ? 'Yardımı kapat' : 'Yardımı aç');
    button.title = visible ? 'Yardımı kapat' : 'Yardım';
}

function toggleHelpPanel(button, panel) {
    const isVisible = panel?.classList.contains('cog-visible');
    setHelpPanelVisible(button, panel, !isVisible);
}

function setElementDisplay(element, displayMode) {
    if (!element) return;
    element.hidden = displayMode === DISPLAY_MODES.none;
    element.style.display = displayMode;
}

function showElement(element, displayMode = DISPLAY_MODES.block) {
    setElementDisplay(element, displayMode);
}

function hideElement(element) {
    setElementDisplay(element, DISPLAY_MODES.none);
}

function updateDifficultyDescription(value) {
    if (!diffDescription) return;
    diffDescription.textContent = DIFFICULTY_DESCRIPTIONS[value] || DIFFICULTY_DESCRIPTIONS.normal;
}

function buildMineLookup() {
    const fixedLabelOffset = { dx: 5, dy: 0, anchor: 'start' };

    minesByCity = new Map();
    MINE_DATA.forEach((mine, index) => {
        if (!minesByCity.has(mine.cityId)) minesByCity.set(mine.cityId, []);
        const cityMines = minesByCity.get(mine.cityId);
        cityMines.push({
            ...mine,
            mineKey: `${mine.cityId}-${index}`,
            labelDx: fixedLabelOffset.dx,
            labelDy: fixedLabelOffset.dy,
            labelAnchor: fixedLabelOffset.anchor
        });
    });
}

function initCities() {
    if (!svgEl) return false;
    const groups = svgEl.querySelectorAll('g[data-iladi]');
    cities = Array.from(groups).map(g => ({
        id: g.id,
        name: g.getAttribute('data-iladi'),
        el: g
    }));
    citiesById = new Map(cities.map(city => [city.id, city]));
    return cities.length > 0;
}

function getOrCreateMineLayer() {
    if (!mineLayer) {
        mineLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mineLayer.setAttribute('id', 'mine-layer');
        svgEl.appendChild(mineLayer);
    }
    return mineLayer;
}

function clearMineLayer() {
    if (mineLayer) mineLayer.innerHTML = '';
}

// === ÅEHÄ°R Ä°SÄ°M ETÄ°KETLERÄ° (CITY LABELS) ===
let cityLabelLayer = null;

function getOrCreateCityLabelLayer() {
    if (!cityLabelLayer) {
        cityLabelLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cityLabelLayer.setAttribute('id', 'city-label-layer');
        svgEl.appendChild(cityLabelLayer);
    }
    return cityLabelLayer;
}

function clearCityLabelLayer() {
    if (cityLabelLayer) cityLabelLayer.innerHTML = '';
}

function getCityCapacity(cityId) {
    return (minesByCity.get(cityId) || []).length;
}

function isMineRevealed(mine) {
    return revealedMineKeys.has(mine.mineKey);
}

function markMineRevealed(mine) {
    revealedMineKeys.add(mine.mineKey);
}

function isMineAssisted(mine) {
    return assistedMineKeys.has(mine.mineKey);
}

function markMineAssisted(mine) {
    assistedMineKeys.add(mine.mineKey);
}

function revealMine(mine, options = {}) {
    if (!mine || isMineRevealed(mine)) return false;
    createMineMarker(mine);
    markMineRevealed(mine);
    if (options.assisted) markMineAssisted(mine);
    return true;
}

function getRemainingAnswerCityIds() {
    const remainingCityIds = new Set();
    getRemainingMines().forEach(mine => remainingCityIds.add(mine.cityId));
    return Array.from(remainingCityIds);
}

function setButtonAvailability(button, enabled) {
    if (!button) return;
    button.disabled = !enabled;
    button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
}

function getCityLabelLayout(cityName, bbox) {
    const maxWidth = Math.max(11.8, bbox.width * 0.87);
    const maxHeight = Math.max(5.7, bbox.height * 0.53);
    const fontSize = Math.max(5.8, Math.min(9.6, maxHeight));
    const estimatedWidth = fontSize * Math.max(cityName.length * 0.6, 2.6);

    return {
        fontSize,
        maxWidth,
        useTextLength: estimatedWidth > maxWidth
    };
}

function getCityLabelPosition(cityId, bbox) {
    const defaultX = bbox.x + bbox.width / 2;
    const defaultY = bbox.y + bbox.height / 2;
    const override = CITY_LABEL_OVERRIDES?.[cityId];

    if (!override) {
        return { x: defaultX, y: defaultY };
    }

    return {
        x: Number.isFinite(override.x) ? override.x : defaultX + (override.dx || 0),
        y: Number.isFinite(override.y) ? override.y : defaultY + (override.dy || 0)
    };
}

function createCityLabels() {
    clearCityLabelLayer();
    const layer = getOrCreateCityLabelLayer();

    cities.forEach(city => {
        try {
            const bbox = city.el.getBBox();
            const labelPosition = getCityLabelPosition(city.id, bbox);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'cog-city-label');
            text.setAttribute('x', String(labelPosition.x));
            text.setAttribute('y', String(labelPosition.y));
            text.setAttribute('data-city-id', city.id);
            text.textContent = city.name;

            const layout = getCityLabelLayout(city.name, bbox);
            text.style.fontSize = `${layout.fontSize.toFixed(2)}px`;
            text.style.fontWeight = bbox.width < 28 ? '800' : '700';

            if (layout.useTextLength) {
                text.setAttribute('textLength', layout.maxWidth.toFixed(1));
                text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            }

            // Kolay modda baÅŸtan gÃ¶ster
            if (gameDifficulty === 'easy' && !learnModeActive) {
                text.classList.add('cog-label-visible');
            }

            layer.appendChild(text);
        } catch (e) {
            // getBBox hatasÄ± varsa atla
        }
    });
}

function revealCityLabel(cityId) {
    if (gameDifficulty === 'easy') return; // Kolay modda zaten aÃ§Ä±k
    setCityLabelVisible(cityId);
}

function setCityLabelVisible(cityId) {
    const layer = getOrCreateCityLabelLayer();
    const label = layer.querySelector(`text[data-city-id="${cityId}"]`);
    if (label && !label.classList.contains('cog-label-visible')) {
        label.classList.add('cog-label-visible');
    }
}

function updateMissionText() {
    questionText.innerHTML = `<span class="cog-msg-question">${TASK_TEXT}</span>`;
    scheduleHeaderLayoutUpdate();
}

function updateRemainingUI() {
    updateProgressUI();
}

function updateProgressUI() {
    if (!progressBarFill || !progressBarShell) return;
    const revealedCount = Math.max(0, MINE_DATA.length - remainingMineCount);
    const progressPercent = MINE_DATA.length > 0
        ? Math.min(100, Math.max(0, Math.round((revealedCount / MINE_DATA.length) * 100)))
        : 0;
    progressBarFill.style.transform = `scaleX(${progressPercent / 100})`;
    progressBarShell.setAttribute('aria-valuenow', String(progressPercent));
    progressBarShell.setAttribute('aria-valuetext', `${revealedCount}/${MINE_DATA.length}`);
    if (progressBarLabel) progressBarLabel.textContent = `${revealedCount}/${MINE_DATA.length}`;
}

function getHeaderItemWidth(element) {
    if (!element) return 0;
    if (element === questionText) {
        const textElement = questionText.querySelector('.cog-msg-question') || questionText;
        const questionStyles = getComputedStyle(questionText);
        const textStyles = getComputedStyle(textElement);
        const measuringText = document.createElement('span');
        measuringText.textContent = textElement.textContent || '';
        measuringText.style.position = 'absolute';
        measuringText.style.visibility = 'hidden';
        measuringText.style.whiteSpace = 'nowrap';
        measuringText.style.font = textStyles.font;
        measuringText.style.letterSpacing = textStyles.letterSpacing;
        document.body.appendChild(measuringText);
        const naturalTextWidth = measuringText.getBoundingClientRect().width;
        measuringText.remove();
        const horizontalChrome =
            parseFloat(questionStyles.paddingLeft || 0) +
            parseFloat(questionStyles.paddingRight || 0) +
            parseFloat(questionStyles.borderLeftWidth || 0) +
            parseFloat(questionStyles.borderRightWidth || 0);
        return Math.ceil(naturalTextWidth + horizontalChrome);
    }
    return Math.ceil(element.scrollWidth || element.getBoundingClientRect().width);
}

function updateHeaderLayoutForFit() {
    if (!topBar || !questionText || topBar.hidden) return;

    topBar.classList.remove('cog-question-row');

    const topBarStyles = getComputedStyle(topBar);
    const horizontalPadding =
        parseFloat(topBarStyles.paddingLeft || 0) +
        parseFloat(topBarStyles.paddingRight || 0);
    const gap = parseFloat(topBarStyles.columnGap || topBarStyles.gap || 0) || 0;
    const items = [topStats, questionText, supportActions, topActions].filter(Boolean);
    const requiredWidth = items.reduce((total, item) => total + getHeaderItemWidth(item), 0) + gap * Math.max(0, items.length - 1);
    const availableWidth = topBar.clientWidth - horizontalPadding;

    topBar.classList.toggle('cog-question-row', requiredWidth > availableWidth);
}

function scheduleHeaderLayoutUpdate() {
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(updateHeaderLayoutForFit);
    } else {
        updateHeaderLayoutForFit();
    }
}

function playSound(name, volumeOverride = null) {
    if (isMuted) return;
    const sound = soundPlayers[name];
    if (!sound) return;
    try {
        sound.volume = volumeOverride ?? SOUND_VOLUMES[name] ?? 0.25;
        sound.currentTime = 0;
        const playResult = sound.play();
        if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(() => {});
        }
    } catch (e) {}
}

function getComboMultiplier(comboCount) {
    if (comboCount <= 4) return 1;
    if (comboCount === 5) return 1.2;
    if (comboCount === 6) return 1.5;
    if (comboCount === 7) return 1.8;
    return 2;
}

function getComboTier(comboCount) {
    if (comboCount >= 15) return 15;
    if (comboCount >= 10) return 10;
    if (comboCount >= 8) return 8;
    if (comboCount >= 5) return 5;
    if (comboCount >= 3) return 3;
    return 0;
}

function getScorePulseDuration(comboTier) {
    if (comboTier >= 15) return 2430;
    if (comboTier >= 10) return 2390;
    if (comboTier >= 8) return 2360;
    if (comboTier >= 5) return 2330;
    if (comboTier >= 3) return 2300;
    return 2260;
}

function getStreakNoticeConfig(comboCount) {
    const exactConfig = STREAK_NOTICES[comboCount];
    if (exactConfig) return { ...exactConfig, tier: comboCount };
    if (comboCount > 15 && comboCount % 5 === 0) {
        return {
            ...STREAK_NOTICES[15],
            tier: 15,
            text: `${comboCount}'Lİ SERİ!`
        };
    }
    return null;
}

function hasStreakNotice(comboCount) {
    return Boolean(getStreakNoticeConfig(comboCount));
}

function shouldTriggerComboShake(comboCount) {
    return comboCount === 8 || comboCount === 10 || comboCount === 15 || (comboCount > 15 && comboCount % 5 === 0);
}

function clearScorePulseClasses() {
    if (!scoreBox) return;
    scoreBox.classList.remove(
        'cog-score-pulse',
        'cog-score-tier-0',
        'cog-score-tier-3',
        'cog-score-tier-5',
        'cog-score-tier-8',
        'cog-score-tier-10',
        'cog-score-tier-15'
    );
}

function triggerScorePulse(comboCount) {
    if (!scoreBox) return;
    const comboTier = getComboTier(comboCount);
    if (scorePulseTimeout) clearTimeout(scorePulseTimeout);
    clearScorePulseClasses();
    void scoreBox.getBoundingClientRect();
    scoreBox.classList.add('cog-score-pulse', `cog-score-tier-${comboTier}`);
    scorePulseTimeout = setTimeout(() => {
        clearScorePulseClasses();
        scorePulseTimeout = null;
    }, getScorePulseDuration(comboTier) + 90);
}

function clearFrameShakeClasses() {
    if (!gameFrameShell) return;
    gameFrameShell.classList.remove('cog-frame-shake-8', 'cog-frame-shake-10', 'cog-frame-shake-15');
}

function triggerComboFrameShake(comboCount) {
    if (!gameFrameShell) return;
    if (!shouldTriggerComboShake(comboCount)) return;
    const comboTier = getComboTier(comboCount);
    if (frameShakeTimeout) clearTimeout(frameShakeTimeout);
    clearFrameShakeClasses();
    void gameFrameShell.getBoundingClientRect();
    gameFrameShell.classList.add(`cog-frame-shake-${comboTier}`);
    frameShakeTimeout = setTimeout(() => {
        clearFrameShakeClasses();
        frameShakeTimeout = null;
    }, comboTier >= 15 ? 180 : comboTier >= 10 ? 160 : 145);
}

function getFramePoint(clientX, clientY) {
    if (!gameFrameShell) return null;
    const rect = gameFrameShell.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function getElementFrameCenter(element) {
    if (!element || !gameFrameShell) return null;
    const elementRect = element.getBoundingClientRect();
    const frameRect = gameFrameShell.getBoundingClientRect();
    return {
        x: elementRect.left + elementRect.width / 2 - frameRect.left,
        y: elementRect.top + elementRect.height / 2 - frameRect.top
    };
}

function getSvgFramePoint(svgX, svgY) {
    if (!svgEl || !gameFrameShell) return null;
    const screenMatrix = svgEl.getScreenCTM();
    if (!screenMatrix) return null;
    const svgPoint = svgEl.createSVGPoint();
    svgPoint.x = svgX;
    svgPoint.y = svgY;
    const screenPoint = svgPoint.matrixTransform(screenMatrix);
    return getFramePoint(screenPoint.x, screenPoint.y);
}

function resetAnimationClass(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.getBoundingClientRect();
    element.classList.add(className);
}

function spawnImpactRing(point, variant = 'correct', comboCount = 0, options = {}) {
    if (!feedbackLayer || !point) return;
    const comboTier = getComboTier(comboCount);
    const ring = document.createElement('div');
    ring.className = [
        'cog-impact-ring',
        variant === 'wrong' ? 'cog-wrong' : '',
        variant === 'combo' ? 'cog-combo' : '',
        comboTier > 0 ? `cog-combo-tier-${comboTier}` : '',
        options.secondary ? 'cog-ring-secondary' : ''
    ].filter(Boolean).join(' ');
    ring.style.left = `${point.x}px`;
    ring.style.top = `${point.y}px`;
    if (options.delay) ring.style.animationDelay = `${options.delay}ms`;
    ring.addEventListener('animationend', () => ring.remove(), { once: true });
    feedbackLayer.appendChild(ring);
}

function spawnFloatingReward(point, text, variant = 'score', comboCount = 0) {
    if (!feedbackLayer || !point || !text) return;
    const comboTier = getComboTier(comboCount);
    const reward = document.createElement('div');
    reward.className = [
        'cog-floating-reward',
        `cog-${variant}`,
        comboTier > 0 ? `cog-combo-tier-${comboTier}` : ''
    ].filter(Boolean).join(' ');
    reward.textContent = text;
    reward.style.left = `${point.x}px`;
    reward.style.top = `${point.y}px`;
    reward.addEventListener('animationend', () => reward.remove(), { once: true });
    feedbackLayer.appendChild(reward);
}

function clearStreakNotice() {
    if (activeStreakNotice) {
        activeStreakNotice.remove();
        activeStreakNotice = null;
    }
    feedbackLayer?.querySelectorAll('.cog-streak-notice').forEach(notice => notice.remove());
}

function triggerStreakNotice(comboCount) {
    if (!feedbackLayer) return;
    const noticeConfig = getStreakNoticeConfig(comboCount);
    if (!noticeConfig) return;

    clearStreakNotice();

    const notice = document.createElement('div');
    notice.className = `cog-streak-notice cog-streak-${noticeConfig.tier}`;

    const label = document.createElement('span');
    label.textContent = noticeConfig.text;
    notice.appendChild(label);

    for (let i = 0; i < noticeConfig.sparks; i += 1) {
        const spark = document.createElement('span');
        spark.className = 'cog-streak-spark';
        notice.appendChild(spark);
    }

    notice.addEventListener('animationend', () => {
        if (activeStreakNotice === notice) activeStreakNotice = null;
        notice.remove();
    }, { once: true });

    activeStreakNotice = notice;
    feedbackLayer.appendChild(notice);
    playSound(noticeConfig.sound, noticeConfig.volume);
    if (noticeConfig.tier === 15) triggerComboConfettiBurst();
}

function triggerCorrectFeedback(clickedGroup, point, multiplier, comboCount) {
    resetAnimationClass(clickedGroup, 'cog-hit-pop');
    if (!point) return;
    const comboTier = getComboTier(comboCount);
    const isComboReward = comboTier > 0 || multiplier > 1;
    spawnImpactRing(point, isComboReward ? 'combo' : 'correct', comboCount);
    if (comboTier >= 5) {
        spawnImpactRing(point, 'combo', comboCount, { secondary: true, delay: comboTier >= 10 ? 110 : 90 });
    }
    spawnFloatingReward(point, `+${Math.round(100 * multiplier)}`, isComboReward ? 'combo' : 'score', comboCount);
    triggerComboFrameShake(comboCount);
}

function triggerWrongFeedback(clickedGroup, point) {
    resetAnimationClass(clickedGroup, 'cog-hit-shake');
    if (point) spawnImpactRing(point, 'wrong');
}

function triggerSupportPenaltyFeedback(point, penalty) {
    if (!point || penalty <= 0) return;
    spawnFloatingReward(point, `-${penalty}`, 'penalty');
}

function triggerConfettiBurst() {
    if (!confettiLayer || !gameFrameShell) return;
    confettiLayer.innerHTML = '';
    const rect = gameFrameShell.getBoundingClientRect();
    const burstCount = 30;
    const colors = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#fde047'];
    for (let i = 0; i < burstCount; i += 1) {
        const piece = document.createElement('div');
        piece.className = 'cog-confetti';
        const fromLeft = i < burstCount / 2;
        const startX = fromLeft ? rect.width * 0.15 : rect.width * 0.85;
        const startY = rect.height * 0.78;
        piece.style.left = `${startX + (Math.random() * 70 - 35)}px`;
        piece.style.top = `${startY + (Math.random() * 20 - 10)}px`;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty('--dx', `${(Math.random() * 360 - 180).toFixed(0)}px`);
        piece.style.setProperty('--dy', `${(-120 - Math.random() * 180).toFixed(0)}px`);
        piece.style.setProperty('--rot', `${(Math.random() * 520 - 260).toFixed(0)}deg`);
        piece.style.animationDelay = `${(Math.random() * 0.18).toFixed(2)}s`;
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
        confettiLayer.appendChild(piece);
    }
}

function triggerComboConfettiBurst() {
    if (!confettiLayer || !gameFrameShell) return;
    const rect = gameFrameShell.getBoundingClientRect();
    const burstCount = 18;
    const colors = ['#2dd4bf', '#38bdf8', '#60a5fa', '#a78bfa', '#f472b6', '#f8fafc'];
    for (let i = 0; i < burstCount; i += 1) {
        const piece = document.createElement('div');
        piece.className = 'cog-confetti cog-combo-confetti cog-combo-tier-15';
        const startX = rect.width * (0.22 + Math.random() * 0.56);
        const startY = rect.height * (0.18 + Math.random() * 0.18);
        piece.style.left = `${startX}px`;
        piece.style.top = `${startY}px`;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty('--dx', `${(Math.random() * 220 - 110).toFixed(0)}px`);
        piece.style.setProperty('--dy', `${(130 + Math.random() * 170).toFixed(0)}px`);
        piece.style.setProperty('--rot', `${(Math.random() * 560 - 280).toFixed(0)}deg`);
        piece.style.animationDelay = `${(Math.random() * 0.22).toFixed(2)}s`;
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
        confettiLayer.appendChild(piece);
    }
}

function updateScoreUI() {
    if (scoreText) scoreText.textContent = String(score);
}

function resetCombo() {
    clearStreakNotice();
    currentCombo = 0;
    updateScoreUI();
}

function registerCorrectMove() {
    currentCombo += 1;
    longestCombo = Math.max(longestCombo, currentCombo);
    correctCount += 1;
    consecutiveWrongCount = 0;
    const multiplier = getComboMultiplier(currentCombo);
    score += Math.round(100 * multiplier);
    updateScoreUI();
    triggerScorePulse(currentCombo);
    return multiplier;
}

function registerWrongMove() {
    wrongCount += 1;
    consecutiveWrongCount += 1;
    resetCombo();
}

function registerHintUse() {
    hintUseCount += 1;
    score -= GAME_PENALTIES.hint;
    resetCombo();
}

function registerAnswerUse(penalty = 0) {
    answerUseCount += 1;
    score -= penalty;
    resetCombo();
}

function registerAutoReveal() {
    autoRevealCount += 1;
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function getAccuracyPercent() {
    const totalManualAttempts = correctCount + wrongCount;
    if (totalManualAttempts <= 0) return 0;
    return Math.round((correctCount / totalManualAttempts) * 100);
}

function startTimer(reset = true) {
    if (reset) {
        seconds = 0;
        timerText.textContent = '00:00';
    } else {
        timerText.textContent = formatTime(seconds);
    }
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        seconds += 1;
        timerText.textContent = formatTime(seconds);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}


function isFullscreenActive() {
    return Boolean(document.fullscreenElement || isPseudoFullscreen || gameFrameShell?.classList.contains('cog-ios-fullscreen'));
}

function updateFullscreenUI() {
    const active = isFullscreenActive();
    if (fsBtn) {
        setButtonIcon(fsBtn, active ? ICONS.fullscreenOff : ICONS.fullscreenOn, active ? 'Tam ekrandan çık' : 'Tam ekran', active ? 'Tam ekrandan çık' : 'Tam ekran');
        fsBtn.dataset.fullscreenState = active ? 'active' : 'inactive';
    }
    if (pauseFullscreenBtn) {
        setButtonIcon(pauseFullscreenBtn, active ? ICONS.fullscreenOff : ICONS.fullscreenOn, active ? 'Tam ekrandan çık' : 'Tam ekrana geç', active ? 'Tam ekrandan çık' : 'Tam ekran');
        pauseFullscreenBtn.dataset.fullscreenState = active ? 'active' : 'inactive';
    }
    if (startFullscreenBtn) {
        setButtonIcon(startFullscreenBtn, active ? ICONS.fullscreenOff : ICONS.fullscreenOn, active ? 'Tam ekrandan çık' : 'Tam ekrana geç', active ? 'Tam ekrandan çık' : 'Tam ekran');
        startFullscreenBtn.dataset.fullscreenState = active ? 'active' : 'inactive';
    }
}

function notifyParentFullscreen(type) {
    try {
        window.parent.postMessage({ type }, '*');
    } catch (e) {}
}

function toggleFullscreen(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!gameFrameShell) return;
    const isMobileDevice = MOBILE_DEVICE_PATTERN.test(navigator.userAgent) || window.innerWidth <= 768;

    if (isPseudoFullscreen) {
        gameFrameShell.classList.remove('cog-ios-fullscreen');
        isPseudoFullscreen = false;
        updateFullscreenUI();
        notifyParentFullscreen('EXIT_FULLSCREEN');
        if (document.fullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
        return;
    }

    if (isMobileDevice) {
        gameFrameShell.classList.add('cog-ios-fullscreen');
        isPseudoFullscreen = true;
        updateFullscreenUI();
        notifyParentFullscreen('ENTER_FULLSCREEN');
        return;
    }

    if (!document.fullscreenElement) {
        if (gameFrameShell.requestFullscreen) {
            gameFrameShell.requestFullscreen().catch(() => {
                gameFrameShell.classList.add('cog-ios-fullscreen');
                isPseudoFullscreen = true;
                updateFullscreenUI();
                notifyParentFullscreen('ENTER_FULLSCREEN');
            });
        } else if (gameFrameShell.webkitRequestFullscreen) {
            gameFrameShell.webkitRequestFullscreen();
        } else if (gameFrameShell.msRequestFullscreen) {
            gameFrameShell.msRequestFullscreen();
        } else {
            gameFrameShell.classList.add('cog-ios-fullscreen');
            isPseudoFullscreen = true;
            updateFullscreenUI();
        }
        notifyParentFullscreen('ENTER_FULLSCREEN');
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        notifyParentFullscreen('EXIT_FULLSCREEN');
    }
}

function setMutedState(nextMuted) {
    isMuted = nextMuted;
    if (isMuted) {
        Object.values(soundPlayers).forEach(sound => {
            try {
                sound.pause();
                sound.currentTime = 0;
            } catch (e) {}
        });
    }
    if (pauseSoundBtn) {
        setButtonIcon(pauseSoundBtn, isMuted ? ICONS.volumeOff : ICONS.volumeOn, isMuted ? 'Sesi aç' : 'Sesi kapat', isMuted ? 'Sesi aç' : 'Sesi kapat');
        pauseSoundBtn.dataset.soundState = isMuted ? 'muted' : 'on';
    }
    if (startSoundBtn) {
        setButtonIcon(startSoundBtn, isMuted ? ICONS.volumeOff : ICONS.volumeOn, isMuted ? 'Sesi aç' : 'Sesi kapat', isMuted ? 'Sesi aç' : 'Sesi kapat');
        startSoundBtn.dataset.soundState = isMuted ? 'muted' : 'on';
    }
}

function toggleMutedState() {
    setMutedState(!isMuted);
}

function returnToStartScreen() {
    gameActive = false;
    gamePaused = false;
    learnModeActive = false;
    closePauseOverlay();
    setHelpPanelVisible(startHelpBtn, startHelpPanel, false);
    setHelpPanelVisible(pauseHelpBtn, pauseHelpPanel, false);
    resetGameState();
    hideElement(topBar);
    hideElement(learnBar);
    hideElement(progressBarShell);
    showElement(gameTitle);
    showElement(startArea, DISPLAY_MODES.flex);
    if (welcomeText) {
        hideElement(welcomeText);
        welcomeText.innerHTML = '';
    }
    showElement(diffSelectionArea);
    if (startBtn) {
        showElement(startBtn, DISPLAY_MODES.inlineBlock);
        startBtn.textContent = 'Oyuna Başla';
    }
}

function openPauseOverlay() {
    if (!gameActive || gamePaused || !pauseOverlay) return;
    gamePaused = true;
    stopTimer();
    hideHintCard();
    setHelpPanelVisible(pauseHelpBtn, pauseHelpPanel, false);
    if (pauseTimeText) {
        pauseTimeText.textContent = `Durdurulan Süre: ${formatTime(seconds)}`;
    }
    updateFullscreenUI();
    setMutedState(isMuted);
    updateAnswerButtonState();
    showElement(pauseOverlay, DISPLAY_MODES.flex);
    pauseOverlay.setAttribute('aria-hidden', 'false');
}

function closePauseOverlay() {
    if (!pauseOverlay) return;
    hideElement(pauseOverlay);
    pauseOverlay.setAttribute('aria-hidden', 'true');
    setHelpPanelVisible(pauseHelpBtn, pauseHelpPanel, false);
    gamePaused = false;
    updateAnswerButtonState();
}

function resumeGame() {
    if (!gameActive || !gamePaused) return;
    closePauseOverlay();
    startTimer(false);
}

function restartFromPause() {
    returnToStartScreen();
}

function hideHintCard() {
    clearTimeout(hintTimeout);
    hintCard.classList.remove('cog-visible');
    hintCard.setAttribute('aria-hidden', 'true');
}

function showHintCard(label) {
    clearTimeout(hintTimeout);
    hintCardText.textContent = label;
    hintCard.classList.add('cog-visible');
    hintCard.setAttribute('aria-hidden', 'false');
    hintTimeout = setTimeout(() => hideHintCard(), UI_TIMINGS.hintCardMs);
}

function hideStatusToast() {
    clearTimeout(statusTimeout);
    statusToast.classList.remove('cog-visible', 'cog-error', 'cog-success');
    statusToast.setAttribute('aria-hidden', 'true');
}

function showStatusToast(message, type = '') {
    clearTimeout(statusTimeout);
    statusToast.textContent = message;
    statusToast.classList.remove('cog-error', 'cog-success');
    if (type) statusToast.classList.add(`cog-${type}`);
    statusToast.classList.add('cog-visible');
    statusToast.setAttribute('aria-hidden', 'false');
    statusTimeout = setTimeout(() => hideStatusToast(), UI_TIMINGS.statusToastMs);
}

function updateAnswerButtonState() {
    if (!answerBtn) return;
    const hasRemainingTargets = gameDifficulty === 'hard'
        ? getRemainingMines().length > 0
        : getRemainingAnswerCityIds().length > 0;
    const isEnabled = gameActive && !gamePaused && hasRemainingTargets;
    setButtonAvailability(answerBtn, isEnabled);
}

function handleWrongSelection(clickedGroup, interactionPoint) {
    registerWrongMove();
    playSound('wrong');
    triggerWrongFeedback(clickedGroup, interactionPoint);
    clickedGroup.classList.add('cog-wrong-city');
    setTimeout(() => clickedGroup.classList.remove('cog-wrong-city'), UI_TIMINGS.wrongFlashMs);
    triggerAutoRevealFromWrongStreak();
}

function queueFinishGameIfCompleted() {
    if (remainingMineCount !== 0) return;
    setTimeout(() => finishGame(), UI_TIMINGS.finishDelayMs);
}

function resetCityClasses() {
    document.querySelectorAll('g[data-iladi]').forEach(g => {
        g.classList.remove(
            'cog-correct-city',
            'cog-correct-city-green',
            'cog-correct-city-pink',
            'cog-correct-city-dark-red',
            'cog-correct-city-yellow',
            'cog-correct-city-red',
            'cog-wrong-city'
        );
    });
}

function getManualCorrectCityClassForStreak(wrongStreak) {
    if (wrongStreak <= 0) return 'cog-correct-city-green';
    if (wrongStreak <= 3) return 'cog-correct-city-pink';
    return 'cog-correct-city-dark-red';
}

function getMineCityIds() {
    return Array.from(new Set(MINE_DATA.map(mine => mine.cityId)));
}

function applyCorrectCityClass(cityGroup, className) {
    if (!cityGroup) return;
    cityGroup.classList.remove(
        'cog-correct-city',
        'cog-correct-city-green',
        'cog-correct-city-pink',
        'cog-correct-city-dark-red',
        'cog-correct-city-yellow',
        'cog-correct-city-red'
    );
    cityGroup.classList.add(className);
}

function resetGameState() {
    discoveredCities = new Set();
    revealedMineKeys = new Set();
    assistedMineKeys = new Set();
    cityHitCounts = new Map();
    remainingMineCount = MINE_DATA.length;
    score = 0;
    currentCombo = 0;
    longestCombo = 0;
    correctCount = 0;
    wrongCount = 0;
    consecutiveWrongCount = 0;
    hintUseCount = 0;
    answerUseCount = 0;
    autoRevealCount = 0;
    learnModeActive = false;
    gameActive = false;
    gamePaused = false;
    stopTimer();
    updateRemainingUI();
    updateScoreUI();
    updateMissionText();
    hideHintCard();
    hideStatusToast();
    clearStreakNotice();
    resetCityClasses();
    clearMineLayer();
    clearCityLabelLayer();
    lastHandledTime = 0;
    updateAnswerButtonState();
}

function createMineMarker(mine) {
    const layer = getOrCreateMineLayer();
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'mine-marker');
    group.setAttribute('data-city-id', mine.cityId);
    group.setAttribute('data-label', mine.label);

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('class', 'mine-glow');
    glow.setAttribute('cx', mine.x);
    glow.setAttribute('cy', mine.y);
    glow.setAttribute('r', '8');

    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('class', 'mine-pulse');
    pulse.setAttribute('cx', mine.x);
    pulse.setAttribute('cy', mine.y);
    pulse.setAttribute('r', '5.8');

    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('class', 'mine-core');
    core.setAttribute('cx', mine.x);
    core.setAttribute('cy', mine.y);
    core.setAttribute('r', '3.2');

    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('class', 'mine-label-text');
    labelText.setAttribute('x', String(mine.x + (mine.labelDx ?? 7)));
    labelText.setAttribute('y', String(mine.y + (mine.labelDy ?? 0)));
    labelText.setAttribute('text-anchor', mine.labelAnchor || 'start');
    labelText.textContent = mine.label;

    group.append(glow, pulse, core, labelText);
    layer.appendChild(group);
}

function revealCityMines(cityId, options = {}) {
    const mines = minesByCity.get(cityId) || [];
    let revealedCount = 0;
    mines.forEach(mine => {
        if (revealMine(mine, options)) revealedCount += 1;
    });
    return revealedCount;
}

function revealNextCityMine(cityId, options = {}) {
    const mines = minesByCity.get(cityId) || [];
    const nextMine = mines.find(mine => !isMineRevealed(mine));
    if (!nextMine) return null;
    revealMine(nextMine, options);
    return nextMine;
}

function revealSupportTarget(options = {}) {
    const {
        penalty = 0,
        mode = 'answer'
    } = options;
    if (!gameActive || gamePaused) return;

    const finalizeSupportReveal = (revealedAmount, feedbackPoint = null) => {
        if (mode === 'answer') {
            registerAnswerUse(penalty);
        } else if (mode === 'auto') {
            registerAutoReveal();
            consecutiveWrongCount = 0;
        }

        remainingMineCount = Math.max(0, remainingMineCount - revealedAmount);
        playSound('hint');
        updateRemainingUI();
        triggerSupportPenaltyFeedback(feedbackPoint, penalty);
        updateAnswerButtonState();
        queueFinishGameIfCompleted();
    };

    if (gameDifficulty === 'hard') {
        const remainingMines = getRemainingMines();
        if (!remainingMines.length) {
            updateAnswerButtonState();
            return false;
        }

        const assistedMine = remainingMines[Math.floor(Math.random() * remainingMines.length)];
        if (!revealMine(assistedMine, { assisted: true })) {
            updateAnswerButtonState();
            return false;
        }

        const currentHits = cityHitCounts.get(assistedMine.cityId) || 0;
        cityHitCounts.set(assistedMine.cityId, currentHits + 1);
        if (currentHits === 0) revealCityLabel(assistedMine.cityId);

        finalizeSupportReveal(1, getSvgFramePoint(assistedMine.x, assistedMine.y));
        return true;
    }

    const remainingCityIds = getRemainingAnswerCityIds();
    if (!remainingCityIds.length) {
        updateAnswerButtonState();
        return false;
    }

    const cityId = remainingCityIds[Math.floor(Math.random() * remainingCityIds.length)];
    const cityGroup = citiesById.get(cityId)?.el;
    const revealedCount = revealCityMines(cityId, { assisted: true });
    if (!revealedCount) {
        updateAnswerButtonState();
        return false;
    }

    discoveredCities.add(cityId);
    if (cityGroup) applyCorrectCityClass(cityGroup, 'cog-correct-city-dark-red');
    revealCityLabel(cityId);
    finalizeSupportReveal(revealedCount, getElementFrameCenter(cityGroup));
    return true;
}

function revealAssistedAnswer() {
    return revealSupportTarget({
        penalty: GAME_PENALTIES.answer,
        mode: 'answer'
    });
}

function triggerAutoRevealFromWrongStreak() {
    if (consecutiveWrongCount < 6) return false;
    return revealSupportTarget({
        mode: 'auto',
        penalty: GAME_PENALTIES.answer
    });
}

function finishGame() {
    gameActive = false;
    gamePaused = false;
    stopTimer();
    playSound('complete');
    triggerConfettiBurst();
    closePauseOverlay();
    hideElement(topBar);
    hideElement(progressBarShell);
    showElement(gameTitle);
    
    hideElement(diffSelectionArea);
    
    if (welcomeText) {
        showElement(welcomeText);
        const accuracyPercent = getAccuracyPercent();
        welcomeText.innerHTML = `
            <div class="cog-final-card" role="status" aria-live="polite">
                <span class="cog-msg-title cog-final-title">${GAME_CONFIG.finishTitle}</span>
                <div class="cog-final-summary" aria-label="Oyun sonu istatistikleri">
                    <div class="cog-final-stat cog-final-stat-success">
                        <span class="cog-final-stat-label">Doğru</span>
                        <span class="cog-final-stat-value">${correctCount}</span>
                    </div>
                    <div class="cog-final-stat cog-final-stat-danger">
                        <span class="cog-final-stat-label">Yanlış</span>
                        <span class="cog-final-stat-value">${wrongCount}</span>
                    </div>
                    <div class="cog-final-stat cog-final-stat-score">
                        <span class="cog-final-stat-label">Skor</span>
                        <span class="cog-final-stat-value">${score}</span>
                    </div>
                    <div class="cog-final-stat cog-final-stat-accuracy">
                        <span class="cog-final-stat-label">Doğruluk</span>
                        <span class="cog-final-stat-value">%${accuracyPercent}</span>
                    </div>
                    <div class="cog-final-stat cog-final-stat-time">
                        <span class="cog-final-stat-label">Süre</span>
                        <span class="cog-final-stat-value">${formatTime(seconds)}</span>
                    </div>
                </div>
            </div>`;
    }
    
    showElement(startArea, DISPLAY_MODES.flex);
    
    if (startBtn) {
        showElement(startBtn, DISPLAY_MODES.inlineBlock);
        startBtn.textContent = 'Tekrar Oyna';
    }
    
    hideHintCard();
    hideStatusToast();
    updateAnswerButtonState();
}

let gameDifficulty = 'normal';

function startLearnMode() {
    if (!initCities()) {
        alert('LÃ¼tfen Ã¶nce SVG kodlarÄ±nÄ± index.html iÃ§ine yapÄ±ÅŸtÄ±rÄ±n!');
        return;
    }

    buildMineLookup();
    resetGameState();
    learnModeActive = true;
    gameActive = false;
    gamePaused = false;
    setHelpPanelVisible(startHelpBtn, startHelpPanel, false);
    setHelpPanelVisible(pauseHelpBtn, pauseHelpPanel, false);

    hideElement(gameTitle);
    hideElement(startArea);
    hideElement(topBar);
    hideElement(progressBarShell);
    showElement(learnBar, DISPLAY_MODES.flex);
    closePauseOverlay();

    resetZoom();
    createCityLabels();
    getMineCityIds().forEach(cityId => {
        const cityGroup = citiesById.get(cityId)?.el;
        if (cityGroup) applyCorrectCityClass(cityGroup, 'cog-correct-city-green');
        setCityLabelVisible(cityId);
    });
    getRemainingMines().forEach(mine => revealMine(mine));
    updateAnswerButtonState();
    hideHintCard();
    hideStatusToast();
}

function startGame() {
    const checkedRadio = document.querySelector('input[name="difficulty"]:checked');
    if (checkedRadio) gameDifficulty = checkedRadio.value;

    if (!initCities()) {
        alert('Lütfen önce SVG kodlarını index.html içine yapıştırın!');
        return;
    }

    buildMineLookup();
    resetGameState();
    gameActive = true;
    learnModeActive = false;
    gamePaused = false;
    setHelpPanelVisible(startHelpBtn, startHelpPanel, false);
    setHelpPanelVisible(pauseHelpBtn, pauseHelpPanel, false);

    hideElement(gameTitle);
    hideElement(startArea);
    hideElement(learnBar);
    showElement(topBar, DISPLAY_MODES.flex);
    showElement(progressBarShell);
    closePauseOverlay();

    updateRemainingUI();
    updateMissionText();
    resetZoom();
    createCityLabels();
    startTimer();
    updateAnswerButtonState();
    scheduleHeaderLayoutUpdate();
}

function handleCityClick(clickedGroup, interactionPoint = null) {
    if (!gameActive || gamePaused || !clickedGroup) return;

    const now = Date.now();
    if (now - lastHandledTime < INTERACTION_LIMITS.cityClickThrottleMs) return;
    lastHandledTime = now;

    const cityId = clickedGroup.id;
    if (gameDifficulty !== 'hard' && discoveredCities.has(cityId)) return;

    if (gameDifficulty === 'hard') {
        const cityCapacity = getCityCapacity(cityId);

        if (cityCapacity === 0) {
            handleWrongSelection(clickedGroup, interactionPoint);
            return;
        }

        const currentHits = cityHitCounts.get(cityId) || 0;
        if (currentHits >= cityCapacity) {
            handleWrongSelection(clickedGroup, interactionPoint);
            return;
        }

        const revealedMine = revealNextCityMine(cityId);
        if (!revealedMine) {
            handleWrongSelection(clickedGroup, interactionPoint);
            return;
        }

        cityHitCounts.set(cityId, currentHits + 1);
        if (currentHits === 0) revealCityLabel(cityId);

        remainingMineCount = Math.max(0, remainingMineCount - 1);
        const multiplier = registerCorrectMove();
        if (!hasStreakNotice(currentCombo)) playSound('correct');
        updateRemainingUI();
        updateAnswerButtonState();
        triggerCorrectFeedback(clickedGroup, interactionPoint, multiplier, currentCombo);
        triggerStreakNotice(currentCombo);

        queueFinishGameIfCompleted();
        return;
    }

    const mineCountInCity = minesByCity.has(cityId) ? revealCityMines(cityId) : 0;

    if (mineCountInCity > 0) {
        const successColorClass = getManualCorrectCityClassForStreak(consecutiveWrongCount);
        discoveredCities.add(cityId);
        applyCorrectCityClass(clickedGroup, successColorClass);
        revealCityLabel(cityId);
        remainingMineCount = Math.max(0, remainingMineCount - mineCountInCity);
        const multiplier = registerCorrectMove();
        if (!hasStreakNotice(currentCombo)) playSound('correct');
        updateRemainingUI();
        updateAnswerButtonState();
        triggerCorrectFeedback(clickedGroup, interactionPoint, multiplier, currentCombo);
        triggerStreakNotice(currentCombo);

        queueFinishGameIfCompleted();
    } else {
        handleWrongSelection(clickedGroup, interactionPoint);
        updateAnswerButtonState();
    }
}

function getRemainingMines() {
    const cityMines = Array.from(minesByCity.values()).flat();
    return cityMines.filter(mine => !isMineRevealed(mine));
}

function showHint() {
    if (!gameActive || gamePaused) return;
    const remainingMines = getRemainingMines();
    if (!remainingMines.length) return;
    registerHintUse();
    playSound('hint');
    const randomMine = remainingMines[Math.floor(Math.random() * remainingMines.length)];
    showHintCard(randomMine.label);
}

// DESKTOP: Mouse tÄ±klama
let mouseWasDragged = false;
mapContainer.addEventListener('click', function(e) {
    if (!gameActive || gamePaused) return;
    if (mouseWasDragged) {
        mouseWasDragged = false;
        return;
    }
    const clickedGroup = e.target.closest('g[data-iladi]');
    handleCityClick(clickedGroup, getFramePoint(e.clientX, e.clientY));
});

if (startBtn) startBtn.addEventListener('click', startGame);
if (learnBtn) learnBtn.addEventListener('click', startLearnMode);
if (learnMenuBtn) learnMenuBtn.addEventListener('click', returnToStartScreen);
if (hintBtn) hintBtn.addEventListener('click', showHint);
if (answerBtn) answerBtn.addEventListener('click', revealAssistedAnswer);
if (pauseBtn) pauseBtn.addEventListener('click', openPauseOverlay);
if (pauseResumeBtn) pauseResumeBtn.addEventListener('click', resumeGame);
if (pauseRestartBtn) pauseRestartBtn.addEventListener('click', restartFromPause);
if (pauseFullscreenBtn) pauseFullscreenBtn.addEventListener('click', toggleFullscreen);
if (pauseSoundBtn) pauseSoundBtn.addEventListener('click', toggleMutedState);
if (pauseHelpBtn) pauseHelpBtn.addEventListener('click', () => toggleHelpPanel(pauseHelpBtn, pauseHelpPanel));
if (startFullscreenBtn) startFullscreenBtn.addEventListener('click', toggleFullscreen);
if (startSoundBtn) startSoundBtn.addEventListener('click', toggleMutedState);
if (startHelpBtn) startHelpBtn.addEventListener('click', () => toggleHelpPanel(startHelpBtn, startHelpPanel));

difficultyRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        updateDifficultyDescription(this.value);
    });
});

/* ========================================================
   MOBÄ°L PAN & ZOOM SÄ°STEMÄ°
   ======================================================== */

let scale = 1;
let translateX = 0;
let translateY = 0;
let baseViewBox = null;
let currentViewBox = null;

let MIN_SCALE = 1;
let MAX_SCALE = 6;

function updateScaleLimits() {
    if (window.innerWidth <= 768) {
        MIN_SCALE = window.innerWidth <= 420 ? 3.2 : 3;
        MAX_SCALE = 10;
    } else {
        MIN_SCALE = 1;
        MAX_SCALE = 6;
    }
}

function parseSvgViewBox() {
    if (!svgEl) return null;
    const values = (svgEl.getAttribute('viewBox') || '')
        .trim()
        .split(/\s+/)
        .map(Number);

    if (values.length !== 4 || values.some(value => !Number.isFinite(value))) {
        return null;
    }

    return {
        x: values[0],
        y: values[1],
        width: values[2],
        height: values[3]
    };
}

function ensureViewBoxState() {
    if (!svgEl) return false;
    if (!baseViewBox) baseViewBox = parseSvgViewBox();
    if (!baseViewBox) return false;
    if (!currentViewBox) currentViewBox = { ...baseViewBox };
    return true;
}

function setSvgViewBox(box) {
    if (!svgEl || !box) return;
    currentViewBox = { ...box };
    svgEl.setAttribute(
        'viewBox',
        `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`
    );
}

function applyTransform() {
    if (!svgEl) return;
    svgEl.style.transform = '';
    if (currentViewBox) setSvgViewBox(currentViewBox);
}

function clampCurrentViewBox() {
    if (!ensureViewBoxState()) return;
    const minX = baseViewBox.x;
    const minY = baseViewBox.y;
    const maxX = baseViewBox.x + baseViewBox.width - currentViewBox.width;
    const maxY = baseViewBox.y + baseViewBox.height - currentViewBox.height;

    currentViewBox.x = currentViewBox.width >= baseViewBox.width
        ? baseViewBox.x
        : Math.max(minX, Math.min(maxX, currentViewBox.x));
    currentViewBox.y = currentViewBox.height >= baseViewBox.height
        ? baseViewBox.y
        : Math.max(minY, Math.min(maxY, currentViewBox.y));
}

function getSvgPointFromClient(clientX, clientY) {
    if (!svgEl) return null;
    const matrix = svgEl.getScreenCTM();
    if (!matrix) return null;
    const point = svgEl.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
}

function getSvgPointFromMapPoint(originX, originY) {
    const rect = mapContainer.getBoundingClientRect();
    return getSvgPointFromClient(rect.left + originX, rect.top + originY);
}

function panViewBoxByScreenDelta(dx, dy) {
    if (!ensureViewBoxState()) return;
    const rect = mapContainer.getBoundingClientRect();
    const startPoint = getSvgPointFromClient(rect.left, rect.top);
    const endPoint = getSvgPointFromClient(rect.left + dx, rect.top + dy);

    if (!startPoint || !endPoint) return;

    currentViewBox.x -= endPoint.x - startPoint.x;
    currentViewBox.y -= endPoint.y - startPoint.y;
    clampCurrentViewBox();
    applyTransform();
}

function doZoom(newScale, originX, originY) {
    if (!ensureViewBoxState()) return;
    const old = scale;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    if (Math.abs(scale - old) < 0.0001) return;

    const origin = getSvgPointFromMapPoint(originX, originY);
    const anchorX = origin?.x ?? (currentViewBox.x + currentViewBox.width / 2);
    const anchorY = origin?.y ?? (currentViewBox.y + currentViewBox.height / 2);
    const width = baseViewBox.width / scale;
    const height = baseViewBox.height / scale;
    const zoomRatio = old / scale;

    currentViewBox = {
        x: anchorX - ((anchorX - currentViewBox.x) * zoomRatio),
        y: anchorY - ((anchorY - currentViewBox.y) * zoomRatio),
        width,
        height
    };

    clampCurrentViewBox();
    applyTransform();
    refreshZoomUI();
}

function resetZoom() {
    if (!ensureViewBoxState()) return;
    updateScaleLimits();
    scale = MIN_SCALE;
    translateX = 0;
    translateY = 0;
    const width = baseViewBox.width / scale;
    const height = baseViewBox.height / scale;
    currentViewBox = {
        x: baseViewBox.x + ((baseViewBox.width - width) / 2),
        y: baseViewBox.y + ((baseViewBox.height - height) / 2),
        width,
        height
    };
    clampCurrentViewBox();
    applyTransform();
    refreshZoomUI();
}

function refreshZoomUI() {
    if (zoomInBtn) zoomInBtn.disabled = scale >= MAX_SCALE;
    if (zoomOutBtn) zoomOutBtn.disabled = scale <= MIN_SCALE;
    if (zoomResetBtn) zoomResetBtn.style.opacity = scale > (MIN_SCALE + 0.01) ? '1' : '0.4';
}

/* --------------------------------------------------------
   TOUCH OLAYLARI (Mobil: pinch zoom + tek parmak pan + tap)
   -------------------------------------------------------- */

let touchStartX = 0, touchStartY = 0;
let touchLastX = 0, touchLastY = 0;
let pinchDist = null;
let touchMoved = false;

mapContainer.addEventListener('touchstart', e => {
    touchMoved = false;
    if (e.touches.length === 1) {
        touchStartX = touchLastX = e.touches[0].clientX;
        touchStartY = touchLastY = e.touches[0].clientY;
        pinchDist = null;
    } else if (e.touches.length === 2) {
        pinchDist = getPinchDist(e.touches[0], e.touches[1]);
    }
}, { passive: true });

mapContainer.addEventListener('touchmove', e => {
    e.preventDefault();

    if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchLastX;
        const dy = e.touches[0].clientY - touchLastY;

        if (Math.abs(e.touches[0].clientX - touchStartX) > INTERACTION_LIMITS.touchDragThresholdPx ||
            Math.abs(e.touches[0].clientY - touchStartY) > INTERACTION_LIMITS.touchDragThresholdPx) {
            touchMoved = true;
        }

        if (scale > 1 && touchMoved) {
            panViewBoxByScreenDelta(dx, dy);
        }

        touchLastX = e.touches[0].clientX;
        touchLastY = e.touches[0].clientY;
    } else if (e.touches.length === 2 && pinchDist !== null) {
        touchMoved = true;
        const newDist = getPinchDist(e.touches[0], e.touches[1]);
        const rect = mapContainer.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

        doZoom(scale * (newDist / pinchDist), midX, midY);
        pinchDist = newDist;
    }
}, { passive: false });

mapContainer.addEventListener('touchend', e => {
    if (e.touches.length === 0 && !touchMoved && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && gameActive && !gamePaused) {
            const clickedGroup = el.closest('g[data-iladi]');
            if (clickedGroup) handleCityClick(clickedGroup, getFramePoint(touch.clientX, touch.clientY));
        }
    }
    if (e.touches.length < 2) pinchDist = null;
}, { passive: true });

document.addEventListener('click', e => {
    const uiTarget = e.target.closest('button, label, input[type="radio"], input[type="checkbox"]');
    if (!uiTarget) return;
    if (uiTarget.closest('.cog-svg-turkiye-haritasi')) return;
    playSound('click');
});

function getPinchDist(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

/* --------------------------------------------------------
   MOUSE OLAYLARI (Desktop: tekerlek zoom + sÃ¼rÃ¼kle pan)
   -------------------------------------------------------- */

let mDragging = false;
let mLastX = 0, mLastY = 0;
let mStartX = 0, mStartY = 0;

mapContainer.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = mapContainer.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    doZoom(scale * (e.deltaY < 0 ? 1.15 : 0.87), ox, oy);
}, { passive: false });

mapContainer.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    mDragging = true;
    mouseWasDragged = false;
    mStartX = mLastX = e.clientX;
    mStartY = mLastY = e.clientY;
});

window.addEventListener('mousemove', e => {
    if (!mDragging || scale <= 1) return;
    const dx = e.clientX - mLastX;
    const dy = e.clientY - mLastY;
    if (Math.abs(e.clientX - mStartX) > INTERACTION_LIMITS.mouseDragThresholdPx || Math.abs(e.clientY - mStartY) > INTERACTION_LIMITS.mouseDragThresholdPx) {
        mouseWasDragged = true;
    }
    if (mouseWasDragged) {
        panViewBoxByScreenDelta(dx, dy);
    }
    mLastX = e.clientX;
    mLastY = e.clientY;
});

window.addEventListener('mouseup', () => {
    mDragging = false;
});

/* --------------------------------------------------------
   ZOOM BUTONLARI
   -------------------------------------------------------- */

zoomInBtn?.addEventListener('click', e => {
    e.stopPropagation();
    doZoom(scale * 1.6, mapContainer.clientWidth / 2, mapContainer.clientHeight / 2);
});

zoomOutBtn?.addEventListener('click', e => {
    e.stopPropagation();
    doZoom(scale / 1.6, mapContainer.clientWidth / 2, mapContainer.clientHeight / 2);
});

zoomResetBtn?.addEventListener('click', e => {
    e.stopPropagation();
    resetZoom();
});

/* --------------------------------------------------------
   MOBÄ°L Ä°PUCU
   -------------------------------------------------------- */

(function showMobileHint() {
    if (!('ontouchstart' in window)) return;
    if (!zoomHint) return;
    zoomHint.classList.add('cog-visible');
    setTimeout(() => zoomHint.classList.add('cog-hidden'), UI_TIMINGS.mobileHintFadeMs);
    setTimeout(() => zoomHint.classList.remove('cog-visible'), UI_TIMINGS.mobileHintHideMs);
})();

refreshZoomUI();

/* --------------------------------------------------------
   PORTAL ARAÃ‡LARI
   -------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    applyGameConfigText();
    buildMineLookup();
    initCities();
    updateRemainingUI();
    updateMissionText();
    scheduleHeaderLayoutUpdate();
    updateDifficultyDescription(document.querySelector('input[name="difficulty"]:checked')?.value || gameDifficulty);

    if (fsBtn && gameFrameShell) {
        fsBtn.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreenUI);
        document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
        document.addEventListener('msfullscreenchange', updateFullscreenUI);
    }

    setMutedState(false);
    updateFullscreenUI();
    setButtonIcon(pauseBtn, ICONS.settings, 'Ayarları aç', 'Ayarlar');
    setButtonIcon(startHelpBtn, ICONS.help, 'Yardımı aç', 'Yardım');
    setButtonIcon(pauseHelpBtn, ICONS.help, 'Yardımı aç', 'Yardım');

    if (gameFrameShell) {
        gameFrameShell.addEventListener('contextmenu', e => e.preventDefault());
    }

    setTimeout(() => {
        if (svgEl) {
            try {
                const bbox = svgEl.getBBox();
                const paddingX = bbox.width * 0.01;
                const paddingY = bbox.height * 0.01;
                const newX = bbox.x - paddingX;
                const newY = Math.max(0, bbox.y - paddingY);
                const newW = bbox.width + (paddingX * 2);
                const newH = bbox.height + (paddingY * 2);
                svgEl.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
                baseViewBox = parseSvgViewBox();
                currentViewBox = baseViewBox ? { ...baseViewBox } : null;
                resetZoom();
            } catch (e) {
                console.log('Harita kenar boÅŸluklarÄ± hesaplanÄ±rken kÃ¼Ã§Ã¼k bir hata oluÅŸtu:', e);
            }
        }
    }, UI_TIMINGS.initialViewBoxDelayMs);

    window.addEventListener('resize', () => {
        updateScaleLimits();
        if (scale < MIN_SCALE) resetZoom();
        else {
            clampCurrentViewBox();
            applyTransform();
            refreshZoomUI();
        }
        scheduleHeaderLayoutUpdate();
    });
});