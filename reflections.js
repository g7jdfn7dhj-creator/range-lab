/**
 * reflections.js — отражения: динамическая env-карта (CubeCamera) для металла + «мокрая» земля (three.js r128).
 * ТОЛЬКО РЕНДЕР. Обновление env-карты редкое (по умолчанию раз в 2 с) — дёшево для мобильных.
 *
 *   const RFL = createReflections({ scene, renderer, center:new THREE.Vector3(0,1.5,0), size:128 });
 *   RFL.apply(material, strength)  // назначить envMap металлу (лист брони, ствол, корпус)
 *   RFL.wetPlane(width, depth, position)  // полупрозрачная зеркальная плёнка над землёй (для дождя), без raycast
 *   RFL.setWet(0..1)
 *   RFL.update(dt)   // перерисует кубкарту по таймеру; RFL.refresh() — немедленно (после смены неба)
 */
(function (g) {
  g.createReflections = function (o) {
    const THREE = g.THREE, scene = o.scene, renderer = o.renderer, size = o.size || 128, every = o.interval || 2;
    const rt = new THREE.WebGLCubeRenderTarget(size, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    if (THREE.sRGBEncoding !== undefined) rt.texture.encoding = THREE.sRGBEncoding;
    const cam = new THREE.CubeCamera(.5, 800, rt); cam.position.copy(o.center || new THREE.Vector3(0, 1.5, 0)); scene.add(cam);
    const mats = []; let t = every, wet = 0, plane = null;
    function refresh() { const hide = mats.map(m => m.__mesh).filter(Boolean); hide.forEach(m => m.visible = false); cam.update(renderer, scene); hide.forEach(m => m.visible = true); }
    function apply(mat, strength = 1, mesh) { mat.envMap = rt.texture; mat.envMapIntensity = strength; mat.needsUpdate = true; mat.__mesh = mesh; mats.push(mat); }
    function wetPlane(w, d, pos) { const m = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 1, roughness: .15, transparent: true, opacity: 0, envMap: rt.texture, depthWrite: false });
      plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); plane.rotation.x = -Math.PI / 2; plane.position.copy(pos || new THREE.Vector3(0, .01, 40));
      plane.raycast = () => {}; plane.userData.decor = true; plane.renderOrder = 1; scene.add(plane); return plane; }
    function setWet(k) { wet = k; if (plane) { plane.material.opacity = .35 * k; plane.visible = k > .01; } mats.forEach(m => m.envMapIntensity = (m.__base || (m.__base = m.envMapIntensity)) * (1 + .5 * k)); }
    function update(dt) { t += dt; if (t >= every) { t = 0; refresh(); } }
    return { apply, wetPlane, setWet, update, refresh, texture: rt.texture };
  };
})(window);
