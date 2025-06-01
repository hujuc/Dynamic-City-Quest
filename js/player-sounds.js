// Sons do jogador
let footstepAudios = [];
let currentFootstepIndex = 0;
let isMoving = false;
let lastFootstepTime = 0;
const FOOTSTEP_INTERVAL = 500; // Intervalo entre passos em milissegundos

// Lista de sons de passos
const FOOTSTEP_SOUNDS = [
    'sounds/footsteps1.mp3',
    'sounds/footsteps2.mp3',
    'sounds/footsteps3.mp3',
    'sounds/footsteps4.mp3'
];

function initPlayerSounds() {
    // Inicializar todos os sons de passos
    FOOTSTEP_SOUNDS.forEach(soundPath => {
        const audio = new Audio(soundPath);
        audio.volume = 0.5;
        audio.preload = 'auto';
        audio.load();
        footstepAudios.push(audio);
    });
}

function updateFootsteps(moveForward, moveBackward, moveLeft, moveRight) {
    // Só tocar sons de passos no modo primeira pessoa
    if (cameraViews.currentMode !== cameraViews.modes.FIRST_PERSON) {
        stopFootsteps();
        return;
    }

    // Verificar se o jogador está se movendo
    const isMovingNow = moveForward || moveBackward || moveLeft || moveRight;
    
    // Se o estado de movimento mudou
    if (isMovingNow !== isMoving) {
        isMoving = isMovingNow;
        if (!isMoving) {
            stopFootsteps();
        }
    }

    // Se estiver se movendo, tocar os passos
    if (isMoving) {
        const now = Date.now();
        if (now - lastFootstepTime >= FOOTSTEP_INTERVAL) {
            playFootstep();
            lastFootstepTime = now;
        }
    }
}

function playFootstep() {
    if (footstepAudios.length === 0) return;

    // Escolher um som aleatório diferente do atual
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * footstepAudios.length);
    } while (newIndex === currentFootstepIndex && footstepAudios.length > 1);
    
    currentFootstepIndex = newIndex;
    const footstepAudio = footstepAudios[currentFootstepIndex];

    // Reiniciar o som se já estiver tocando
    if (!footstepAudio.paused) {
        footstepAudio.currentTime = 0;
    }
    
    footstepAudio.play().catch(error => {
        console.log('Erro ao tocar som de passos:', error);
    });
}

function stopFootsteps() {
    // Parar todos os sons de passos
    footstepAudios.forEach(audio => {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

// Exportar funções
window.initPlayerSounds = initPlayerSounds;
window.updateFootsteps = updateFootsteps;
window.stopFootsteps = stopFootsteps; 