// Configurações de vistas da câmera
let cameraViews = {
    // Define os diferentes modos de câmera
    modes: {
        FIRST_PERSON: 'firstPerson',  // Câmera presa ao chão (novo modo default)
        FLY: 'fly',                  // Câmera livre para voar
        AERIAL: 'aerial'             // Vista aérea
    },
    // Modo atual da câmera
    currentMode: 'firstPerson',
    // Armazena a posição e rotação da câmera antes de mudar para outros modos
    savedView: {
        position: new THREE.Vector3(),
        rotation: {x: 0, y: 0}
    },
    // Flag para indicar se estamos na vista aérea (para compatibilidade)
    isAerialView: false
};

// Mudar para vista aérea
function switchToAerialView() {
    // Salvar posição e rotação atuais
    saveCurrentCameraState();
    
    // Mudar para o modo aéreo
    cameraViews.currentMode = cameraViews.modes.AERIAL;
    cameraViews.isAerialView = true;
    
    // Descobrir o centro da cidade e a altura apropriada
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const streetWidth = parseInt(document.getElementById('streetWidth').value);
    const buildingSize = parseInt(document.getElementById('buildingSize').value);
    
    // Calcular tamanho total da cidade
    const blockSize = buildingSize * 3; // 3x3 edifícios por bloco
    const totalSize = (gridSize * blockSize) + ((gridSize + 1) * streetWidth);
    
    // Posicionar a câmera acima do centro da cidade
    const height = totalSize * 0.8; // Altura baseada no tamanho da cidade
    camera.position.set(0, height, 0);
    
    // Apontar a câmera para baixo
    cameraRotation.x = -Math.PI / 2; // Olhar diretamente para baixo
    cameraRotation.y = 0;
    
    camera.quaternion.setFromEuler(
        new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, 'YXZ')
    );
    
    // Atualizar UI
    updateCameraButtonsUI();
    
    // Desabilitar o controle de pointerlock
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

// Mudar para o modo de voo livre
function switchToFlyMode() {
    // Se estiver no modo aéreo, salvar aquela posição também
    if (cameraViews.currentMode === cameraViews.modes.AERIAL) {
        saveCurrentCameraState();
    }
    
    // Mudar para o modo de voo
    cameraViews.currentMode = cameraViews.modes.FLY;
    cameraViews.isAerialView = false;
    
    // Se não estiver no modo aéreo, não precisamos mudar a câmera de lugar
    // apenas atualizar o estado do modo
    
    // Atualizar UI
    updateCameraButtonsUI();
}

// Mudar para o modo primeira pessoa (preso ao chão)
function switchToFirstPersonMode() {
    // Se estiver no modo aéreo, voltar para a posição salva
    if (cameraViews.currentMode === cameraViews.modes.AERIAL) {
        camera.position.copy(cameraViews.savedView.position);
        cameraRotation.x = cameraViews.savedView.rotation.x;
        cameraRotation.y = cameraViews.savedView.rotation.y;
        
        camera.quaternion.setFromEuler(
            new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, 'YXZ')
        );
    }
    
    // Ajustar a altura da câmera para ficar no nível do chão
    if (heightData) {
        const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
        camera.position.y = terrainY + 2; // 2 unidades acima do terreno
    } else {
        camera.position.y = 2; // 2 unidades acima do chão plano
    }
    
    // Mudar para o modo primeira pessoa
    cameraViews.currentMode = cameraViews.modes.FIRST_PERSON;
    cameraViews.isAerialView = false;
    
    // Atualizar UI
    updateCameraButtonsUI();
}

// Função auxiliar para salvar o estado atual da câmera
function saveCurrentCameraState() {
    cameraViews.savedView.position.copy(camera.position);
    cameraViews.savedView.rotation.x = cameraRotation.x;
    cameraViews.savedView.rotation.y = cameraRotation.y;
}

// Atualizar a interface dos botões de câmera
function updateCameraButtonsUI() {
    document.getElementById('firstPersonBtn').classList.remove('active-camera');
    document.getElementById('flyBtn').classList.remove('active-camera');
    document.getElementById('aerialViewBtn').classList.remove('active-camera');

    // Destacar o botão ativo
    switch (cameraViews.currentMode) {
        case cameraViews.modes.FIRST_PERSON:
            document.getElementById('firstPersonBtn').classList.add('active-camera');
            break;
        case cameraViews.modes.FLY:
            document.getElementById('flyBtn').classList.add('active-camera');
            break;
        case cameraViews.modes.AERIAL:
            document.getElementById('aerialViewBtn').classList.add('active-camera');
            break;
    }
}

// Configurar eventos dos botões de câmera
function setupViewControls() {
    document.getElementById('aerialViewBtn').addEventListener('click', switchToAerialView);
    document.getElementById('firstPersonBtn').addEventListener('click', switchToFirstPersonMode);
    document.getElementById('flyBtn').addEventListener('click', switchToFlyMode);
    
    // Iniciar no modo primeira pessoa e ajustar a câmera para o chão
    cameraViews.currentMode = cameraViews.modes.FIRST_PERSON;
    
    // Posicionar a câmera no chão desde o início
    if (heightData) {
        const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
        camera.position.y = terrainY + 2;
    } else {
        camera.position.y = 2; // 2 unidades acima do chão plano
    }
    
    updateCameraButtonsUI();
}

// Função para verificar se a câmera está no modo primeira pessoa
function isFirstPersonMode() {
    return cameraViews.currentMode === cameraViews.modes.FIRST_PERSON;
}

// Função para verificar se a câmera está no modo de voo
function isFlyMode() {
    return cameraViews.currentMode === cameraViews.modes.FLY;
}