let rainParticleSystem = null; 
let rainParticles = null;
let rainGeometry = null;
let maxRainCount = 50000;
let rainActiveCount = 10000;
let rainAudio = null; // <--- NOVO!
let rainSettings = {
    mode: 'off', // 'off', 'on', 'random'
    intensity: 50, // 0-100
    isRaining: false,
    lastRandomCheck: 0,
    randomCheckInterval: 10000 // 10 segundos
};

function initRain(scene) {
    rainGeometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    // Limites da cidade
    const area = 650; // metade do lado máximo da cidade
    const minY = 20, maxY = 120;

    for (let i = 0; i < maxRainCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(area * 2);
        const y = Math.random() * (maxY - minY) + minY;
        const z = THREE.MathUtils.randFloatSpread(area * 2);
        positions.push(x, y, z);
        velocities.push(0, - (Math.random() * 0.6 + 0.8), 0);
    }

    rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    rainGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    rainActiveCount = Math.floor(maxRainCount * rainSettings.intensity / 100);
    rainGeometry.setDrawRange(0, rainActiveCount);

    const rainMaterial = new THREE.PointsMaterial({
        color: 0x99ccff,
        size: 0.25,
        transparent: true,
        opacity: rainSettings.intensity / 100 * 0.55,
        depthWrite: false
    });

    rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    rainParticles.frustumCulled = false;
    rainParticles.visible = false;

    scene.add(rainParticles);
    rainParticleSystem = rainParticles;

    // ---------- SOM DA CHUVA -----------
    if (!rainAudio) {
        rainAudio = new Audio('/Dynamic-City-Quest/sounds/rain.mp3'); // ou rain.ogg
        rainAudio.loop = true;
        rainAudio.volume = rainSettings.intensity / 100; // volume inicial
        rainAudio.preload = 'auto';
        rainAudio.load();
    }
    // ------------------------------------

    setupRainControls();
}

function setupRainControls() {
    const rainModeSelect = document.getElementById('rainMode');
    const rainIntensitySlider = document.getElementById('rainIntensity');
    const rainIntensityValue = document.getElementById('rainIntensityValue');

    // Atualizar intensidade
    rainIntensitySlider.addEventListener('input', function() {
        rainSettings.intensity = parseInt(this.value);
        rainIntensityValue.textContent = this.value;
        updateRainIntensity();
        updateRainVisibility();
    });

    // Atualizar modo
    rainModeSelect.addEventListener('change', function() {
        rainSettings.mode = this.value;
        updateRainVisibility();
    });
}

function updateRainIntensity() {
    if (!rainParticles || !rainGeometry) return;
    rainActiveCount = Math.floor(maxRainCount * rainSettings.intensity / 100);
    rainGeometry.setDrawRange(0, rainActiveCount);
    rainParticles.material.opacity = Math.max(0.2, rainSettings.intensity / 100 * 0.55);

    // -------- SOM DA CHUVA --------
    if (rainAudio) {
        rainAudio.volume = rainSettings.intensity / 100;
    }
    // ------------------------------
}

function updateRainVisibility() {
    if (!rainParticles) return;

    let raining = false;
    switch (rainSettings.mode) {
        case 'on':
            rainParticles.visible = true;
            rainSettings.isRaining = true;
            raining = true;
            break;
        case 'off':
            rainParticles.visible = false;
            rainSettings.isRaining = false;
            raining = false;
            break;
        case 'random':
            const now = Date.now();
            if (now - rainSettings.lastRandomCheck > rainSettings.randomCheckInterval) {
                rainSettings.isRaining = Math.random() > 0.5;
                rainSettings.lastRandomCheck = now;
            }
            rainParticles.visible = rainSettings.isRaining;
            raining = rainSettings.isRaining;
            break;
    }

    // -------- SOM DA CHUVA --------
    if (rainAudio) {
        if (raining) {
            if (rainAudio.paused) rainAudio.play();
        } else {
            rainAudio.pause();
            rainAudio.currentTime = 0; // recomeça do início ao voltar a chover
        }
    }
    // -----------------------------
}

function updateRain() {
    if (!rainParticles || !rainParticles.visible) return;

    const posAttr = rainParticles.geometry.getAttribute('position');
    const velAttr = rainParticles.geometry.getAttribute('velocity');
    for (let i = 0; i < rainActiveCount; i++) {
        let y = posAttr.getY(i);
        let v = velAttr.getY(i);
        const speedMultiplier = 0.8 + 0.7 * rainSettings.intensity / 100;
        y += v * speedMultiplier;
        if (y < 1) {
            y = Math.random() * 100 + 50;
            posAttr.setX(i, THREE.MathUtils.randFloatSpread(650 * 2));
            posAttr.setZ(i, THREE.MathUtils.randFloatSpread(650 * 2));
        }
        posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
}

// Exportar funções
window.initRain = initRain;
window.updateRain = updateRain;
