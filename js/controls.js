function setupControls() {
    // Adicionar controles de mouse
    const container = document.getElementById("container");
    
    // Controle de olhar ao redor
    const onMouseMove = function (event) {
      if (document.pointerLockElement === container) {
        // Atualizar rotação da câmera baseado no movimento do mouse
        cameraRotation.y -= event.movementX * 0.002;
        cameraRotation.x -= event.movementY * 0.002;
        
        // Limitar olhar para cima/baixo
        cameraRotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, cameraRotation.x)
        );
        
        // Aplicar rotação à câmera usando quaternions para evitar gimbal lock
        camera.quaternion.setFromEuler(
          new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, "YXZ")
        );
      }
    };
    
    document.addEventListener("mousemove", onMouseMove);
    
    // Controles de teclado
    const onKeyDown = function (event) {
      switch (event.code) {
        case "KeyW":
          moveForward = true;
          break;
        case "KeyS":
          moveBackward = true;
          break;
        case "KeyA":
          moveLeft = true;
          break;
        case "KeyD":
          moveRight = true;
          break;
        case "Space":
          moveUp = true;
          break;
        case "ShiftLeft":
          moveDown = true;
          break;
      }
    };
    
    const onKeyUp = function (event) {
      switch (event.code) {
        case "KeyW":
          moveForward = false;
          break;
        case "KeyS":
          moveBackward = false;
          break;
        case "KeyA":
          moveLeft = false;
          break;
        case "KeyD":
          moveRight = false;
          break;
        case "Space":
          moveUp = false;
          break;
        case "ShiftLeft":
          moveDown = false;
          break;
      }
    };
    
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }
  
  // Atualizar movimento da câmera
  function updateCameraMovement(delta) {
    // Se estiver na vista aérea, não permitir movimento
    if (cameraViews.isAerialView) {
        return;
    }
    
    // No modo primeira pessoa, garantir sempre que a câmera esteja na altura correta
    if (isFirstPersonMode() && heightData) {
        const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
        camera.position.y = terrainY + 2; // Sempre 2 unidades acima do terreno
    }
    
    // Calcular direção de movimento com base na orientação da câmera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    // Velocidade constante de movimento
    let moveSpeed;
    if (isFirstPersonMode()) {
        moveSpeed = 10.0 * delta;  // Mais devagar em primeira pessoa
    } else {
        moveSpeed = 30.0 * delta;  // Mais rápido em modo de voo
    }
    
    // Guardar posição anterior para verificação de colisão
    const previousPosition = camera.position.clone();
    
    // Movimento para frente/trás (na direção que a câmera está olhando)
    if (moveForward) {
        camera.position.x += cameraDirection.x * moveSpeed;
        camera.position.z += cameraDirection.z * moveSpeed;
        if (!isFirstPersonMode()) {
            camera.position.y += cameraDirection.y * moveSpeed;
        }
    }
    
    if (moveBackward) {
        camera.position.x -= cameraDirection.x * moveSpeed;
        camera.position.z -= cameraDirection.z * moveSpeed;
        if (!isFirstPersonMode()) {
            camera.position.y -= cameraDirection.y * moveSpeed;
        }
    }
    
    // Movimento lateral (perpendicular à direção da câmera no plano horizontal)
    const rightVector = new THREE.Vector3(
        Math.sin(cameraRotation.y + Math.PI / 2),
        0,
        Math.cos(cameraRotation.y + Math.PI / 2)
    );
    
    if (moveRight) {
        camera.position.x += rightVector.x * moveSpeed;
        camera.position.z += rightVector.z * moveSpeed;
    }
    
    if (moveLeft) {
        camera.position.x -= rightVector.x * moveSpeed;
        camera.position.z -= rightVector.z * moveSpeed;
    }
    
    // Movimento vertical (independente da direção da câmera)
    // Apenas permitido no modo de voo
    if (!isFirstPersonMode()) {
        if (moveUp) {
            camera.position.y += moveSpeed;
        }
        if (moveDown) {
            // Verificar a altura do terreno antes de descer
            const terrainY = heightData ? getTerrainHeight(camera.position.x, camera.position.z) : 0;
            const minHeight = terrainY + 2; // 2 unidades acima do terreno
            
            // Só permite descer se não for ficar abaixo do terreno
            if (camera.position.y - moveSpeed > minHeight) {
                camera.position.y -= moveSpeed;
            } else {
                camera.position.y = minHeight; // Limita à altura mínima
            }
        }
    }
    
    // Verificar colisões apenas no modo primeira pessoa
    if (isFirstPersonMode()) {
        // Se houver colisão, reverter para a posição anterior
        if (
            isCameraCollidingWithTrees(camera.position) ||
            isCameraCollidingWithParkObjects(camera.position) ||
            isCameraCollidingWithLakeStones(camera.position) ||
            isCameraCollidingWithBuildings(camera.position)
        ) {
            camera.position.copy(previousPosition);
        }
    }
    
    // Garantir que a câmera nunca fique abaixo do terreno (para todos os modos)
    if (heightData) {
        const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
        const minHeight = terrainY + 2; // 2 unidades acima do terreno
        
        if (camera.position.y < minHeight) {
            camera.position.y = minHeight;
        }
    }
  }