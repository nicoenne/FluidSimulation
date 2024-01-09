import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

import { vertex as particleVertShader } from './assets/particleShader.vert.js';
import { vertex as particleFragShader } from './assets/particleShader.frag.js';
import { vertex as positionComputeShader } from './assets/positionShader.frag.js';
import { vertex as velocityComputeShader } from './assets/velocityShader.frag.js';

let WIDTH = 10;
let PARTICLES = WIDTH * WIDTH; 
let RADIUS = 10;

class ParticleGeometry extends THREE.BufferGeometry {
    constructor() {
        super();

        const pointsPerQuad = 4;
        const points = PARTICLES * pointsPerQuad;

        const vertices = new THREE.BufferAttribute( new Float32Array( points * 3 ), 3 );
        const references = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );
        const uvs = new THREE.BufferAttribute( new Float32Array( points * 2 ), 2 );

        this.setAttribute( 'position', vertices );
        this.setAttribute( 'reference', references );
        this.setAttribute( 'uv', uvs );
        this.setIndex([0, 1, 2, 2, 3, 0])

        let v = 0;

        function verts_push() {
            for ( let i = 0; i < arguments.length; i ++ ) {
                vertices.array[ v ++ ] = arguments[ i ];
            }
        }

        for ( let f = 0; f < PARTICLES; f ++ ) {
            verts_push(
                - RADIUS, - RADIUS, 0, //bottom-left
                  RADIUS, - RADIUS, 0, //bottom-right
                  RADIUS,   RADIUS, 0, //top-right
                - RADIUS,   RADIUS, 0, //top-left
            );
        }

        let u = 0;

        function uvs_push() {
            for ( let i = 0; i < arguments.length; i ++ ) {
                uvs.array[ u ++ ] = arguments[ i ];
            }
        }

        for ( let f = 0; f < PARTICLES; f ++ ) {
            uvs_push(
                0.0, 0.0, //bottom-left
                1.0, 0.0, //bottom-right
                1.0, 1.0, //top-right
                0.0, 1.0, //top-left
            );
        }

        for ( let v = 0; v < points; v ++ ) {

            const particleIndex = ~ ~ ( v / pointsPerQuad );
            const x = ( particleIndex % WIDTH ) / WIDTH;
            const y = ~ ~ ( particleIndex / WIDTH ) / WIDTH;

            references.array[ v * 2 ] = x;
            references.array[ v * 2 + 1 ] = y;
        }

        

}
}

let last = performance.now();

let container, stats;
let scene, renderer, camera;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const BOUNDS = 800, BOUNDS_HALF = BOUNDS / 2;

let gpuCompute;
let velocityVariable;
let positionVariable;
let positionUniforms;
let velocityUniforms;
let particleUniforms;

let frameCount = 0;

init();
animate();

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.OrthographicCamera(
        -windowHalfX, windowHalfX, 
        windowHalfY, -windowHalfY,
        0.5, 1.5);
    camera.position.z = 1;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    container.appendChild( stats.dom );
    
    initComputeRenderer();
    initParticles();

    window.addEventListener( 'resize', onWindowResize );
}

function initComputeRenderer() {
    gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );

    const dtPosition = gpuCompute.createTexture();
    const dtVelocity = gpuCompute.createTexture(); 

    fillPositionTexture( dtPosition );
    fillVelocityTexture( dtVelocity );

    positionVariable = gpuCompute.addVariable( 'texturePosition', positionComputeShader, dtPosition );
    velocityVariable = gpuCompute.addVariable( 'textureVelocity', velocityComputeShader, dtVelocity );

    gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
    gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
	
	positionUniforms = positionVariable.material.uniforms;
    velocityUniforms = velocityVariable.material.uniforms;

    positionUniforms[ 'dt' ] = { value: 0.0 };
    velocityUniforms[ 'dt' ] = { value: 0.0 };
    velocityUniforms[ 'gravity' ] = { value: 0.0 };

    velocityVariable.wrapS = THREE.RepeatWrapping;
    velocityVariable.wrapT = THREE.RepeatWrapping;
    positionVariable.wrapS = THREE.RepeatWrapping;
    positionVariable.wrapT = THREE.RepeatWrapping;

    const error = gpuCompute.init();

    if ( error !== null ) {

        console.error( error );

    }
}

function initParticles() {

    const geometry = new ParticleGeometry();

    particleUniforms = {
        'texturePosition': { value: null },
        'textureVelocity': { value: null }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: particleUniforms,
        vertexShader: particleVertShader,
        fragmentShader: particleFragShader,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor
    });

    const particleMesh = new THREE.Mesh( geometry, material );
    scene.add( particleMesh );
}

function fillPositionTexture( texture ) {

    const theArray = texture.image.data;

    for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {

        const x = ( (Math.random() * 2 - 1) * BOUNDS_HALF ); 
        const y = ( (Math.random() * 2 - 1) * BOUNDS_HALF ); 
        const z = 0;

        theArray[ k + 0 ] = x;
        theArray[ k + 1 ] = y;
        theArray[ k + 2 ] = z;
        theArray[ k + 3 ] = 1;

    }

}

function fillVelocityTexture( texture ) {

    const theArray = texture.image.data;

    for ( let k = 0, kl = theArray.length; k < kl; k += 4 ) {

        const x = 0;
        const y = 0;
        const z = 0;

        theArray[ k + 0 ] = x;
        theArray[ k + 1 ] = y;
        theArray[ k + 2 ] = z;
        theArray[ k + 3 ] = 1;

    }

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
    frameCount += 1;
    if (frameCount > 1) {
        return
    }
    requestAnimationFrame( animate );

    render();
    stats.update();

}

function render() {

    const now = performance.now();
    let delta = ( now - last ) / 1000;

    if ( delta > 1 ) delta = 1;
    last = now;
    positionUniforms[ 'dt' ].value = delta;
    velocityUniforms[ 'dt' ].value = delta;

    gpuCompute.compute();
    
    particleUniforms[ 'texturePosition' ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
    particleUniforms[ 'textureVelocity' ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;

    renderer.render( scene, camera );
}