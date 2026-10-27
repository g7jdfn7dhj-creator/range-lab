/**
 * environment.js — декоративное окружение для three.js r128 (глобальный THREE).
 * ТОЛЬКО РЕНДЕР. Ничего не добавляет в коллизии/рейкасты игры, не трогает игровую землю,
 * мишень, траектории. Всё лежит в отдельной группе env.root, у объектов userData.decor = true
 * и raycast отключён, чтобы прицеливание кликом по листу не цеплялось за декор.
 *
 *   const ENV = createEnvironment({ scene, renderer, camera, basePath:"./", images: window.AIIMG,
 *        playArea: { minX:-8, maxX:8, minZ:-12, maxZ:100 } });   // прямоугольник, где ничего не ставим
 *   ENV.setTimeOfDay(0..1)        // 0 — ночь, .25 рассвет, .5 полдень, .75 закат
 *   ENV.setSky("clear"|"overcast"|"sunset")
 *   ENV.setWeather({ rain:0..1, snow:0..1, fog:0..1, wet:0..1 })
 *   ENV.update(dt, camera)        // в каждом кадре
 *   ENV.dispose()
 */
(function (global) {
  function createEnvironment(o) {
    const THREE = global.THREE, scene = o.scene, base = o.basePath || "./", IM = o.images || {};
    const PA = o.playArea || { minX: -8, maxX: 8, minZ: -12, maxZ: 100 }, R = o.radius || 600;
    const root = new THREE.Group(); root.name = "decor"; scene.add(root);
    const noRay = obj => { obj.userData.decor = true; obj.raycast = () => {}; return obj; };
    const loader = new THREE.TextureLoader(), C = {};
    function tex(name, path, rep, srgb = true) { if (C[name]) return C[name]; let t;
      if (IM[name]) { t = new THREE.Texture(IM[name]); t.needsUpdate = true; } else t = loader.load(base + path);
      if (srgb && THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
      if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); } t.anisotropy = 8; return (C[name] = t); }
    const inPlay = (x, z, pad = 6) => x > PA.minX - pad && x < PA.maxX + pad && z > PA.minZ - pad && z < PA.maxZ + pad;
    const rnd = (a, b) => a + Math.random() * (b - a);

    /* ---------- 1. Небо: сфера с фото-панорамой + градиент времени суток ---------- */
    const skyTex = { clear: tex("sky_clear", "sky/sky_clear.jpg"), overcast: tex("sky_overcast", "sky/sky_overcast.jpg"), sunset: tex("sky_sunset", "sky/sky_sunset.jpg") };
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex.clear, side: THREE.BackSide, fog: false, depthWrite: false });
    // панорама 2:1 натянута на верхнюю полусферу: горизонт фото совпадает с горизонтом сцены
    const skyGeo = new THREE.SphereGeometry(R * 1.6, 48, 24, 0, Math.PI * 2, 0, Math.PI * .56);
    const sky = noRay(new THREE.Mesh(skyGeo, skyMat)); sky.renderOrder = -10; root.add(sky);

    /* ---------- 2. Рельеф вокруг полигона: кольцо heightfield, плоское внутри playArea ---------- */
    const N = 160, size = R * 2, tg = new THREE.PlaneGeometry(size, size, N, N); tg.rotateX(-Math.PI / 2);
    const pos = tg.attributes.position, h = (x, z) => Math.sin(x * .013) * 9 + Math.sin(z * .021 + 1) * 6 + Math.sin((x + z) * .047) * 2.5 + Math.sin(x * .11) * Math.cos(z * .09) * .8;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i);
      const dx = Math.max(PA.minX - x, 0, x - PA.maxX), dz = Math.max(PA.minZ - z, 0, z - PA.maxZ), d = Math.hypot(dx, dz);
      const k = Math.min(1, Math.max(0, (d - 25) / 120));      // 0 рядом с игровой зоной → плавный подъём дальше
      pos.setY(i, -0.05 + h(x, z) * k * k + (d > R * .7 ? (d - R * .7) * .25 : 0)); }
    tg.computeVertexNormals();
    const terrMat = new THREE.MeshStandardMaterial({ map: tex("grass", "textures/env/grass.jpg", 90), normalMap: tex("grass_n", "textures/env/grass_normal.jpg", 90, false), roughness: .95, metalness: 0 });
    const terrain = noRay(new THREE.Mesh(tg, terrMat)); terrain.receiveShadow = true; terrain.position.y = -0.03; root.add(terrain); // чуть ниже игровой земли — без z-fighting

    /* ---------- 3. Растительность: инстансы billboard-ов (дерево/куст/трава) ---------- */
    function cross(texName, file, w, hgt, count, minD, maxD) {
      const t = tex(texName, file); const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: .45, transparent: false, side: THREE.DoubleSide, roughness: 1 });
      const g = new THREE.PlaneGeometry(w, hgt); g.translate(0, hgt / 2, 0);
      const g2 = g.clone(); g2.rotateY(Math.PI / 2); // две скрещенные плоскости — объём с любого ракурса
      const merged = mergeTwo(g, g2);
      const im = noRay(new THREE.InstancedMesh(merged, m, count)); im.castShadow = true; const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
      let n = 0, guard = 0; while (n < count && guard++ < count * 20) { const a = Math.random() * 6.283, r = rnd(minD, maxD), x = Math.cos(a) * r, z = 40 + Math.sin(a) * r;
        if (inPlay(x, z)) continue; const sc = rnd(.7, 1.35); p.set(x, terrainH(x, z) - .1, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * 6.28); s.set(sc, sc * rnd(.85, 1.15), sc);
        M.compose(p, q, s); im.setMatrixAt(n++, M); }
      im.count = n; root.add(im); return im; }
    function mergeTwo(a, b) { const g = new THREE.BufferGeometry(); ["position", "normal", "uv"].forEach(k => { const A = a.attributes[k].array, B = b.attributes[k].array, out = new Float32Array(A.length + B.length); out.set(A); out.set(B, A.length); g.setAttribute(k, new THREE.BufferAttribute(out, a.attributes[k].itemSize)); });
      const ia = a.index.array, ib = b.index.array, off = a.attributes.position.count, idx = new Uint16Array(ia.length + ib.length); idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + off; g.setIndex(new THREE.BufferAttribute(idx, 1)); return g; }
    function terrainH(x, z) { const dx = Math.max(PA.minX - x, 0, x - PA.maxX), dz = Math.max(PA.minZ - z, 0, z - PA.maxZ), d = Math.hypot(dx, dz), k = Math.min(1, Math.max(0, (d - 25) / 120)); return h(x, z) * k * k - .08; }
    cross("tree_birch", "sprites/vegetation/tree_birch.png", 7, 10, 220, 40, R * .8);
    cross("bush", "sprites/vegetation/bush.png", 3, 2.2, 300, 20, R * .6);
    cross("grass_tuft", "sprites/vegetation/grass_tuft.png", 1.1, .9, 1500, 12, 220);

    /* ---------- 4. Постройки: коробки с фасадами (кирпич/штукатурка/руины), без коллизий ---------- */
    const facades = ["brick", "plaster", "ruin"].map(k => new THREE.MeshStandardMaterial({ map: tex(k, `textures/env/${k}.jpg`), normalMap: tex(k + "_n", `textures/env/${k}_normal.jpg`, 0, false), roughness: .9 }));
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a4a46, roughness: .8 });
    for (let i = 0; i < 14; i++) { const a = rnd(0, 6.28), r = rnd(150, R * .7), x = Math.cos(a) * r, z = 40 + Math.sin(a) * r; if (inPlay(x, z, 40)) continue;
      const w = rnd(8, 18), d = rnd(8, 14), hh = rnd(4, 12), m = facades[i % 3], b = noRay(new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), [m, m, roofMat, roofMat, m, m]));
      [m].forEach(mm => { mm.map.wrapS = mm.map.wrapT = THREE.RepeatWrapping; mm.map.repeat.set(2, 1); });
      b.position.set(x, terrainH(x, z) + hh / 2 - .3, z); b.rotation.y = rnd(0, 3.14); b.castShadow = b.receiveShadow = true; root.add(b); }

    /* ---------- 5. Облака: спрайты в небе, медленно дрейфуют ---------- */
    const cloudT = tex("cloud", "sprites/fx/cloud.png"), clouds = [];
    for (let i = 0; i < 18; i++) { const s = noRay(new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, opacity: .85 })));
      s.position.set(rnd(-R, R), rnd(90, 160), rnd(-R * .3, R)); const k = rnd(60, 140); s.scale.set(k, k * .55, 1); root.add(s); clouds.push(s); }

    /* ---------- 6. Погода: дождь/снег (Points вокруг камеры), туман, мокрая поверхность ---------- */
    const NP = 6000, pp = new Float32Array(NP * 3); for (let i = 0; i < NP * 3; i += 3) { pp[i] = rnd(-40, 40); pp[i + 1] = rnd(0, 30); pp[i + 2] = rnd(-40, 40); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xaab4c0, size: .06, transparent: true, opacity: 0, depthWrite: false });
    const precip = noRay(new THREE.Points(pg, pMat)); precip.frustumCulled = false; root.add(precip);
    const W = { rain: 0, snow: 0, fog: 0, wet: 0 };
    function setWeather(w) { Object.assign(W, w);
      pMat.opacity = Math.max(W.rain * .55, W.snow * .9); pMat.size = W.snow > W.rain ? .14 : .05; pMat.color.setHex(W.snow > W.rain ? 0xffffff : 0xaab4c0);
      if (scene.fog) { scene.fog.near = 90 - 70 * W.fog; scene.fog.far = 420 - 330 * W.fog; }
      // «мокрый» вид: меньше шероховатость, темнее альбедо — только у декоративных материалов
      terrMat.roughness = .95 - .55 * W.wet; terrMat.color.setScalar(1 - .35 * W.wet); facades.forEach(m => { m.roughness = .9 - .5 * W.wet; m.color.setScalar(1 - .3 * W.wet); }); }

    /* ---------- 7. Время суток: цвет неба и тумана (освещение игры не трогаем, кроме опции) ---------- */
    let tod = .5;
    function setSky(k) { if (skyTex[k]) { skyMat.map = skyTex[k]; skyMat.needsUpdate = true; } }
    function setTimeOfDay(t) { tod = t; const day = Math.max(0, Math.sin((t - .25) * Math.PI * 2) * .5 + .5);
      const dusk = Math.exp(-Math.pow((t - .75) / .06, 2)) + Math.exp(-Math.pow((t - .25) / .06, 2));
      if (dusk > .4) setSky("sunset"); else if (W.rain > .3 || W.fog > .5) setSky("overcast"); else setSky("clear");
      skyMat.color.setRGB(.15 + .85 * day, .15 + .85 * day, .2 + .8 * day);
      if (scene.fog) scene.fog.color.setRGB(.06 + .56 * day + .2 * dusk, .07 + .63 * day + .05 * dusk, .1 + .62 * day);
      if (o.driveLights && o.sun) o.sun.intensity = .05 + day;   // только если игра сама разрешила
    }

    function update(dt, cam) { cam = cam || o.camera;
      clouds.forEach(c => { c.position.x += dt * 2; if (c.position.x > R) c.position.x = -R; });
      if (cam) { sky.position.copy(cam.position); precip.position.set(cam.position.x, 0, cam.position.z); }
      if (pMat.opacity > 0) { const fall = W.snow > W.rain ? 1.2 : 18, drift = W.snow > W.rain ? Math.sin(performance.now() / 900) * .6 : 0;
        for (let i = 0; i < NP * 3; i += 3) { pp[i + 1] -= fall * dt; pp[i] += drift * dt; if (pp[i + 1] < 0) { pp[i + 1] = 30; pp[i] = rnd(-40, 40); pp[i + 2] = rnd(-40, 40); } }
        pg.attributes.position.needsUpdate = true; } }
    function dispose() { scene.remove(root); root.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach(m => m.dispose()); }); }
    setTimeOfDay(.5);
    return { root, setSky, setTimeOfDay, setWeather, update, dispose, terrainHeight: terrainH };
  }
  global.createEnvironment = createEnvironment;
})(window);
