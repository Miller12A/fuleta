(() => {
    // ========== DOM Elements ==========
    const numberInput = document.getElementById('numberInput');
    const entryCount = document.getElementById('entryCount');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const wheelCanvas = document.getElementById('wheelCanvas');
    const ctx = wheelCanvas.getContext('2d');
    const spinBtn = document.getElementById('spinBtn');
    const spinCountEl = document.getElementById('spinCount');
    const resultModal = document.getElementById('resultModal');
    const winnerNumber = document.getElementById('winnerNumber');
    const deleteNumberBtn = document.getElementById('deleteNumberBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const confettiContainer = document.getElementById('confetti');

    // ========== State ==========
    let numbers = [];
    let spinCount = 0;
    let isSpinning = false;
    let currentRotation = 0;
    let lastWinnerIndex = -1;

    // Wheel segment colors - vibrant, high-contrast palette
    const COLORS = [
        '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6',
        '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
        '#e11d48', '#2563eb', '#eab308', '#059669', '#7c3aed',
        '#d946ef', '#0891b2', '#ea580c', '#4f46e5', '#0d9488',
        '#be123c', '#1d4ed8', '#ca8a04', '#047857', '#6d28d9',
        '#c026d3', '#0e7490', '#c2410c', '#4338ca', '#0f766e'
    ];

    const MAX_WHEEL_SEGMENTS = 60;

    // ========== Canvas DPI Setup ==========
    function setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = wheelCanvas.getBoundingClientRect();
        wheelCanvas.width = rect.width * dpr;
        wheelCanvas.height = rect.height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    // ========== Textarea: Parse & Count ==========
    function parseNumbers() {
        const raw = numberInput.value.trim();
        if (!raw) {
            numbers = [];
            entryCount.textContent = '0';
            updateUI();
            drawWheel();
            return;
        }
        const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
        const unique = [...new Set(lines)].slice(0, 1000);
        numbers = unique;
        entryCount.textContent = numbers.length;
        updateUI();
        drawWheel();
    }

    numberInput.addEventListener('input', parseNumbers);

    // ========== UI State Updates ==========
    function updateUI() {
        spinBtn.disabled = numbers.length < 2;
        entryCount.textContent = numbers.length;
    }

    // ========== Load Sample Data ==========
    loadSampleBtn.addEventListener('click', () => {
        const sample = Array.from({ length: 30 }, (_, i) => i + 1);
        if (!sample.includes(97)) sample.push(97);
        numberInput.value = sample.join('\n');
        parseNumbers();
    });

    // ========== Clear All ==========
    clearAllBtn.addEventListener('click', () => {
        numberInput.value = '';
        spinCount = 0;
        spinCountEl.textContent = '0';
        lastWinnerIndex = -1;
        currentRotation = 0;
        parseNumbers();
    });

    // ========== Build Wheel Labels ==========
    // Returns an array of label strings for each visual segment on the wheel.
    // If overrideIndex is provided, that segment gets overrideLabel instead of the
    // default mapping — this is how we guarantee the pointer always matches the winner.
    function buildWheelLabels(overrideVisualIndex, overrideLabel) {
        const count = numbers.length;
        const segmentsToDraw = count <= MAX_WHEEL_SEGMENTS ? count : MAX_WHEEL_SEGMENTS;
        const labels = [];

        for (let i = 0; i < segmentsToDraw; i++) {
            if (i === overrideVisualIndex && overrideLabel !== undefined) {
                labels.push(overrideLabel);
            } else if (count <= MAX_WHEEL_SEGMENTS) {
                labels.push(numbers[i]);
            } else {
                if (i < MAX_WHEEL_SEGMENTS - 1) {
                    const idx = Math.floor(i * count / segmentsToDraw);
                    labels.push(numbers[idx]);
                } else {
                    labels.push('+');
                }
            }
        }
        return labels;
    }

    // ========== Draw Wheel ==========
    function drawWheel(targetAngleDeg, wheelLabels) {
        const rect = wheelCanvas.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const cx = W / 2;
        const cy = H / 2;
        const radius = Math.min(cx, cy) - 8;

        ctx.clearRect(0, 0, W, H);

        if (numbers.length === 0) {
            drawEmptyState(cx, cy, radius);
            return;
        }

        const count = numbers.length;
        const segmentsToDraw = count <= MAX_WHEEL_SEGMENTS ? count : MAX_WHEEL_SEGMENTS;
        const sliceAngle = (2 * Math.PI) / segmentsToDraw;

        // Use provided labels or build default ones
        const labels = wheelLabels || buildWheelLabels();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((targetAngleDeg || 0) * Math.PI / 180);

        for (let i = 0; i < segmentsToDraw; i++) {
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text label
            const midAngle = startAngle + sliceAngle / 2;
            const textRadius = radius * 0.65;
            const tx = Math.cos(midAngle) * textRadius;
            const ty = Math.sin(midAngle) * textRadius;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(midAngle + Math.PI / 2);

            const fontSize = segmentsToDraw <= 20 ? 13 : segmentsToDraw <= 40 ? 10 : 8;
            ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(labels[i]), 0, 0);

            ctx.restore();
        }

        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, radius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
    }

    function drawEmptyState(cx, cy, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f9fafb';
        ctx.fill();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Agrega numeros para', cx, cy - 10);
        ctx.fillText('llenar la ruleta', cx, cy + 12);
        ctx.restore();
    }

    // ========== Spin Logic ==========
    spinBtn.addEventListener('click', spinWheel);

    function spinWheel() {
        if (isSpinning || numbers.length < 2) return;
        isSpinning = true;
        spinBtn.disabled = true;

        spinCount++;
        spinCountEl.textContent = spinCount;

        let winnerIndex;

        // ====================================================================
        // *** TRUCO DEL 10o GIRO ***
        // Giros 1-9:  EXCLUIDO el 97, el ganador es aleatorio entre el resto.
        // Giro  10:   OBLIGATORIAMENTE sale el 97 (si existe en la lista).
        // Giros 11+:  Completamente aleatorios (el 97 puede volver a salir).
        // ====================================================================
        const forcedValue = '97';
        const idx97 = numbers.indexOf(forcedValue);

        if (spinCount === 10) {
            // Giro 10: forzar el 97
            if (idx97 !== -1) {
                winnerIndex = idx97;
            } else {
                winnerIndex = Math.floor(Math.random() * numbers.length);
            }
        } else if (spinCount < 10 && idx97 !== -1 && numbers.length > 1) {
            // Giros 1-9: elegir aleatorio pero SIN el 97
            const candidates = numbers.map((val, i) => ({ val, i })).filter(x => x.val !== forcedValue);
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            winnerIndex = pick.i;
        } else {
            // Giros 11+: completamente aleatorio
            winnerIndex = Math.floor(Math.random() * numbers.length);
        }
        // ====================================================================
        // FIN DEL TRUCO DEL 10o GIRO
        // ====================================================================

        lastWinnerIndex = winnerIndex;
        const winnerValue = numbers[winnerIndex];

        const count = numbers.length;
        const segmentsToDraw = count <= MAX_WHEEL_SEGMENTS ? count : MAX_WHEEL_SEGMENTS;
        const sliceAngle = 360 / segmentsToDraw;

        // Map winnerIndex to the visual segment where the pointer should land
        let visualIndex;
        if (count <= MAX_WHEEL_SEGMENTS) {
            visualIndex = winnerIndex;
        } else {
            visualIndex = Math.floor(winnerIndex * segmentsToDraw / count);
        }

        // Build wheel labels with the winner's value forced onto the target segment
        // This guarantees the pointer and the modal ALWAYS show the same number
        const wheelLabels = buildWheelLabels(visualIndex, winnerValue);

        // Calculate target rotation so the pointer (at top center) lands on the winner segment.
        // Segment visualIndex midpoint angle: (visualIndex + 0.5) * sliceAngle
        const segmentMidAngle = (visualIndex + 0.5) * sliceAngle;

        // Pointer is at 270 degrees (top). We rotate the wheel so that segment's
        // midpoint aligns with the pointer.
        const baseTarget = 270 - segmentMidAngle;

        // Always ensure a MINIMUM rotation from current position (at least 5 full spins).
        // This prevents the bug where accumulated currentRotation makes deltas tiny.
        const targetAngle = currentRotation + 5 * 360 + ((baseTarget - (currentRotation % 360)) + 360) % 360;

        const startRotation = currentRotation;
        const totalDelta = targetAngle - startRotation;
        const duration = 4000 + Math.random() * 1000;
        const startTime = performance.now();

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);

            currentRotation = startRotation + totalDelta * eased;
            drawWheel(currentRotation, wheelLabels);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                currentRotation = currentRotation % 360;
                isSpinning = false;
                spinBtn.disabled = false;
                updateUI();
                showResult(winnerValue);
            }
        }

        requestAnimationFrame(animate);
    }

    // ========== Show Result Modal ==========
    function showResult(value) {
        winnerNumber.textContent = value;
        resultModal.classList.remove('hidden');
        spawnConfetti();
    }

    // ========== Confetti ==========
    function spawnConfetti() {
        confettiContainer.innerHTML = '';
        const confettiColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.top = '-10px';
            piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            piece.style.animationDelay = (Math.random() * 1.5) + 's';
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confettiContainer.appendChild(piece);
        }
    }

    // ========== Modal Controls ==========
    closeModalBtn.addEventListener('click', () => {
        resultModal.classList.add('hidden');
    });

    deleteNumberBtn.addEventListener('click', () => {
        const val = winnerNumber.textContent;
        const idx = numbers.indexOf(val);
        if (idx !== -1) {
            numbers.splice(idx, 1);
            numberInput.value = numbers.join('\n');
            entryCount.textContent = numbers.length;

            if (numbers.length < 2) {
                spinCount = 0;
                spinCountEl.textContent = '0';
            }

            updateUI();
            drawWheel();
        }
        resultModal.classList.add('hidden');
    });

    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            resultModal.classList.add('hidden');
        }
    });

    // ========== Initialize ==========
    function init() {
        setupCanvas();
        drawWheel();
        updateUI();
    }

    window.addEventListener('resize', () => {
        setupCanvas();
        drawWheel(currentRotation);
    });

    init();
})();
