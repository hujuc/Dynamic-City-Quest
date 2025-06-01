// Variáveis globais
let scene, camera, renderer;
let cityObjects = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let terrain = null;
let heightData = null;
let headBobTimer = 0;
let headBobActive = false;

// Variáveis para controle da câmera
let cameraRotation = {
    x: 0,  // pitch (olhar para cima/baixo)
    y: 0   // yaw (olhar para esquerda/direita)
};

// Inicializar Three.js
function init() {
    // Criar cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Céu azul
    
    // Criar câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 30);
    
    // Definir rotação inicial da câmera
    cameraRotation.x = 0;
    cameraRotation.y = 0;
    camera.quaternion.setFromEuler(
        new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, 'YXZ')
    );
    
    // Criar renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Adicionar luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Inicializar o ciclo dia/noite
    initDayNightCycle(scene);
    initRain(scene);
    initPlayerSounds(); // Inicializar sons do jogador

    // Configurar UI
    setupUI();
    
    // Configurar controles de movimento
    setupControls();
    
    // Configurar controles de vista
    setupViewControls();
    
    // Configurar o botão de geração
    document.getElementById('generateBtn').addEventListener('click', generateCity);
    
    // Gerenciar redimensionamento da janela
    window.addEventListener('resize', onWindowResize);
    
    // Criar terreno plano inicial
    createFlatTerrain();
    
    // Inicializar o corpo do jogador
    initPlayerBody();
    
    // Iniciar loop de animação
    animate();
    
    // Aviso para os controles
    document.getElementById('container').addEventListener('click', function() {
        document.getElementById('container').requestPointerLock();
    });
}

// Redimensionar quando a janela for redimensionada
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let previousCameraPosition = new THREE.Vector3();

function updateHeadBob(delta) {
    // Só ativa em primeira pessoa e se estiver a andar
    if (isFirstPersonMode() && (moveForward || moveBackward || moveLeft || moveRight)) {
        headBobActive = true;
        // Controla a velocidade do efeito (ajusta o * 8 se quiseres mais rápido/lento)
        headBobTimer += delta * 8;
        // Amplitude do bob (vertical)
        const amplitude = 0.05; // 0.05 unidades = 5cm (ajusta à tua escala)
        const bobOffset = Math.sin(headBobTimer) * amplitude;
        
        // Guarda a posição base (sem bob)
        let baseY = 2; // altura padrão da câmara (ajusta se usares outro valor)

        if (heightData) {
            baseY = getTerrainHeight(camera.position.x, camera.position.z) + 2;
        }
        camera.position.y = baseY + bobOffset;
    } else {
        headBobActive = false;
        headBobTimer = 0;

        // Voltar para o valor base (caso pare de andar)
        let baseY = 2;
        if (heightData) {
            baseY = getTerrainHeight(camera.position.x, camera.position.z) + 2;
        }
        camera.position.y = baseY;
    }
}


// Loop de animação
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // Guardar posição anterior da câmara só no modo primeira pessoa
    if (isFirstPersonMode()) {
        previousCameraPosition.copy(camera.position);
    }

    // Atualizar movimento e física
    updateCameraMovement(delta);
    updateHeadBob(delta);

    updatePlayerBody();
    updateFootsteps(moveForward, moveBackward, moveLeft, moveRight); // Atualizar sons de passos

    // Verificar colisões
    if (
        isFirstPersonMode() &&
        (
            isCameraCollidingWithTrees(camera.position) ||
            isCameraCollidingWithParkObjects(camera.position) ||
            isCameraCollidingWithLakeStones(camera.position) ||
            isCameraCollidingWithBuildings(camera.position)
        )
    ) {
        camera.position.copy(previousCameraPosition);
    }
    
    updateDayNightCycle(scene);
    updateRain();

    prevTime = time;
    renderer.render(scene, camera);

}


// Iniciar
window.addEventListener('load', init);

function adjustCameraToTerrain() {
    // Se estivermos no modo primeira pessoa, ajustar para o terreno
    if (cameraViews && cameraViews.currentMode === cameraViews.modes.FIRST_PERSON) {
        if (heightData) {
            const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
            camera.position.y = terrainY + 2; // 2 unidades acima do terreno
        } else {
            camera.position.y = 2; // 2 unidades acima do chão plano
        }
    }
}