// Variáveis globais
let scene, camera, renderer;
let cityObjects = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let terrain = null;
let heightData = null;

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
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Adicionar luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    
    // Configurar sombras
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -250;
    directionalLight.shadow.camera.right = 250;
    directionalLight.shadow.camera.bottom = -250;
    directionalLight.shadow.camera.top = 250;
    
    scene.add(directionalLight);
    
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

// Loop de animação
function animate() {
    requestAnimationFrame(animate);
    
    // Controle de movimento
    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    
    // Atualizar movimento da câmera
    updateCameraMovement(delta);
    
    prevTime = time;
    
    // Renderizar
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