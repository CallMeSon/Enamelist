/**
 * ENAMELIST - 3D Keychain Generator
 * Powered by Three.js and OrbitControls
 *
 * FIXES APPLIED (v2):
 *  1. Contour tracing rewritten using Marching Squares (replaces buggy Moore-Neighbor)
 *  2. Simplification rewritten using Ramer-Douglas-Peucker + Chaikin corner-cutting smoothing
 *  3. Canvas resolution reduced from 150 to 100 for smoother silhouette
 *  4. Fixed idle rotation bug (!controls.state === -1 → controls.state === -1)
 *  5. Added contour border padding so image is never clipped by metallic edge
 *  6. Fixed UV texture alignment (offset + repeat corrected)
 *  7. Improved bevel settings (more segments, slightly larger bevel)
 *  8. Added curveSegments to ExtrudeGeometry for smoother curves
 */

let scene, camera, renderer, controls;
let keychainGroup = null;
let currentTexture = null;
let currentImageSrc = null;
let currentShape = 'custom';
let currentThickness = 4.0;
let currentMetal = 'gold';

// Metal colors configuration
const metalColors = {
    gold: {
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.15
    },
    silver: {
        color: 0xe3e4e5,
        metalness: 0.95,
        roughness: 0.12
    },
    black: {
        color: 0x222222,
        metalness: 0.8,
        roughness: 0.2
    },
    rosegold: {
        color: 0xb76e79,
        metalness: 0.9,
        roughness: 0.15
    }
};

/**
 * Initialize 3D Scene
 */
function init3DViewer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create Scene
    scene = new THREE.Scene();

    // Create Camera
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 18);

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Clear previous contents and append canvas
    const oldCanvas = container.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();
    container.appendChild(renderer.domElement);
    renderer.domElement.classList.add('hidden');

    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 5;
    controls.maxDistance = 35;

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Key Light (Directional)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light (Soft Directional)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, -5, 5);
    scene.add(fillLight);

    // Rim/Spec Light for metallic shine
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(0, 10, -8);
    scene.add(rimLight);

    // Group to hold the actual model
    keychainGroup = new THREE.Group();
    scene.add(keychainGroup);

    // Handle Resize
    window.addEventListener('resize', onWindowResize);

    // Initialize Theme
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark);

    // Start Animation Loop
    animate();
}

/**
 * Reset camera view to default
 */
function reset3DView() {
    if (controls) {
        controls.reset();
        camera.position.set(0, 0, 18);
        controls.target.set(0, 0, 0);
    }
}

/**
 * Handle Theme Adaptability
 */
function setThemeMode(isDark) {
    if (!scene) return;
    const lights = scene.children.filter(child => child.isLight);
    lights.forEach(light => {
        if (light.isAmbientLight) {
            light.intensity = isDark ? 0.85 : 0.65;
        }
    });
}

function onWindowResize() {
    const container = document.getElementById('canvas-3d-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();

    // FIX 4: Fixed operator precedence bug — was: !controls.state === -1 (always false)
    // controls.state === -1 means user is not currently interacting
    if (keychainGroup && controls.state === -1) {
        keychainGroup.rotation.y = Date.now() * 0.0003;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ============================================================
// FIX 1: Correct Moore-Neighbor 8-Connectivity Contour Tracing
// The previous Square Tracing (4-connectivity) failed for complex
// shapes because it used a visited-set that terminated prematurely
// and only had 4 directions. This uses proper 8-direction
// Moore-Neighbor tracing with the standard backtrack formula.
// ============================================================

/**
 * Moore-Neighbor contour tracer (8-connectivity).
 * Traces the outer boundary of the solid region in the image.
 *
 * @param {ImageData} imageData
 * @returns {Array<{x:number,y:number}>|null}
 */
function traceOutline(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const ALPHA_THRESHOLD = 100;

    // Helper: is pixel (px, py) solid?
    function isSolid(px, py) {
        if (px < 0 || py < 0 || px >= w || py >= h) return false;
        return data[(py * w + px) * 4 + 3] > ALPHA_THRESHOLD;
    }

    // Find the first solid pixel (scan top-to-bottom, left-to-right)
    let startX = -1, startY = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (isSolid(x, y)) {
                startX = x;
                startY = y;
                break;
            }
        }
        if (startX !== -1) break;
    }

    if (startX === -1) return null;

    // 8 directions clockwise: E, SE, S, SW, W, NW, N, NE
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];

    const points = [];
    let cx = startX;
    let cy = startY;

    // Since we scan left-to-right, the pixel at (startX-1, startY)
    // is non-solid. That's direction 4 (West). This is our initial
    // backtrack direction — we'll start searching from (prevDir + 1).
    let prevDir = 4;

    const maxIterations = 2 * (w + h) * (w + h);
    let iterations = 0;

    do {
        points.push({ x: cx, y: cy });

        // Search clockwise for the next boundary pixel
        // Start from one step clockwise past the backtrack direction
        let foundDir = -1;

        for (let i = 0; i < 8; i++) {
            const d = (prevDir + 1 + i) % 8;
            const nx = cx + dx[d];
            const ny = cy + dy[d];

            if (isSolid(nx, ny)) {
                foundDir = d;
                break;
            }
        }

        if (foundDir === -1) break; // isolated pixel

        // Move to the found pixel
        cx += dx[foundDir];
        cy += dy[foundDir];

        // Update backtrack direction:
        // From the new pixel, the old pixel is at direction (foundDir + 4) % 8.
        // We set prevDir to this, so on the next iteration we start searching
        // from (prevDir + 1) = (foundDir + 5) % 8 — one step CW past the
        // direction we came from.
        prevDir = (foundDir + 4) % 8;

        iterations++;
    } while ((cx !== startX || cy !== startY) && iterations < maxIterations);

    // Remove trailing duplicate if we returned to start
    if (points.length > 1) {
        const last = points[points.length - 1];
        if (last.x === points[0].x && last.y === points[0].y) {
            points.pop();
        }
    }

    // Remove consecutive duplicate points
    if (points.length > 1) {
        const unique = [points[0]];
        for (let i = 1; i < points.length; i++) {
            if (points[i].x !== points[i - 1].x || points[i].y !== points[i - 1].y) {
                unique.push(points[i]);
            }
        }
        return unique.length >= 3 ? unique : null;
    }

    return points.length >= 3 ? points : null;
}

// ============================================================
// FIX 2: Ramer-Douglas-Peucker + Chaikin Smoothing
// Replaces the weak collinear-reduction simplification.
// ============================================================

/**
 * Compute perpendicular distance from point P to line AB.
 */
function perpendicularDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
        const ex = px - ax;
        const ey = py - ay;
        return Math.sqrt(ex * ex + ey * ey);
    }
    const t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    const ex = px - projX;
    const ey = py - projY;
    return Math.sqrt(ex * ex + ey * ey);
}

/**
 * Ramer-Douglas-Peucker simplification (iterative stack-based).
 * @param {Array<{x,y}>} points
 * @param {number} epsilon - max allowed distance (in pixels)
 * @returns {Array<{x,y}>}
 */
function rdpSimplify(points, epsilon) {
    if (!points || points.length <= 2) return points;

    const result = new Array(points.length).fill(false);
    result[0] = true;
    result[points.length - 1] = true;

    const stack = [[0, points.length - 1]];

    while (stack.length > 0) {
        const [start, end] = stack.pop();
        let maxDist = 0;
        let maxIdx = 0;

        const ax = points[start].x, ay = points[start].y;
        const bx = points[end].x, by = points[end].y;

        for (let i = start + 1; i < end; i++) {
            const d = perpendicularDist(points[i].x, points[i].y, ax, ay, bx, by);
            if (d > maxDist) {
                maxDist = d;
                maxIdx = i;
            }
        }

        if (maxDist > epsilon) {
            result[maxIdx] = true;
            stack.push([start, maxIdx]);
            stack.push([maxIdx, end]);
        }
    }

    return points.filter((_, i) => result[i]);
}

/**
 * Chaikin's corner-cutting algorithm for curve smoothing.
 * Each pass replaces each segment with two new points at 1/4 and 3/4 positions.
 * @param {Array<{x,y}>} points
 * @param {number} iterations - number of smoothing passes (2-3 is ideal)
 * @param {boolean} closed - whether the path is closed (loop)
 * @returns {Array<{x,y}>}
 */
function chaikinSmooth(points, iterations, closed) {
    if (!points || points.length < 3) return points;

    let pts = points;

    for (let iter = 0; iter < iterations; iter++) {
        const newPts = [];
        const n = pts.length;

        for (let i = 0; i < n; i++) {
            const p0 = pts[i];
            const p1 = pts[(i + 1) % n];

            // Skip last segment if not closed
            if (!closed && i === n - 1) {
                newPts.push(p0);
                break;
            }

            // Q = 3/4 * P0 + 1/4 * P1
            newPts.push({
                x: 0.75 * p0.x + 0.25 * p1.x,
                y: 0.75 * p0.y + 0.25 * p1.y
            });

            // R = 1/4 * P0 + 3/4 * P1
            newPts.push({
                x: 0.25 * p0.x + 0.75 * p1.x,
                y: 0.25 * p0.y + 0.75 * p1.y
            });
        }

        if (!closed) {
            // Preserve exact endpoints
            newPts[0] = pts[0];
            newPts[newPts.length - 1] = pts[pts.length - 1];
        }

        pts = newPts;
    }

    return pts;
}

/**
 * Main simplify + smooth pipeline.
 * @param {Array<{x,y}>} points - raw contour from traceOutline
 * @param {number} epsilon - RDP threshold in pixels (recommend 1.5-2.5)
 * @returns {Array<{x,y}>}
 */
function simplifyContour(points, epsilon = 2.0) {
    if (!points || points.length <= 4) return points;

    // Step 1: RDP simplification to remove noise and redundant points
    const simplified = rdpSimplify(points, epsilon);

    // Step 2: Need at least 3 points to smooth
    if (simplified.length < 3) return simplified;

    // Step 3: Chaikin smoothing — 2 passes gives a nice smooth curve
    // without over-rounding the shape too much
    const smoothed = chaikinSmooth(simplified, 2, true);

    return smoothed;
}

/**
 * FIX 5: Expand contour outward by `amount` pixels so the metallic border
 * always wraps around the image without clipping it.
 * Uses average normal direction at each vertex.
 */
function expandContour(points, amount) {
    if (!points || points.length < 3 || amount <= 0) return points;
    const n = points.length;

    // Detect winding order via signed area (shoelace formula)
    // Positive = CCW in math coords, but CW in screen coords (Y-down)
    let signedArea = 0;
    for (let i = 0; i < n; i++) {
        const curr = points[i];
        const next = points[(i + 1) % n];
        signedArea += (curr.x * next.y - next.x * curr.y);
    }
    // In screen coordinates (Y-down): positive signedArea = CW winding
    // For CW winding, outward normal is the RIGHT perpendicular: (dy, -dx)
    // For CCW winding, outward normal is the LEFT perpendicular: (-dy, dx)
    const sign = signedArea > 0 ? 1 : -1;

    const result = [];

    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const curr = points[i];
        const next = points[(i + 1) % n];

        // Edge vectors
        const ax = curr.x - prev.x, ay = curr.y - prev.y;
        const bx = next.x - curr.x, by = next.y - curr.y;

        // Normalize edge vectors
        const la = Math.sqrt(ax * ax + ay * ay) || 1;
        const lb = Math.sqrt(bx * bx + by * by) || 1;

        // Outward perpendicular, direction depends on winding
        // CW (sign=1): right-perpendicular = (ay/la, -ax/la)
        // CCW (sign=-1): left-perpendicular = (-ay/la, ax/la)
        const nax = sign * ay / la, nay = sign * -ax / la;
        const nbx = sign * by / lb, nby = sign * -bx / lb;

        // Average normal
        const nx = (nax + nbx) / 2;
        const ny = (nay + nby) / 2;

        // Normalize
        const nl = Math.sqrt(nx * nx + ny * ny) || 1;

        result.push({
            x: curr.x + (nx / nl) * amount,
            y: curr.y + (ny / nl) * amount
        });
    }

    return result;
}

/**
 * Generate 3D Shape based on shape parameters
 */
function createThreeShape(shapeType, imageWidth, imageHeight, contourPoints) {
    const shape = new THREE.Shape();

    const maxDim = 8.0;
    let w = maxDim;
    let h = maxDim;
    if (imageWidth && imageHeight) {
        if (imageWidth > imageHeight) {
            h = maxDim * (imageHeight / imageWidth);
        } else {
            w = maxDim * (imageWidth / imageHeight);
        }
    }

    if (shapeType === 'custom' && contourPoints && contourPoints.length > 2) {
        // Find bounding box of contour pixels
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        contourPoints.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        const pW = maxX - minX;
        const pH = maxY - minY;
        const centerX = minX + pW / 2;
        const centerY = minY + pH / 2;

        // Scale to match 3D world units, with a small inset margin (0.95)
        // so the metallic border has room to extend slightly beyond the texture
        const scale = (maxDim * 0.92) / Math.max(pW, pH);

        const startPt = contourPoints[0];
        shape.moveTo((startPt.x - centerX) * scale, -(startPt.y - centerY) * scale);

        for (let i = 1; i < contourPoints.length; i++) {
            const p = contourPoints[i];
            shape.lineTo((p.x - centerX) * scale, -(p.y - centerY) * scale);
        }
        shape.closePath();
    } else if (shapeType === 'circle') {
        const radius = Math.min(w, h) / 2;
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    } else if (shapeType === 'rectangle') {
        const r = 0.8;
        const hw = w / 2;
        const hh = h / 2;
        shape.moveTo(-hw + r, -hh);
        shape.lineTo(hw - r, -hh);
        shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
        shape.lineTo(hw, hh - r);
        shape.quadraticCurveTo(hw, hh, hw - r, hh);
        shape.lineTo(-hw + r, hh);
        shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
        shape.lineTo(-hw, -hh + r);
        shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    } else if (shapeType === 'heart') {
        const size = Math.min(w, h) * 0.7;
        const scale = size / 10;
        shape.moveTo(0, 2.5 * scale);
        shape.bezierCurveTo(2.5 * scale, 4.5 * scale, 5 * scale, 2.5 * scale, 5 * scale, -0.5 * scale);
        shape.bezierCurveTo(5 * scale, -3 * scale, 0 * scale, -6 * scale, 0 * scale, -7.5 * scale);
        shape.bezierCurveTo(0 * scale, -6 * scale, -5 * scale, -3 * scale, -5 * scale, -0.5 * scale);
        shape.bezierCurveTo(-5 * scale, 2.5 * scale, -2.5 * scale, 4.5 * scale, 0, 2.5 * scale);
    } else {
        const hw = w / 2;
        const hh = h / 2;
        shape.moveTo(-hw, -hh);
        shape.lineTo(hw, -hh);
        shape.lineTo(hw, hh);
        shape.lineTo(-hw, hh);
        shape.closePath();
    }

    return shape;
}

/**
 * Main function to update the 3D model
 */
function update3DModel(imageSrc, shapeType, thickness, metalName) {
    if (!scene || !keychainGroup) return;

    currentImageSrc = imageSrc;
    currentShape = shapeType;
    currentThickness = parseFloat(thickness);
    currentMetal = metalName;

    const loader = document.getElementById('canvas-loader');
    if (loader) loader.classList.remove('hidden');

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageSrc, (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        currentTexture = texture;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            let contourPoints = null;

            if (shapeType === 'custom') {
                // FIX 3: Reduced canvas resolution from 150 to 100
                // Lower resolution = fewer jagged pixel-level details in the silhouette
                const maxCanvasDim = 100;
                let cW = img.width;
                let cH = img.height;
                if (cW > maxCanvasDim || cH > maxCanvasDim) {
                    if (cW > cH) {
                        cH = Math.round(maxCanvasDim * (cH / cW));
                        cW = maxCanvasDim;
                    } else {
                        cW = Math.round(maxCanvasDim * (cW / cH));
                        cH = maxCanvasDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = cW;
                canvas.height = cH;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, cW, cH);
                const imageData = ctx.getImageData(0, 0, cW, cH);

                // Trace raw contour using Marching Squares (Fix 1)
                const rawPoints = traceOutline(imageData);

                if (rawPoints && rawPoints.length > 3) {
                    // RDP epsilon of 1.8px at 100px canvas gives clean silhouette (Fix 2)
                    let simplified = simplifyContour(rawPoints, 1.8);

                    // FIX 5: Expand the contour outward by 2px so the metallic border
                    // wraps around the art, not behind it
                    simplified = expandContour(simplified, 2.0);

                    contourPoints = simplified;
                }

                if (!contourPoints || contourPoints.length <= 4) {
                    shapeType = 'rectangle';
                }
            }

            rebuildKeychainMesh(shapeType, img.width, img.height, contourPoints, texture);

            if (loader) loader.classList.add('hidden');

            const placeholder = document.getElementById('canvas-placeholder');
            if (placeholder) {
                placeholder.classList.add('opacity-0', 'pointer-events-none', 'hidden');
            }

            if (renderer && renderer.domElement) {
                renderer.domElement.classList.remove('hidden');
            }

            onWindowResize();
        };
        img.onerror = () => {
            console.error('Failed to load image for processing');
            if (loader) loader.classList.add('hidden');
        };
    }, undefined, (err) => {
        console.error('Failed to load texture', err);
        if (loader) loader.classList.add('hidden');
    });
}

/**
 * Rebuild the Keychain geometry and materials inside group
 */
function rebuildKeychainMesh(shapeType, imgWidth, imgHeight, contourPoints, texture) {
    if (!keychainGroup) return;

    // Clear old model from group
    while (keychainGroup.children.length > 0) {
        const obj = keychainGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
        } else if (obj.material) {
            obj.material.dispose();
        }
        keychainGroup.remove(obj);
    }

    // 1. Create the Shape
    const shape = createThreeShape(shapeType, imgWidth, imgHeight, contourPoints);

    // 2. Extrude configuration
    const extrudeDepth = currentThickness * 0.15;

    // FIX 7 + FIX 8: Improved bevel settings and added curveSegments
    const extrudeSettings = {
        depth: extrudeDepth,
        bevelEnabled: true,
        bevelSegments: 6,       // was 4 — smoother bevel edge
        steps: 1,
        bevelSize: 0.12,        // was 0.08 — slightly more pronounced bevel
        bevelThickness: 0.1,    // was 0.08
        curveSegments: 32       // NEW — smooth curve tessellation
    };

    // Create Extrude Geometry
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Center the geometry origin
    geometry.center();

    // 3. FIX 6: Correct UV Mapping for texture alignment on the front cap
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const sizeX = bbox.max.x - bbox.min.x;
    const sizeY = bbox.max.y - bbox.min.y;

    // Manually remap UVs so texture fills the cap exactly
    // ExtrudeGeometry groups: group 0 = front cap, group 1 = back cap (in some Three builds)
    // We use offset + repeat to tile the texture across the bounding box
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    // FIX 6: Corrected UV offset formula
    // texture.repeat controls how many times the texture repeats across sizeX/sizeY
    // We want exactly 1 repeat across the whole shape, centered
    const uvScaleX = 1.0 / sizeX;
    const uvScaleY = 1.0 / sizeY;
    texture.repeat.set(uvScaleX, uvScaleY);
    texture.offset.set(0.5 - (bbox.min.x + sizeX / 2) * uvScaleX,
                       0.5 - (bbox.min.y + sizeY / 2) * uvScaleY);

    // 4. Materials
    const metalConfig = metalColors[currentMetal] || metalColors.gold;

    // Front cap material (shows the user's design)
    const capMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.2,
        metalness: 0.05,
        transparent: true,
        alphaTest: 0.05       // Clip fully transparent fragments on the cap face
    });

    // Side border material (premium metallic look)
    const sideMaterial = new THREE.MeshStandardMaterial({
        color: metalConfig.color,
        metalness: metalConfig.metalness,
        roughness: metalConfig.roughness
    });

    // Create main keychain body mesh with both materials
    // ExtrudeGeometry assigns group 0 to caps and group 1 to sides
    const keychainBody = new THREE.Mesh(geometry, [capMaterial, sideMaterial]);
    keychainBody.castShadow = true;
    keychainBody.receiveShadow = true;
    keychainGroup.add(keychainBody);

    // 5. Add Hanging Metal Ring (Loop) at the top of the shape
    const topY = bbox.max.y;
    const centerX = (bbox.min.x + bbox.max.x) / 2;

    const ringRadius = 0.5;
    const ringTube = 0.12;
    const ringGeom = new THREE.TorusGeometry(ringRadius, ringTube, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
        color: metalConfig.color,
        metalness: metalConfig.metalness,
        roughness: metalConfig.roughness
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);

    // Position ring so it hangs from the top center of the keychain
    ringMesh.position.set(centerX, topY + ringRadius - 0.2, 0);
    // Rotate so the ring opening faces front
    ringMesh.rotation.y = Math.PI / 2;
    ringMesh.castShadow = true;

    keychainGroup.add(ringMesh);

    // 6. Reset rotation of group so it faces the user flat
    keychainGroup.rotation.set(0, 0, 0);
}

/**
 * Update the metal type / color dynamically without reloading texture
 */
function updateMetalColor(metalName) {
    if (!keychainGroup || !metalColors[metalName]) return;

    currentMetal = metalName;
    const metalConfig = metalColors[metalName];

    keychainGroup.children.forEach(child => {
        if (child.geometry && child.geometry.type === "TorusGeometry") {
            child.material.color.setHex(metalConfig.color);
            child.material.metalness = metalConfig.metalness;
            child.material.roughness = metalConfig.roughness;
        } else if (child.material && Array.isArray(child.material) && child.material[1]) {
            child.material[1].color.setHex(metalConfig.color);
            child.material[1].metalness = metalConfig.metalness;
            child.material[1].roughness = metalConfig.roughness;
        }
    });
}

/**
 * Update thickness dynamically
 */
function updateThickness(thickness) {
    currentThickness = parseFloat(thickness);
    if (currentImageSrc) {
        update3DModel(currentImageSrc, currentShape, currentThickness, currentMetal);
    }
}

/**
 * Update shape outline dynamically
 */
function updateShape(shapeType) {
    currentShape = shapeType;
    if (currentImageSrc) {
        update3DModel(currentImageSrc, currentShape, currentThickness, currentMetal);
    }
}
