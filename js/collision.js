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
    for (const box of parkCollisionBoxes) {
        if (box.containsPoint(position)) {
            return true;
        }
    }
    return false;
}
