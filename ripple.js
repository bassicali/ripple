'use strict';

var gl = null;
var params = null;
var shaders = null;
var fields = null;

var sim = {
    canvas: null,
    context: null,
    currentTime: 0,
    delta_t: 0,
    paused: false,
    heightMap: null,
    displayField: 0,
    camera: null,
    projection: null,
    invProjView: null,

    fpsDisplay: null,
    posDisplay: null,
    screenQuad: null,
    rightMouseDown: false,
    leftMouseDown: false,
    lastMousePos: null
}

var gui = null;
var simSettings = {
    FrameRate: '',
    KeySensitivity: 0.8,
    WheelSensitivity: 0.05,
}

var fbos = {
    heightMap: null,
    normalMap: null
}

var surface = {
    width: 80,
    height: 150,
    cornerTL: null,
    cornerTR: null,
    cornerBL: null,
    cornerBR: null,
    mesh: null,
    model: null
}

var floaties = {
    vertexList: null,
    positions: [],
    matrices: []
};

var force = {
    pos: null
}

var env = {
    isMobile: false,
    isFirefox: false,
    textureType: null,
    supportsLinearSampling: false,
    filtering: null
}

window.onload = init;
window.onresize = resize;
window.addEventListener('error', (e) => { console.error("Error in ripple.js: " + e.message) });

var readpixels = false;
var showheights = false;
const sentivity = 0.8;

var keyHandlers = {
    'w': function() {
        sim.camera.orbitX(simSettings.KeySensitivity, new Vec3(0, 0, 0));
        updateInvProjViewMatrix();
    },
    's': function()  {
        sim.camera.orbitX(-simSettings.KeySensitivity, new Vec3(0, 0, 0));
        updateInvProjViewMatrix();
    },
    'a': function()  {
        sim.camera.orbitY(-simSettings.KeySensitivity, new Vec3(0, 0, 0));
        updateInvProjViewMatrix();
    },
    'd': function()  {
        sim.camera.orbitY(simSettings.KeySensitivity, new Vec3(0, 0, 0));
        updateInvProjViewMatrix();
    },
    '1': function()  {
        sim.displayField = 0;
    },
    '2': function()  {
        sim.displayField = 1;
    },
    '3': function()  {
        sim.displayField = 2;
    },
    '4': function()  {
        sim.displayField = 3;
    },
    'h': function()  {
        showheights = !showheights;
    },
    'p': function() {
        sim.paused = !sim.paused;
    }
}

function init() {
    env.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    env.isFirefox = /Firefox/i.test(navigator.userAgent);

    sim.canvas = document.getElementById('mainCanvas');
    sim.canvas.width = document.body.clientWidth;
    sim.canvas.height = document.body.clientHeight;

    if (env.isMobile) {
        let w = (window.innerWidth > 0) ? window.innerWidth : screen.width;
        if (w <= 400) {
            sim.canvas.width = w;
            sim.canvas.height = w;
        }
    }

    gl = sim.canvas.getContext('webgl');

    if (gl == null) {
        alert('Your browser or device does not support webgl :(');
        return;
    }

    // On my iphone this extension is supported but trying to render to it doesn't work
    if (!env.isMobile) {
        let fullFloatExt = gl.getExtension('OES_texture_float');
        if (fullFloatExt != null) {
            env.textureType = gl.FLOAT;

            let linearFilteringExt = gl.getExtension('OES_texture_float_linear');
            if (linearFilteringExt != null) {
                env.supportsLinearSampling = true;
            }
        }
    }

    if (env.textureType == null) {
        let halfFloatExt = gl.getExtension('OES_texture_half_float');
        if (halfFloatExt != null) {
            env.textureType = halfFloatExt.HALF_FLOAT_OES;

            let linearFilteringExt = gl.getExtension('OES_texture_half_float_linear');
            if (linearFilteringExt != null) {
                env.supportsLinearSampling = true;
            }
        }
    }

    if (env.textureType == null) {
        alert('Your browser or device does not support floating point textures :(');
        return;
    }

    env.filtering = env.supportsLinearSampling ? gl.LINEAR : gl.NEAREST;

    sim.canvas.addEventListener('contextmenu', e => { e.preventDefault(); return false; });

    sim.canvas.addEventListener('wheel', ev => {
        ev.preventDefault();
        sim.camera.zoom(ev.deltaY * simSettings.WheelSensitivity);
        updateInvProjViewMatrix();
        updatePosDisplay();
    });

    sim.canvas.addEventListener('mousedown', ev => {
        if (ev.button == 2) {
            sim.rightMouseDown = true;
        }
        else if (ev.button == 0) { 
            sim.leftMouseDown = true;
        }
    });

    sim.canvas.addEventListener('mouseup', ev => {
        if (ev.button == 2) {
            sim.rightMouseDown = false;
            sim.lastMousePos = null;
        }
        else if (ev.button == 0) {
            sim.leftMouseDown = false;
            force.pos = null;
            updatePosDisplay();
        }
    });

    sim.canvas.addEventListener('mousemove', ev => {
        if (sim.rightMouseDown) {
            let pos = getRelativeMousePos(ev);

            if (sim.lastMousePos != null) {
                let delta = pos.subtract(sim.lastMousePos);
                sim.camera.pan(new Vec2(delta.x * 0.01, delta.y * 0.01));
                updateInvProjViewMatrix();
                updatePosDisplay();
            }

            sim.lastMousePos = pos;
        }
        else if (sim.leftMouseDown) {
            let pos = getRelativeMousePos(ev);
            rayCastFromScreen(pos.x, gl.drawingBufferHeight - pos.y);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key in keyHandlers) {
            keyHandlers[e.key]();
        }

        updatePosDisplay();
    });


    let w = 1 - 0.5 / surface.width;
    let h = 1 - 0.5 / surface.height;
    sim.screenQuad = new VertexList([w, -h, 0,
                                     w,  h, 0, 
                                    -w,  h, 0,
                                    -w,  h, 0,
                                     w, -h, 0,
                                    -w, -h, 0], null);

    sim.fpsDisplay = document.getElementById('fpsText');
    sim.posDisplay = document.getElementById('posText');

    let vs = new Shader(gl.VERTEX_SHADER, document.getElementById('surface_vert').textContent);
    let texVs = new Shader(gl.VERTEX_SHADER, document.getElementById('tex_coords').textContent);
    let objVs = new Shader(gl.VERTEX_SHADER, document.getElementById('object_vert').textContent);

    shaders = {
        showTexture: new ShaderProgram(texVs, new Shader(gl.FRAGMENT_SHADER, document.getElementById('show_texture').textContent)),
        view: new ShaderProgram(vs, new Shader(gl.FRAGMENT_SHADER, document.getElementById('surface_frag').textContent)),
        floaties: new ShaderProgram(objVs, new Shader(gl.FRAGMENT_SHADER, document.getElementById('object_frag').textContent)),
        evolveHeightMap: new ShaderProgram(texVs, new Shader(gl.FRAGMENT_SHADER, document.getElementById('evolve_height_map').textContent)),
        calcVelocity: new ShaderProgram(texVs, new Shader(gl.FRAGMENT_SHADER, document.getElementById('calc_velocity').textContent)),
        calcNormalMap: new ShaderProgram(texVs, new Shader(gl.FRAGMENT_SHADER, document.getElementById('calc_normal_map').textContent)),
    }

    surface.model = new Matrix4x4([1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]);
    sim.projection = Matrix4x4.createProjection(45, sim.canvas.width / sim.canvas.height, 0.1, 500);
    
    sim.camera = new Camera({ pos: new Vec3(0, 37, 97), target: new Vec3(0, 0, 0) });
    //sim.camera = new Camera({ pos: new Vec3(2.36, 67.89, 156.79), target: new Vec3(0, 0, 0) });
    updateInvProjViewMatrix();

    surface.size = new Vec2(surface.width, surface.height);
    surface.cornerTR = new Vec3(surface.width/2, 0, surface.height/2);
    surface.cornerBL = surface.cornerTR.mulf(-1);
    surface.cornerTL = new Vec3(surface.cornerBL.x, 0, surface.cornerTR.z);
    surface.cornerBR = new Vec3(surface.cornerTR.x, 0, surface.cornerBL.z);

    const meshScale = 1;
    surface.mesh = createSurfaceMesh(surface.cornerBL, surface.cornerTR, surface.width * meshScale, surface.height * meshScale);
    fbos.heightMap = new SwapFBO(surface.width, surface.height);
    fbos.normalMap = new FBO(surface.width, surface.height);
    fbos.velocity = new SwapFBO(surface.width, surface.height);

    let c = new Vec3(0.5, 0.5, 0.5);
    let cubeVerts =
    [
         c.x, -c.y,  c.z,
         c.x,  c.y,  c.z,
        -c.x,  c.y,  c.z,
        -c.x, -c.y,  c.z,

         c.x, -c.y, -c.z,
         c.x,  c.y, -c.z,
        -c.x,  c.y, -c.z,
        -c.x, -c.y, -c.z,
    ];

    let indices = [
        7, 4, 5,
        5, 6, 7,

        3, 0, 1,
        1, 2, 3,

        2, 6, 7,
        7, 3, 2,

        1, 5, 4,
        4, 0, 1,

        7, 4, 0,
        0, 3, 7,

        6, 5, 1,
        1, 2, 6
    ];

    floaties.mesh = new VertexList(cubeVerts, indices);
    let sc = 1.0;
    let y = sc / 2;
    for (let i = 0; i < 5; i++) {
        let x = (Math.random() - 0.5) * surface.width;
        let z = (Math.random() - 0.5) * surface.height;
        floaties.positions.push(new Vec3(x, y, z));
        floaties.matrices.push(new Matrix4x4([sc, 0, 0, 0], [0, sc, 0, 0], [0, 0, sc, 0], [x, y, z, 1]));
    }

    updatePosDisplay();

    gl.enable(gl.DEPTH_TEST);

    setupGUI();

    window.requestAnimationFrame(tick);
}

function setupGUI() {
    gui = new dat.GUI({
        name: 'Settings'
    });

    gui.add(simSettings, 'FrameRate');
    gui.add(simSettings, 'KeySensitivity', 0.1, 5.0, 0.1);
    gui.add(simSettings, 'WheelSensitivity', 0.01, 1.0, 0.01);

    gui.__controllers[0].domElement.disabled = true;
}

function resize() {
    sim.canvas.width = document.body.clientWidth;
    sim.canvas.height = document.body.clientHeight;
}

function tick(timestamp) {
    timestamp /= 1000;
    sim.delta_t = sim.currentTime == 0 ? 0.016667 : timestamp - sim.currentTime;
    sim.currentTime = timestamp;
    simSettings.FrameRate = `${(1 / sim.delta_t).toFixed(2)} Hz`;

    if (!sim.paused) {
        evolveHeightMap();
        calculateVelocity();
        moveObjects();
        calculateNormalMap();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, sim.canvas.width, sim.canvas.height);
    shaders.view.use();
    shaders.view.setMatrix4x4('model', surface.model);
    shaders.view.setMatrix4x4('view', sim.camera.viewMatrix);
    shaders.view.setMatrix4x4('proj', sim.projection);
    shaders.view.setTexture('height_map', fbos.heightMap.front.texture, 0);
    shaders.view.setTexture('normal_map', fbos.normalMap.texture, 1);
    shaders.view.setTexture('velocity', fbos.velocity.front.texture, 2);
    shaders.view.setVec3('camera_pos', sim.camera.pos);
    shaders.view.setVec3('light_colour', new Vec3(1.0, 1.0, 1.0));
    shaders.view.setVec3('surface_colour', new Vec3(0.0, 0.0, 1.0));
    shaders.view.setVec4('bounds', new Vec4(surface.cornerBL.x, surface.cornerBL.z, surface.cornerTR.x, surface.cornerTR.z));
    shaders.view.setInt('display_field', sim.displayField);
    
    surface.mesh.bind();
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, surface.mesh.numVertices);

    floaties.mesh.bind();
    gl.enableVertexAttribArray(0);
    shaders.floaties.use();
    shaders.floaties.setMatrix4x4('view', sim.camera.viewMatrix);
    shaders.floaties.setMatrix4x4('proj', sim.projection);
    //shaders.floaties.setVec3('colour', new Vec3(1.0, 1.0, 0.0));
    for (let model of floaties.matrices) {
        shaders.floaties.setMatrix4x4('model', model);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

    gui.__controllers[0].updateDisplay();

    window.requestAnimationFrame(tick);
}

function evolveHeightMap() {
    gl.viewport(0, 0, surface.width, surface.height);
    shaders.evolveHeightMap.use();
    shaders.evolveHeightMap.setVec2('tex_size', surface.size);
    shaders.evolveHeightMap.setVec4('bounds', new Vec4(surface.cornerBL.x, surface.cornerBL.z, surface.cornerTR.x, surface.cornerTR.z));
    shaders.evolveHeightMap.setTexture('height_map', fbos.heightMap.front.texture, 0);
    shaders.evolveHeightMap.setFloat('radius', 2.0);
    shaders.evolveHeightMap.setFloat('dissipation', 0.9);
    shaders.evolveHeightMap.setInt('force_active', force.pos != null ? 1 : 0);
    shaders.evolveHeightMap.setVec3('force_pos', force.pos != null ? force.pos : new Vec3(0, 0, 0));
    
    sim.screenQuad.bind();
    gl.enableVertexAttribArray(0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.heightMap.back.buffer);
    gl.drawArrays(gl.TRIANGLES, 0, sim.screenQuad.numVertices);

    fbos.heightMap.swap();
}

function calculateNormalMap() {
    gl.viewport(0, 0, surface.width, surface.height);
    shaders.calcNormalMap.use();
    shaders.calcNormalMap.setVec2('tex_size', surface.size);
    shaders.calcNormalMap.setVec4('bounds', new Vec4(surface.cornerBL.x, surface.cornerBL.z, surface.cornerTR.x, surface.cornerTR.z));
    shaders.calcNormalMap.setTexture('height_map', fbos.heightMap.front.texture, 0);

    sim.screenQuad.bind();
    gl.enableVertexAttribArray(0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.normalMap.buffer);
    gl.drawArrays(gl.TRIANGLES, 0, sim.screenQuad.numVertices);
}

function calculateVelocity() {
    gl.viewport(0, 0, surface.width, surface.height);
    shaders.calcVelocity.use();
    shaders.calcVelocity.setVec2('tex_size', surface.size);
    shaders.calcVelocity.setTexture('height_map', fbos.heightMap.front.texture, 0);
    shaders.calcVelocity.setTexture('velocity', fbos.velocity.front.texture, 1);

    sim.screenQuad.bind();
    gl.enableVertexAttribArray(0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.back.buffer);
    gl.drawArrays(gl.TRIANGLES, 0, sim.screenQuad.numVertices);

    fbos.velocity.swap();
}

function moveObjects() {
    let pixels = new Float32Array(2 * 2 * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbos.velocity.front.buffer);
    let newPositions = [];
    let i = 0;
    for (let pos of floaties.positions) {
        let texPosX = Math.floor(pos.x + (surface.width / 2));
        let texPosY = Math.floor(pos.z + (surface.height / 2));

        gl.readPixels(texPosX, texPosY, 2, 2, gl.RGBA, gl.FLOAT, pixels);

        //let velocity = new Vec3(1, 0, 1);
        let velocity = new Vec3(pixels[0], 0, pixels[1]);
        let newPos = pos.add(velocity.mulf(1.0));
        newPos = newPos.clamp(new Vec3(surface.cornerBL.x, 0, surface.cornerBL.z), new Vec3(surface.cornerTR.x, 0, surface.cornerTR.z));
        floaties.matrices[i].setPos(newPos);
        newPositions.push(newPos);
        
        i++;
    }

    floaties.positions = newPositions;
}

function createSurfaceMesh(cornerMin, cornerMax, columns, rows) {
    let vertices = [];

    let diff = cornerMax.subtract(cornerMin);
    let dx = diff.x / columns;
    let dz = diff.z / rows;

    function addVert(x, y, z) {
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);
    }

    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            let x = cornerMin.x + i * dx;
            let z = cornerMin.z + j * dz;
            // lower triangle
            addVert(x, 0, z);
            addVert(x + dx, 0, z);
            addVert(x, 0, z + dz);

            // upper triangle
            addVert(x + dx, 0, z);
            addVert(x, 0, z + dz);
            addVert(x + dx, 0, z + dz);
        }
    }

    return new VertexList(vertices, null);
}

function updateInvProjViewMatrix() {
    sim.invProjView = sim.projection.mulm(sim.camera.viewMatrix).inverse();
}

function rayCastFromScreen(x, y) {
    let scrCoord = new Vec4(0, 0, 0, 0);
    let hwidth = gl.drawingBufferWidth / 2;
    let hheight = gl.drawingBufferHeight / 2;
    scrCoord.x = (x - hwidth) / hwidth; // Move to range [-1,+1]
    scrCoord.y = (y - hheight) / hheight;
    scrCoord.z = sim.camera.pos.z;
    scrCoord.w = 1;

    let pickCoord = sim.invProjView.mulv(scrCoord);
    pickCoord = pickCoord.divf(pickCoord.w);

    let ro = sim.camera.pos;
    let delta = new Vec3(pickCoord.x, pickCoord.y, pickCoord.z).subtract(ro);
    let rd = delta.normalize();
    let intersection = lineIntersectsRect(ro, rd, surface.cornerTL, surface.cornerTR, surface.cornerBL, surface.cornerBR);

    if (intersection != null) {
        force.pos = intersection;
    }
    else {
        force.pos = null;
    }

    updatePosDisplay();
}

function lineIntersectsRect(lp, ld, tl, tr, bl, br) {
    function isBetween(x, a, b) {
        if (a < b) {
            return x >= a && x <= b;
        }

        if (a > b) {
            return x >= b && x <= a;
        }

        return false;
    }

    let h = bl.add(tl.subtract(bl).mulf(0.5));
    let center = h.add(tr.subtract(br).mulf(0.5));
    let normal = tl.subtract(br).cross(tr.subtract(bl)).normalize();

    let x = lineIntersectsPlane(lp, ld, center, normal);
    if (x == null) { 
        return null;
    }

    let u = tl.subtract(tr);
    let v = tl.subtract(bl);

    let dotu = u.dot(x);
    let dotv = v.dot(x);

    if (isBetween(dotu, u.dot(tl), u.dot(tr))
        && isBetween(dotv, v.dot(tl), v.dot(bl))) {
        return x;
    }

    return null;
}

function lineIntersectsPlane(lp, ld, pp, pn) {
    const EPSILON = 0.0000001;

    let numer = pp.subtract(lp).dot(pn);
    if (Math.abs(numer) <= EPSILON) {
        return null;
    }

    let denom = ld.dot(pn);
    if (Math.abs(denom) <= EPSILON) {
        return null;
    }

    let d = numer / denom;
    let intersection = lp.add(ld.mulf(d));

    return intersection;
}

function getRelativeMousePos(mouse) {
    let rect = sim.canvas.getBoundingClientRect();
    let scx = sim.canvas.width / rect.width;
    let scy = sim.canvas.height / rect.height;
    let x = (mouse.clientX - rect.left) * scx;
    let y = (mouse.clientY - rect.top) * scy;
    return new Vec2(x, y);
}

function updatePosDisplay() {
    // let text = `Position: (${sim.camera.pos.toString()})    Direction: (${sim.camera.dir.mulf(-1).toString()})`;
    // if (force.pos != null) {
    //     text += ` Force: (${force.pos.toString()})`;
    // }

    // sim.posDisplay.innerText = text;
}
