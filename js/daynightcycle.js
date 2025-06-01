const DAY_DURATION = 60; // segundos para um ciclo completo
let timeOfDay = 0;       
let starField = null;
let sunMesh = null, moonMesh = null;
let previousTime = performance.now();
let isTimePaused = false;

// Luzes principais
let sunLight, moonLight, ambientLight;

// Para não carregar várias vezes as texturas
let sunTexture, moonTexture;

// Função para atualizar o display de tempo
function updateTimeDisplay() {
    const hours = Math.floor(timeOfDay * 24);
    const minutes = Math.floor((timeOfDay * 24 * 60) % 60);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    document.getElementById('timeDisplay').textContent = timeString;
}

// Função para atualizar o slider
function updateTimeSlider() {
    const slider = document.getElementById('timeSlider');
    slider.value = timeOfDay * 24;
}


// Função para pausar o tempo
function pauseTime() {
    isTimePaused = true;
    document.getElementById('pauseTimeBtn').style.display = 'none';
    document.getElementById('resumeTimeBtn').style.display = 'inline-block';
}

// Função para retomar o tempo
function resumeTime() {
    isTimePaused = false;
    previousTime = performance.now();
    document.getElementById('pauseTimeBtn').style.display = 'inline-block';
    document.getElementById('resumeTimeBtn').style.display = 'none';
}

// Função para definir o tempo manualmente
function setTime(value) {
    timeOfDay = value / 24;
    updateTimeDisplay();
}

// Inicializar controles
function initTimeControls() {
    const slider = document.getElementById('timeSlider');
    const pauseButton = document.getElementById('pauseTimeBtn');
    const resumeButton = document.getElementById('resumeTimeBtn');

    // Evento do slider
    slider.addEventListener('input', (e) => {
        setTime(e.target.value);
    });

    // Eventos dos botões
    pauseButton.addEventListener('click', pauseTime);
    resumeButton.addEventListener('click', resumeTime);

    // Inicializar display
    updateTimeDisplay();
    updateTimeSlider();
}

// Função de inicialização: chama no início do teu setup, passando scene
function initDayNightCycle(scene) {
    // Sol (DirectionalLight)
    sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.castShadow = true;
    
    // Configurações de sombra do sol
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.05;
    sunLight.shadow.radius = 1.5;
    
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Lua (DirectionalLight)
    moonLight = new THREE.DirectionalLight(0x9999ff, 0.2);
    scene.add(moonLight);
    scene.add(moonLight.target);

    // Luz ambiente
    ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Estrelas
    createStars(scene);

    // Carregar texturas do sol e da lua
    const loader = new THREE.TextureLoader();
    sunTexture = loader.load('./textures/sun.png', () => {
        // Sol visível
        const geometry = new THREE.PlaneGeometry(60, 60); 
        const material = new THREE.MeshBasicMaterial({ 
            map: sunTexture, 
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,    // Não escreve no depth buffer
            depthTest: true       // Testa profundidade para ser ocultado por edifícios
        });
        sunMesh = new THREE.Mesh(geometry, material);
        sunMesh.rotation.x = -Math.PI / 2; 
        sunMesh.renderOrder = 999;
        scene.add(sunMesh);
        updateCelestialMeshes();
    });

    moonTexture = loader.load('./textures/moon.png', () => {
        // Lua visível
        const geometry = new THREE.PlaneGeometry(40, 40); 
        const material = new THREE.MeshBasicMaterial({ 
            map: moonTexture, 
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,    // Não escreve no depth buffer
            depthTest: true       // Testa profundidade para ser ocultado por edifícios
        });
        moonMesh = new THREE.Mesh(geometry, material);
        moonMesh.rotation.x = -Math.PI / 2; 
        moonMesh.renderOrder = 998;
        scene.add(moonMesh);
        updateCelestialMeshes();
    });

    // Inicializar controles
    initTimeControls();
}

// Chama dentro do loop animate()
function updateDayNightCycle(scene) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;

    // Atualizar hora do dia apenas se não estiver pausado
    if (!isTimePaused) {
        timeOfDay += deltaTime / DAY_DURATION;
        if (timeOfDay > 1) timeOfDay -= 1;
        
        // Atualizar controles
        updateTimeDisplay();
        updateTimeSlider();
    }

    updateSunAndMoon(scene);
    updateSkyColor(scene);
    updateStarVisibility();
    updateLighting();
    updateCelestialMeshes();
    updateLampLights();
}

// Atualiza a posição e intensidade do sol e da lua
function updateSunAndMoon(scene) {
    const angle = (timeOfDay * 2 * Math.PI) - Math.PI / 2;
    const radius = 1000;

    // Sol
    const sunPos = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
    );
    sunLight.position.copy(sunPos);
    sunLight.target.position.set(0, 0, 0);

    // Ajustar intensidade e sombras baseado na altura do sol
    const sunHeight = Math.max(0, sunPos.y / radius);
    sunLight.intensity = sunHeight;
    
    const maxCitySize = 600; // ajusta conforme o tamanho máximo da tua cidade
    sunLight.shadow.camera.left = -maxCitySize;
    sunLight.shadow.camera.right = maxCitySize;
    sunLight.shadow.camera.top = maxCitySize;
    sunLight.shadow.camera.bottom = -maxCitySize;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 2000; // garante que o sol cobre todo o terreno, mesmo à noite
    sunLight.shadow.bias = -0.0001;
    sunLight.shadow.normalBias = 0.02;
    sunLight.shadow.radius = 1.5;
    sunLight.shadow.camera.updateProjectionMatrix();


    // Lua (lado oposto)
    const moonPos = sunPos.clone().negate();
    moonLight.position.copy(moonPos);
    moonLight.target.position.set(0, 0, 0);

    // Intensidade da lua
    moonLight.intensity = Math.max(0, moonPos.y / radius) * 0.4;
}

function updateCelestialMeshes() {
    if (sunMesh && moonMesh) {
        const angle = (timeOfDay * 2 * Math.PI) - Math.PI / 2;

        const ellipseA = 170; // raio horizontal (mais largo)
        const ellipseB = 60;  // raio vertical (menos alto)

        // ---- SUN ----
        const sunX = Math.cos(angle) * ellipseA;
        const sunY = Math.sin(angle) * ellipseB;
        sunMesh.position.set(sunX, sunY, 0);

        sunMesh.lookAt(0, 0, 0);

        // Inclinação Z baseada na altura
        let tSun = THREE.MathUtils.clamp(Math.abs(sunY) / ellipseB, 0, 1);
        let tiltSun = THREE.MathUtils.lerp(0, Math.PI/2, tSun);
        sunMesh.rotation.z += (sunY >= 0) ? tiltSun : -tiltSun;

        const sunVisibility = Math.max(0, Math.min(1, (sunY + 10) / 20));
        sunMesh.material.opacity = sunVisibility;
        sunMesh.visible = sunY > -10;

        // ---- MOON ----
        const moonX = -Math.cos(angle) * ellipseA;
        const moonY = -Math.sin(angle) * ellipseB;
        moonMesh.position.set(moonX, moonY, 0);

        moonMesh.lookAt(0, 0, 0);

        let tMoon = THREE.MathUtils.clamp(Math.abs(moonY) / ellipseB, 0, 1);
        let tiltMoon = THREE.MathUtils.lerp(0, Math.PI/2, tMoon);
        moonMesh.rotation.z += (moonY >= 0) ? tiltMoon : -tiltMoon;

        const moonVisibility = Math.max(0, Math.min(1, (moonY + 10) / 20));
        moonMesh.material.opacity = moonVisibility;
        moonMesh.visible = moonY > -10;
    }
}

// Cores do céu
function updateSkyColor(scene) {
    let skyColor = new THREE.Color();

    if (timeOfDay < 0.20 || timeOfDay > 0.82) {
        // Noite
        skyColor.setRGB(0.03, 0.04, 0.11);
    } else if (timeOfDay < 0.28) {
        // Amanhecer
        const t = (timeOfDay - 0.20) / (0.08);
        skyColor.lerpColors(
            new THREE.Color(0.03, 0.04, 0.11),
            new THREE.Color(0.75, 0.50, 0.25), t
        );
    } else if (timeOfDay < 0.72) {
        // Dia
        const t = (timeOfDay - 0.28) / (0.44);
        skyColor.lerpColors(
            new THREE.Color(0.75, 0.50, 0.25),
            new THREE.Color(0.55, 0.78, 1.0), t
        );
    } else {
        // Entardecer
        const t = (timeOfDay - 0.72) / (0.10);
        skyColor.lerpColors(
            new THREE.Color(0.55, 0.78, 1.0),
            new THREE.Color(0.03, 0.04, 0.11), t
        );
    }

    scene.background = skyColor;
    if (scene.fog) {
        scene.fog.color = skyColor;
    }
}

// Estrelas (partículas)
function createStars(scene) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let i = 0; i < 1500; i++) {
        const x = THREE.MathUtils.randFloatSpread(600);
        const y = THREE.MathUtils.randFloat(80, 300);
        const z = THREE.MathUtils.randFloatSpread(600);
        vertices.push(x, y, z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 });
    starField = new THREE.Points(geometry, material);
    scene.add(starField);
}

// Mostra estrelas só de noite
function updateStarVisibility() {
    if (!starField) return;
    // Só aparece das 19h às 5h
    const night = (timeOfDay < 0.20 || timeOfDay > 0.82);
    starField.visible = night;
}

// Luz ambiente
function updateLighting() {
    // Luz ambiente do dia/noite com transição mais suave
    const t = Math.max(0, Math.sin(timeOfDay * Math.PI));
    ambientLight.intensity = 0.2 + t * 0.8; // Aumentado o contraste entre dia e noite
    
    // Cor da luz ambiente varia com o ciclo
    const hue = 0.6 + (t * 0.1); // Variação sutil do tom
    const saturation = 0.3 + (t * 0.2); // Mais saturado durante o dia
    const lightness = 0.3 + (t * 0.5); // Mais claro durante o dia
    ambientLight.color.setHSL(hue, saturation, lightness);
}

// Exportar funções para uso no teu código principal
window.initDayNightCycle = initDayNightCycle;
window.updateDayNightCycle = updateDayNightCycle;

// Exportar funções adicionais
window.pauseTime = pauseTime;
window.resumeTime = resumeTime;
window.setTime = setTime;
