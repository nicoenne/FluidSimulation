import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


import { vertex as particleVertShader } from './assets/particleShader.vert.js';
import { vertex as particleFragShader } from './assets/particleShader.frag.js';

const scene = new THREE.Scene();

//Mesh
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: "purple", wireframe: true });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

//Camera
const aspect = {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.innerWidth / window.innerHeight
};
// const camera = new THREE.PerspectiveCamera( 90, aspect.width / aspect.height );
const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.5, 5);
camera.position.set(0, 0, 1);

camera.lookAt(new THREE.Vector3());
scene.add(camera);

//Renderer
const canvas = document.querySelector(".draw");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(aspect.width, aspect.height);

const orbitControls = new OrbitControls(camera, canvas);

animate();






function init() {
    initParticles();
}

function initParticles() {
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(N_PARTICLES * 2);
    let i = 0;
    for (let p = 0; p < N_PARTICLES; p++) {
        positions[i++] = (Math.random() * 2 - 1); 
        positions[i++] = (Math.random() * 2 - 1);
    }
    geometry.setAttribute('a_position', new THREE.BufferAttribute(positions, 2).setUsage( THREE.DynamicDrawUsage ));
    const velocities = new Float32Array(N_PARTICLES * 2);
    let j = 0;
    for (let p = 0; p < N_PARTICLES; p++) {
        velocities[j++] = (Math.random() * 2 - 1); 
        velocities[j++] = (Math.random() * 2 - 1);
    }
    geometry.setAttribute('a_velocity', new THREE.BufferAttribute(velocities, 2).setUsage( THREE.DynamicDrawUsage ));
    particleUniforms = {
        'texturePosition' : {value: null},
        'u_resolution' : {value: [aspect.width, aspect.height]}
    }
    material = new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader: particleVertShader,
        fragmentShader: particleFragShader 
    })
    const particle = new THREE.Points(geometry, material);
    scene.add(particle);
}

function animate() {
    render();
    // RequestAnimationFrame
    window.requestAnimationFrame(animate);
}

function render() {
    renderer.render(scene, camera); 
}

window.addEventListener('resize', () => {
    //Update Size
    aspect.width = window.innerWidth;
    aspect.height = window.innerHeight;

    //New aspect ratio
    camera.aspect = aspect.width / aspect.height;
    camera.updateProjectionMatrix();
    console.log(camera);
    //New Render size
    renderer.setSize(aspect.width, aspect.height);
})