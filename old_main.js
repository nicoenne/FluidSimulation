import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


import { vertex as particleVertShader } from './assets/particleShader.vert.js';
import { vertex as particleFragShader } from './assets/particleShader.frag.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x000000 );

const WIDTH = 100;
const HEIGHT = 100;


//Camera
const aspect = {
    width: window.innerWidth,
    height: window.innerHeight
};

// const camera = new THREE.PerspectiveCamera( 90, aspect.width / aspect.height );
const camera = new THREE.OrthographicCamera(
    -WIDTH, WIDTH, 
    HEIGHT, -HEIGHT,
    0.5, 1.5);

camera.position.set(0, 0, 1);
scene.add(camera);

//Renderer
const canvas = document.querySelector(".draw");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(aspect.width, aspect.height);

// const orbitControl = new OrbitControls(camera, canvas);

let partGeometry, partMaterial, partMesh, partUniforms;
let boxGeometry, boxMaterial, boxMesh;
let planeGeometry, planeMaterial, planeMesh;

let boundaries = [
    -WIDTH, -HEIGHT, 0,
     WIDTH, -HEIGHT, 0,
     WIDTH,  HEIGHT, 0,
    -WIDTH,  HEIGHT, 0,
    -WIDTH, -HEIGHT, 0
];

let N_PARTICLES = 1000, SPEED_MAX = 10;

let simConstants = { 
    gravity: -1,
    mass: 1,
    smoothingRadius: 10,
    targetDensity: 0,
    pressureMultiplier: 0,
    speedMax: SPEED_MAX
}

init();
animate();

function init() {
    initGUI();
    // Bound box
    boxGeometry = new THREE.BufferGeometry();
    boxGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(boundaries, 3));
    
    boxMaterial = new THREE.LineBasicMaterial();
    boxMesh = new THREE.Line(boxGeometry, boxMaterial);
    scene.add(boxMesh);

    // // Background plane
    // planeGeometry = new THREE.PlaneGeometry( 2 * WIDTH, 2 * HEIGHT );
    // planeMaterial = new THREE.ShaderMaterial({
        
    // });
    // planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    // scene.add(planeMesh);

    // Particles
    const positions = new Float32Array( N_PARTICLES * 3 );
    const velocities = new Float32Array( N_PARTICLES * 3 )
    let i = 0, j = 0;
    for (let p = 0; p < N_PARTICLES; p++) {
        positions[i++] = ( (Math.random() * 2 - 1) * WIDTH ); 
        positions[i++] = ( (Math.random() * 2 - 1) * HEIGHT ); 
        positions[i++] = 0; 

        velocities[j++] = 0;  
        velocities[j++] = 0; 
        velocities[j++] = 0; 
    }

    partGeometry = new THREE.BufferGeometry();
    partGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    partGeometry.setAttribute( 'velocity', new THREE.BufferAttribute( velocities, 3 ) );

    partUniforms = {
        speedMax: {value: simConstants.speedMax}
    }

    partMaterial = new THREE.ShaderMaterial({
        uniforms: partUniforms,
        vertexShader: particleVertShader,
        fragmentShader: particleFragShader,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor

    });

    partMesh = new THREE.Points( partGeometry, partMaterial );
    scene.add( partMesh );
    
}

function initGUI() {
    const gui = new GUI( { width: 280 } );
    const folder = gui.addFolder( 'Simulation constants' );
    folder.add( simConstants, 'gravity', -10.0, 0);
    folder.add( simConstants, 'mass', 0.1, 10.0);
    folder.add( simConstants, 'targetDensity', 0.0, 1.0);
    folder.add( simConstants, 'pressureMultiplier', 0.0, 0.01);
    folder.add( simConstants, 'smoothingRadius', 0.0, 100.0);
    folder.add( simConstants, 'speedMax', 0.0, 10.0);
}

function update() {
    const positions = partMesh.geometry.attributes.position.array;
    const velocities = partMesh.geometry.attributes.velocity.array;
    let densities = [];

    updateVelocities();
    updatePositions();
    updateDensities();
    applyPressureForces();

    function applyPressureForces() {
        let i = 0;
        for (let p = 0; p < N_PARTICLES; p++) {
            let pressureForce = calculatePressureForce(p);
            let pressureAccelerationX = pressureForce[0] / densities[p];
            let pressureAccelerationY = pressureForce[1] / densities[p];

            velocities[i] = pressureAccelerationX;
            velocities[i + 1] = pressureAccelerationY;
            i += 3;
        }
    }

    function updateDensities() {
        let i = 0;
        for (let p = 0; p < N_PARTICLES; p++) {
            densities[p] = calculateDensity(positions[i], positions[i + 1]);
            i += 3;
        }
    }

    function updateVelocities() {
        let i = 0;
        for (let p = 0; p < N_PARTICLES; p ++) {
            velocities[i] += 0;
            velocities[i + 1] += simConstants.gravity;
            velocities[i + 2] += 0;

            // let speed = Math.sqrt(
            //     velocities[i] * velocities[i] + 
            //     velocities[i + 1] * velocities[i + 1] + 
            //     velocities[i + 2] * velocities[i + 2]);

            // if (speed > simConstants.speedMax) {
            //     velocities[i    ] *= simConstants.speedMax / speed;
            //     velocities[i + 1] *= simConstants.speedMax / speed;
            //     velocities[i + 2] *= simConstants.speedMax / speed;
            // }
            i += 3;
        }
    }
    function updatePositions() {
        let i = 0;
        for (let p = 0; p < N_PARTICLES; p ++) {
            positions[i] += velocities[i];
            if (Math.abs(positions[i]) > WIDTH) {
                positions[i] = WIDTH * Math.sign(positions[i]);
                velocities[i] *= -1;
            }
            positions[i + 1] += velocities[i + 1];
            if (Math.abs(positions[i + 1]) > WIDTH) {
                positions[i + 1] = HEIGHT * Math.sign(positions[i + 1]);
                velocities[i + 1] *= -1;
            }
            positions[i + 2] += velocities[i + 2];
            i += 3;
        }
    }

    function calculateDensity(samplePointX, samplePointY) {
        let density = 0;

        let i = 0;
        for (let p = 0; p < N_PARTICLES; p ++) {
            let dst = Math.sqrt(
                (positions[i    ] - samplePointX) * (positions[i    ] - samplePointX) + 
                (positions[i + 1] - samplePointY) * (positions[i + 1] - samplePointY)
            );
            let influence = smoothingKernel(dst, simConstants.smoothingRadius);
            density += simConstants.mass * influence;
            i += 3;
        }
        return density;
    }

    function calculatePressureForce(particleIndex) {
        let pressureForceX = 0, pressureForceY = 0;

        for (let otherParticleIndex = 0; otherParticleIndex < N_PARTICLES; otherParticleIndex ++) {
            if (particleIndex == otherParticleIndex) {
                continue;
            }
            let p = 3 * particleIndex;
            let q = 3 * otherParticleIndex;

            let offsetX = positions[p    ] - positions[q    ];
            let offsetY = positions[p + 1] - positions[q + 1];
            let dst = Math.sqrt(
                offsetX * offsetX + offsetY * offsetY
            );
            let dirX = dst == 0 ? Math.random() : offsetX / dst;
            let dirY = dst == 0 ? Math.random() : offsetY / dst; 
            let slope = smoothingKernelDerivative(dst, simConstants.smoothingRadius);
            let density = densities[otherParticleIndex];

            pressureForceX += convertDensityToPressure(density) * dirX * slope * simConstants.mass / density;
            pressureForceY += convertDensityToPressure(density) * dirY * slope * simConstants.mass / density;
        }
        return [pressureForceX, pressureForceY];
    }

}

function smoothingKernel(dst, radius) {
    let volume = Math.PI * Math.pow(radius, 8) / 4;
    let value = Math.max(0, radius * radius - dst + dst);
    return value * value * value / volume;
}

function smoothingKernelDerivative(dst, radius) {
    if (dst >= radius) return 0;
    let f = radius * radius - dst * dst;
    let scale = - 24 * (Math.PI * Math.pow(radius, 8));
    return scale * dst * f * f;
}

function convertDensityToPressure(density) {
    let densityError = density - simConstants.targetDensity;
    let pressure = densityError * simConstants.pressureMultiplier;
    return pressure;
}

function animate() {
    render();
    update();
    // RequestAnimationFrame
    window.requestAnimationFrame(animate);
}

function render() {
    partMesh.geometry.attributes.position.needsUpdate = true;
    partMesh.geometry.attributes.velocity.needsUpdate = true;

    renderer.render(scene, camera); 
}

// window.addEventListener('resize', () => {
//     //Update Size
//     aspect.width = window.innerWidth;
//     aspect.height = window.innerHeight;

//     //New aspect ratio
//     camera.aspect = aspect.width / aspect.height;
//     camera.updateProjectionMatrix();
//     //New Render size
//     renderer.setSize(aspect.width, aspect.height);
// })