/**
 * lighting.js — освещение по времени суток + пул динамических вспышек (three.js r128).
 * ТОЛЬКО РЕНДЕР. Если в игре уже есть sun/hemi — передайте их, модуль лишь меняет цвет/интенсивность/позицию.
 *
 *   const LIT = createLighting({ scene, renderer, sun, hemi, target:new THREE.Vector3(0,0,40) });
 *   LIT.setTimeOfDay(0..1)     // 0 ночь, .25 рассвет, .5 полдень, .75 закат
 *   LIT.flash(pos, intensity, color, decay)   // вспышки выстрела/взрыва (пул из 4 PointLight, без пересоздания шейдеров)
 *   LIT.update(dt, camera)     // тень следует за камерой, вспышки гаснут
 */
(function (g) {
  g.createLighting = function (o) {
    const THREE = g.THREE, scene = o.scene, r = o.renderer;
    const sun = o.sun || (() => { const s = new THREE.DirectionalLight(0xfff2d8, 1); s.castShadow = true; s.shadow.mapSize.set(2048, 2048); scene.add(s, s.target); return s; })();
    const hemi = o.hemi || (() => { const h = new THREE.HemisphereLight(0xdfe8f0, 0x4a4630, .55); scene.add(h); return h; })();
    const tgt = o.target || new THREE.Vector3(0, 0, 40);
    const pool = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffa040, 0, 25, 2); scene.add(l); return { l, k: 0, d: 6 }; });
    let pi = 0;
    const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    function setTimeOfDay(t) {
      const el = Math.sin((t - .25) * Math.PI * 2);              // высота солнца −1..1
      const az = (t - .25) * Math.PI * 2, day = Math.max(0, el), dusk = Math.max(0, 1 - Math.abs(el) * 4);
      sun.position.set(tgt.x - Math.cos(az) * 60, Math.max(4, el * 70), tgt.z - 30 + Math.sin(az) * 20);
      sun.target.position.copy(tgt);
      sun.intensity = el > -.05 ? .08 + 1.05 * Math.pow(day, .6) : .03;   // ночью — «луна»
      sun.color.copy(el > 0 ? lerpC(0xff9050, 0xfff2d8, Math.min(1, el * 3)) : new THREE.Color(0x8090c0));
      hemi.intensity = .08 + .5 * day + .1 * dusk;
      hemi.color.copy(lerpC(0x203050, 0xdfe8f0, day)).lerp(new THREE.Color(0xffb080), dusk * .4);
      hemi.groundColor.copy(lerpC(0x101010, 0x4a4630, day));
      if (r && r.toneMappingExposure !== undefined) r.toneMappingExposure = .85 + .3 * day;
    }
    function flash(pos, k = 8, col = 0xffa040, decay = 6) { const p = pool[pi++ % pool.length]; p.l.position.copy(pos); p.l.color.setHex(col); p.k = k; p.d = decay; }
    function update(dt, cam) { pool.forEach(p => { p.k *= Math.exp(-p.d * dt); p.l.intensity = p.k > .05 ? p.k : 0; });
      if (cam && sun.shadow && o.followCamera) { const c = sun.shadow.camera; sun.target.position.set(cam.position.x, 0, cam.position.z + 20); c.updateProjectionMatrix(); } }
    setTimeOfDay(o.time == null ? .5 : o.time);
    return { sun, hemi, setTimeOfDay, flash, update };
  };
})(window);
