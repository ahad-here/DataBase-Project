import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';
import gsap from 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.7.1/gsap.min.js';

// Three.js Background Animation (Starry Sky)
function initBackground() {
    const canvas = document.getElementById('bg');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 5000;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 2000;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 2,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    camera.position.z = 100;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.y += 0.0002;
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// GSAP Animations
function initAnimations() {
    // Game Cards (games.html)
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card, index) => {
        gsap.from(card, {
            opacity: 0,
            y: 50,
            duration: 0.5,
            delay: index * 0.1,
            ease: 'power2.out'
        });
        card.addEventListener('mouseenter', () => {
            gsap.to(card, { scale: 1.05, duration: 0.3 });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { scale: 1, duration: 0.3 });
        });
    });

    // Category Cards (categories.html)
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach((card, index) => {
        gsap.from(card, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            delay: index * 0.1,
            ease: 'back.out(1.7)'
        });
    });

    // Featured Game (index.html)
    const featuredContent = document.querySelector('.featured-content');
    if (featuredContent) {
        gsap.from(featuredContent, {
            opacity: 0,
            x: -100,
            duration: 1,
            ease: 'power3.out'
        });
    }

    // Game Details Buttons and Media (game-details.html)
    const addToCartBtn = document.querySelector('#add-to-cart-btn');
    if (addToCartBtn) {
        gsap.from(addToCartBtn, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: 0.5
        });
        addToCartBtn.addEventListener('mouseenter', () => {
            gsap.to(addToCartBtn, { scale: 1.1, duration: 0.3 });
        });
        addToCartBtn.addEventListener('mouseleave', () => {
            gsap.to(addToCartBtn, { scale: 1, duration: 0.3 });
        });
    }

    const mediaItems = document.querySelectorAll('.media-item');
    mediaItems.forEach((item, index) => {
        gsap.from(item, {
            opacity: 0,
            x: 50,
            duration: 0.5,
            delay: index * 0.2
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    initAnimations();
});