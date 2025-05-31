// Array para armazenar as bounding boxes dos edifícios
let buildingBoxes = [];

function isCameraCollidingWithTrees(cameraPosition) {
    if (!isFirstPersonMode()) return false; // Só aplica em primeira pessoa

    for (let tree of trees) {
        const sphere = tree.userData.collisionSphere;
        if (!sphere) continue;

        const distance = cameraPosition.distanceTo(sphere.center);
        if (distance < sphere.radius) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithParkObjects(position) {
    if (!isFirstPersonMode()) return false;

    for (const object of parkCollisionObjects) {
        const distance = position.distanceTo(object.center);
        if (distance < object.radius) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithLakeStones(position) {
    if (!isFirstPersonMode()) return false;

    // Adicionar uma margem de segurança à posição da câmera
    const cameraRadius = 0.5; // Raio da câmera para colisão
    const collisionMargin = 0.3; // Margem adicional de segurança

    for (const stone of stoneCollisionObjects) {
        const distance = position.distanceTo(stone.center);
        const collisionDistance = stone.radius + cameraRadius + collisionMargin;

        // Debug: Mostrar informações de colisão
        if (window.DEBUG_COLLISIONS && stone.stone) {
            const distanceToCollision = distance - collisionDistance;
            if (distanceToCollision < 1) { // Mostrar apenas quando estiver próximo
                console.log(`Distância até pedra: ${distance.toFixed(2)}, Distância de colisão: ${collisionDistance.toFixed(2)}`);
            }
        }

        if (distance < collisionDistance) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithBuildings(cameraPosition) {
    if (!isFirstPersonMode()) return false;

    // Adicionar uma margem de segurança à posição da câmera
    const cameraRadius = 0.5; // Raio da câmera para colisão
    const collisionMargin = 0.3; // Margem adicional de segurança

    for (const box of buildingBoxes) {
        // Expandir a bounding box para incluir a margem de segurança
        const expandedBox = box.clone().expandByScalar(cameraRadius + collisionMargin);
        
        if (expandedBox.containsPoint(cameraPosition)) {
            return true;
        }
    }
    return false;
}
