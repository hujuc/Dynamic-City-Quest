// Gerenciamento do corpo do jogador
let playerBody = null;
let playerVisible = false;
let isBodyFixed = false; // Nova variável para controlar se o corpo está fixo
let fixedBodyPosition = new THREE.Vector3(); // Posição onde o corpo foi fixado

// Criar o corpo do jogador
function createPlayerBody() {
    // Criar um grupo para o corpo
    const bodyGroup = new THREE.Group();
    
    // Criar o torso (cilindro)
    const torsoGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.y = 0.6; // Meio do torso
    bodyGroup.add(torso);
    
    // Criar a cabeça (esfera)
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2; // Topo do torso
    head.name = 'head'; // Adicionar nome para identificação
    bodyGroup.add(head);
    
    // Criar braços
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff });
    
    // Braço esquerdo
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.6, 0);
    leftArm.rotation.z = Math.PI / 2;
    bodyGroup.add(leftArm);
    
    // Braço direito
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.6, 0);
    rightArm.rotation.z = -Math.PI / 2;
    bodyGroup.add(rightArm);
    
    // Criar pernas
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    // Perna esquerda
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, -0.5, 0);
    bodyGroup.add(leftLeg);
    
    // Perna direita
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, -0.5, 0);
    bodyGroup.add(rightLeg);
    
    // Habilitar sombras
    bodyGroup.traverse((object) => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
    
    return bodyGroup;
}

// Atualizar a posição do corpo do jogador
function updatePlayerBody() {
    if (!playerBody) return;
    
    // Se estiver no modo primeira pessoa
    if (isFirstPersonMode()) {
        // Se o corpo não estiver fixo, atualizar sua posição
        if (!isBodyFixed) {
            // Posicionar o corpo ligeiramente abaixo e atrás da câmera
            const bodyOffset = new THREE.Vector3(0, -1.8, 0.5);
            
            // Criar uma matriz de rotação baseada na rotação da câmera
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeRotationY(cameraRotation.y);
            
            // Aplicar a rotação ao offset
            bodyOffset.applyMatrix4(rotationMatrix);
            
            // Posicionar o corpo
            playerBody.position.copy(camera.position).add(bodyOffset);
            
            // Alinhar a rotação do corpo com a câmera
            playerBody.rotation.y = cameraRotation.y;
        }
        
        // Tornar o corpo visível apenas para outras câmeras
        playerBody.visible = !playerVisible;
        
        // Esconder a cabeça em primeira pessoa
        playerBody.children.forEach(child => {
            if (child.name === 'head') {
                child.visible = false;
            }
        });
    } else {
        // Em outros modos, fixar o corpo na posição atual
        if (!isBodyFixed) {
            isBodyFixed = true;
            fixedBodyPosition.copy(playerBody.position);
        }
        
        // Manter o corpo na posição fixa
        playerBody.position.copy(fixedBodyPosition);
        
        // Tornar o corpo visível
        playerBody.visible = playerVisible;
        
        // Mostrar a cabeça em outros modos
        playerBody.children.forEach(child => {
            if (child.name === 'head') {
                child.visible = true;
            }
        });
    }
}

// Inicializar o corpo do jogador
function initPlayerBody() {
    playerBody = createPlayerBody();
    scene.add(playerBody);
    playerBody.visible = false; // Inicialmente invisível
}

// Alternar visibilidade do corpo
function togglePlayerVisibility() {
    if (playerBody) {
        playerVisible = !playerVisible;
        playerBody.visible = !playerVisible;
    }
}

// Função para resetar a posição fixa do corpo
function resetFixedBody() {
    isBodyFixed = false;
} 