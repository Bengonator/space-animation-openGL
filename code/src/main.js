// #region defaults
// the OpenGL context
var gl = null;
var program = null;

let shaders = {};

// Camera
var camera = null;
var cameraPos = vec3.create();
var cameraCenter = vec3.create();
var cameraAnimation = null;

// scenegraph root node
var root = null;

// time in last render step
var previousTime = 0;
// #endregion

// load the shader resources using a utility function
loadResources({

  vs: './src/shader/phong.vs.glsl',
  fs: './src/shader/phong.fs.glsl',
  vs_single: './src/shader/single.vs.glsl',
  fs_single: './src/shader/single.fs.glsl',

  // EDIT: load external objects
  // these models are either self-created or downloaded (and maybe modified) from https://sketchfab.com
  // sources are in the folders next to the .obj files
  cargo_spaceship: './src/models/cargo_spaceship/cargo_spaceship.obj',
  fighter_spaceship: './src/models/fighter_spaceship/fighter_spaceship.obj',
  car_close: './src/models/car/car_close.obj',
  car_medium: './src/models/car/car_medium.obj',
  car_far: './src/models/car/car_far.obj',
  antenna: './src/models/antenna/antenna.obj',
  holocron: './src/models/holocron/holocron.obj',
  flashlight: './src/models/flashlight/flashlight.obj'

}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  
  init(resources);
  render(0);
});

// initializes OpenGL context, compile shader, and load buffers
function init(resources) {
  
  DEBUG = false;
  // DEBUG = true; // comment this line, if debug mode should be off

  // create a GL context
  gl = createContext();

  // setup camera at end position of camera-animation
  const x = 2;
  const y = 1.5;
  const z = 50;
  const xd = -125;
  const yd = 0;

  camera = animationStart(x, y, z); // enter the values of the final animation
  camera.control.lookingDir.x = xd;
  camera.control.lookingDir.y = yd;

  if (DEBUG) {
    camera = BirdsEyeDebug();
  }

  // EDIT: set camera animation path
  // setup an animation for the camera, moving it into position
  cameraAnimation = new Animation(
    camera, 
    [
      // // initiation
      // getAnimationMatrix(5, 0, -3, 0, 0, 0, 1),    // just to make sure, that the animation starts at the position we want
      // getAnimationMatrix(5, 0, -3, 0, 0, 0, 1000), // short delay at start, does not count towards the 30 seconds

      // // move to the right of first planet, rotate left
      // getAnimationMatrix(0, 0, 14, 0, 0, 0, 4500),
      // getAnimationMatrix(1, 0, 18, 0, 5, 0, 2000),
      // getAnimationMatrix(2, 0, 22, 0, 10, 0, 2000),

      // // move in front of second planet
      // getAnimationMatrix(4, 0, 26, 7, 11, 0, 3900),   // rotate down to see cargo ship
      // getAnimationMatrix(8, 0, 33, -10, 12, 0, 3800), // rotate up to see the planet

      // // quickly move and rotate to the right (because scared of fighters racing past)
      // getAnimationMatrix(4, 5, 30, -14, -14, -8, 1000),
      
      // // move to the left of the car, rotate right
      // getAnimationMatrix(4, 3, 30, 6, -30, 0, 3500),  // look at car
      getAnimationMatrix(x, y, z, yd, xd, 0, 8000),   // look further right and move to backdoors
    ], 
    false
  );

  if (!DEBUG) cameraAnimation.start()
  
  loadShaders(gl, resources);
  root = createSceneGraph(gl, resources);
}

function loadShaders(gl, resources){
  shaders.phong = createProgram(gl, resources.vs, resources.fs);
}

function createSceneGraph(gl, resources) {

  // create scenegraph
  const root = new ShaderSGNode(shaders.phong);

  // EDIT: adding nodes
  // #region sun
  createLightSource(
    resources, root, 35,
    -25, 0, 120
  );
  // #endregion
  
  // #region planet with one moon
  p1 = createPlanet(root, 6, -1.5, 25, 1.5, 10000, 36);    
  createMoon(p1, 3, 1, 0, 0.4);
  // #endregion
  
  // #region cargo spaceship
  createMovingSpaceObject(
    root, resources.cargo_spaceship, 0.3,
    20, -30, 0,     // angles
    100, -10, -50,  // from
    -30, -20, 200,  // to
    25000           // duration
  );
  // #endregion

  // #region planet with three moons
  p2 = createPlanet(root, 15, 4.7, 50, 2, 13000, 36, true);  
  createMoon(p2, 3, -1, 0, 0.2);
  createMoon(p2, -2, -1, 3, 0.25);
  createMoon(p2, 4, 1, 0, 0.25);
  // #endregion
  
  // #region a fighter-spaceship triplet, which scares the pilot
  createMovingSpaceObject( // left
    root, resources.fighter_spaceship, 0.001,
    100, 220, 200,
    142, -199.5, -99.5,
    //10, 5.5, 42.5,  // these are the values, where the spaceship is perfectly between planet2 and the camera
    -122, 210.5, 186.5,
    35000
  );
  createMovingSpaceObject( // middle
    root, resources.fighter_spaceship, 0.001, 
    100, 220, 200,
    140, -200, -100,
    //8, 5, 43,  // these are the values, where the spaceship is perfectly between planet2 and the cameraw
    -124, 210, 186,
    35000
  );
  createMovingSpaceObject( // right
    root, resources.fighter_spaceship, 0.001,
    100, 220, 200,
    139.1, -202, -100.5,
    //7.1, 3, 43.5,  // these are the values, where the spaceship is perfectly between planet2 and the camera
    -124.9, 208, 186.5,
    35000
  );
  // #endregion

  // #region big planet with moons which have moons
  p3 = createPlanet(root, -2, -1, 60, 3.5, 19000, 36);

  m1 = createPlanet(p3, 4, 0, 5, 1.2, 3000, 36);
  createMoon(m1, 2, -0.3, -0.5, 0.25);
  createMoon(m1, -1, 0.3, 1.5, 0.2);

  m2 = createPlanet(p3, -5.2, 1.5, 2.7, 1, 7000, 36, true);
  createMoon(m2, 1.4, -0.3, -0.9, 0.25);

  createMoon(p3, -3, -1.5, -5, 0.7);
  // #endregion
  
  // #region car
  carGroup = new TransformationSGNode(
    glm.transform(
      {
        translate: [-12, 1.5, 40],
        rotateY: -130,
      },
      []
    )
  );
  nonCameraAnimations.push(
    new Animation(
      carGroup,
      getZrotationAnimation(-12, 1.5, 40, 0, -130, 360, 20000, 36, 1),
      true // infinite loop
    )
  );

  // car
  createSpaceObject(
    carGroup, resources.car_far, 0.03,
    0, 0, 0,
    0, -2, 0,
    false
  );
  // for the special effect 'level of detail'
  carGroup // whole group
    .children[0] // three children and pick car
      .children[0] // material node as children and pick it    // todo change if not just material but also something with shader
        .children[0] // render node as children and pick it
        = new MultiModelRenderSGNode(resources.car_close, resources.car_medium, resources.car_far, 26, 38);

  // antenna
  nonCameraAnimations.push(
    new Animation(
      createSpaceObject(
        carGroup, resources.antenna, 0.1,
        0, 0, 0,
        0.25, 0.905, 0
      ),
      getYrotationAnimation(0.25, 0.905, 0, 7500, 36, true, 0.1),
      true
    )
  );

  // holocron
  nonCameraAnimations.push(
    new Animation(
      createSpaceObject(
        carGroup, resources.holocron, 0.04,
        0, 0, 0,
        0, -1, 0
      ),
      getYrotationAnimation(0, -1, -0.25, 1500, 36, false, 0.03),
      // [
      //   getAnimationMatrix(0, -1, -10, 0, 0, -5, 6000, 0.04),
      //   getAnimationMatrix(0, -1, -0.25, 0, 0, -5, 3000, 0.04)
      // ],
      true
    )
  );

  // flashlight
  let flashlight = createSpaceObject(
    carGroup, resources.flashlight, 0.5,
    0, -65, -25,
    -3, 2, -5,
    false
  )
  createLightSource(resources, flashlight, 0.17,
    0.9, 0, 0,
    false
  )

  root.append(carGroup);
  // #endregion

  nonCameraAnimations.forEach(animation => animation.start());

  return root;
}

// render one frame
function render(timeInMilliseconds) {

  // check for resize of browser window and adjust canvas sizes
  checkForWindowResize(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.03, 0.10, 1);

  // clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  // create projection Matrix and context for rendering
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0, 1, -10], [0, 0, 0], [0, 1, 0]);

  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;

  // update animation BEFORE camera
  cameraAnimation.update(deltaTime);
  camera.update(deltaTime);

  // at the end of the automatic flight, switch to manual control
  if(!cameraAnimation.running && !camera.control.enabled) {
    camera.control.enabled = true;
  }

  // EDIT: update each animation
  nonCameraAnimations.forEach(animation => animation.update(deltaTime));

  // apply camera
  camera.render(context);

  // render scene
  root.render(context);

  // request another call as soon as possible
  requestAnimationFrame(render);
}

// #region functions, objects, ... we created

// #region helpers
function animationStart(x, y, z) {  
  return new UserControlledCamera(gl.canvas, vec3.fromValues(x, y, z));
}

// Birdseye-view of planets, moons and space-objects, only sun can not be seen.
function BirdsEyeDebug() {
  cameraStartPos = vec3.fromValues(0, 95, 44);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);
  camera.control.lookingDir.y = -89.99;

  return camera
}

{ // Calculate distance between two nodes
  const xInMat = 12;
  const yInMat = 13;
  const zInMat = 14;

  function getDistance(matrix) {
    const coords = getCoordsFromMatrix(matrix);

    let applySqareRoot = 0;

    for (let i = 0; i < 3; i++) {
      applySqareRoot += square(coords[i]);
    }

    return Math.sqrt(applySqareRoot);
  }

  function getCoordsFromMatrix(matrix) {  
    return [matrix[xInMat], matrix[yInMat], matrix[zInMat]];
  }

  function square(val) {
    return Math.pow(val, 2);
  }
}
// #endregion

// #region Creation
const prec = 80; // how many latitude and longitude lines should a sphere have

function createLightSource(
  resources, parent, size,
  x, y, z,
  isSun = true) {

  // https://learnopengl.com/Lighting/Basic-Lighting
  // Ambient lighting: even when it is dark there is usually still some light somewhere in the world (the moon, a distant light) so objects are almost never completely dark. To simulate this we use an ambient lighting constant that always gives the object some color.
  // Diffuse lighting: simulates the directional impact a light object has on an object. This is the most visually significant component of the lighting model. The more a part of an object faces the light source, the brighter it becomes.
  // Specular lighting: simulates the bright spot of a light that appears on shiny objects. Specular highlights are more inclined to the color of the light than the color of the object

  // create white light node
  let light = new LightSGNode();
  light.ambient = [0.6, 0.6, 0.6, 1];
  light.diffuse = [1, 1, 1, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [x, y, z];
  if (!isSun) light.uniform = "u_light2";

  light.append(
    new ShaderSGNode(
      createProgram(gl, resources.vs_single, resources.fs_single),
      new RenderSGNode(makeSphere(size, prec, prec))
    )
  );

  parent.append(light)

  return light;
}

// unused
function createSpotLightSource(resources, parent, size, x, y, z) {

  // https://learnopengl.com/Lighting/Basic-Lighting
  // Ambient lighting: even when it is dark there is usually still some light somewhere in the world (the moon, a distant light) so objects are almost never completely dark. To simulate this we use an ambient lighting constant that always gives the object some color.
  // Diffuse lighting: simulates the directional impact a light object has on an object. This is the most visually significant component of the lighting model. The more a part of an object faces the light source, the brighter it becomes.
  // Specular lighting: simulates the bright spot of a light that appears on shiny objects. Specular highlights are more inclined to the color of the light than the color of the object

  // create white light node
  let light = new SpotLightSGNode();
  light.ambient = [1, 1, 1, 1];
  light.diffuse = [0, 0, 0, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [x, y, z];
  light.direction = [0, -1, 0];
  light.uniform = "u_spotLight";

  light.append(
    new ShaderSGNode(
      createProgram(gl, resources.vs_single, resources.fs_single),
      new RenderSGNode(makeSphere(size, prec, prec))
    )
  );

  parent.append(light)

  return light;
}

function getMaterial(model) {
  return new MaterialSGNode(
    new RenderSGNode(model)
  );
}

function getSmoothMaterial(model) {

  let material = getMaterial(model);
  
  // golden colour and shiny
  material.ambient = [0.25, 0.2, 0.07, 1];
  material.diffuse = [0.25, 0.2, 0.07, 1];
  material.specular = [1, 1, 1, 1];
  material.shininess = 1;

  return material
}

function getMatteMaterial(model) {

  let material = getMaterial(model);
  
  // grey colour and not shiny
  material.ambient = [0.2, 0.2, 0.2, 1];
  material.diffuse = [0.9, 0.9, 0.9, 1];
  material.specular = [0, 0, 0, 1];
  material.shininess = 100;

  return material;
}

function createMoon(parent, x, y, z, radius) {
  
  let planetMaterial = getMaterial(makeSphere(radius, prec, prec));

  // make reflect light from sun
  planetMaterial.ambient = [0.2, 0.2, 0.2, 1];  // changes (the color of) both sides
  planetMaterial.diffuse = [0.9, 0.9, 0.9, 1];  // changes (the color of) the lighted side 
  planetMaterial.specular = [0.0, 0.0, 0.0, 1]; // so that there is no small light circle on the dark side of the planet
  planetMaterial.shininess = 3;

  // set position
  let planet = new TransformationSGNode(
    glm.translate(x, y, z),
    planetMaterial
  );

  parent.append(planet);

  return planet;
}

function createPlanet(parent, x, y, z, radius, duration, splits, isClockwise) {

  let planet = createMoon(parent, x, y, z, radius);

  nonCameraAnimations.push(
    new Animation(
      planet,
      getYrotationAnimation(x, y, z, duration, splits, isClockwise),
      true // infinite loop
    )
  );

  return planet;
}

function createSpaceObject(parent, model, scale,
  degreesX, degreesY, degreesZ,
  x, y, z,
  isShiny = true) {
  
  let spaceshipMaterial = isShiny ? getSmoothMaterial(model) : getMatteMaterial(model);

  let spaceship = new TransformationSGNode(
    glm.transform(
      {
        translate: [x, y, z],
        rotateX: degreesX,
        rotateY: degreesY,
        rotateZ: degreesZ,
        scale: scale
      }
    ),
    spaceshipMaterial
  )

  parent.append(spaceship);

  return spaceship;
}

function createMovingSpaceObject(parent, model, scale,
  degreesX, degreesY, degreesZ,
  x, y, z,        // starting position when created
  toX, toY, toZ,  // end position after animation
  duration) {
  
  let spaceshipMaterial = getSmoothMaterial(model);

  let spaceship = new TransformationSGNode(
    glm.transform(
      {
        translate: [x, y, z],
        rotateX: degreesX,
        rotateY: degreesY,
        rotateZ: degreesZ,
        scale: scale
      }
    ),
    spaceshipMaterial
  )

  parent.append(spaceship);

  addNonLoopingAnimation(spaceship, toX, toY, toZ, degreesX, degreesY, degreesZ, duration, scale);

  return spaceship;
}

class SpotLightSGNode extends LightSGNode {

	constructor(children) {
		super(null, children);

		this.angle = Math.PI / 8;
		this.direction = vec3.normalize(vec3.create(), vec3.fromValues(1, -0.5, 0));
		this._worldDirection = [0, 0, 0];

		this.position = [0, 0, 0];
		this.ambient = [0.0, 0.0, 0.0, 1];
		this.diffuse = rgb(0, 0, 0);
		this.specular = rgb(0, 0, 0);
		this.uniform = "u_spotLight"; // uniform name
	}

	setLightUniforms(context) {
    const gl = context.gl;
    
		// exit if shader is not available
		if (!(context.shader && isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + 'Pos')))) {
      return;
    }
    gl.uniform1f(gl.getUniformLocation(context.shader, this.uniform + '.angle'), this.angle);
    gl.uniform3fv(gl.getUniformLocation(context.shader, this.uniform + '.direction'), this._worldDirection);
    super.setLightUniforms(context)
  }
    
	setLightPosition(context) {
    const gl = context.gl;

		// exit if shader is not available
		if (!(context.shader && isValidUniformLocation(gl.getUniformLocation(context.shader, this.uniform + 'Pos')))) {
      return;
    }
    const position = this._worldPosition || this.position;
    gl.uniform3f(gl.getUniformLocation(context.shader, this.uniform + 'Pos'), position[0], position[1], position[2]);
	}

	computeLightPosition(context) {
		// transform with the current model view matrix
		const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
		const original = this.position;
		let nMat = mat3.normalFromMat4(mat3.create(), modelViewMatrix);
		this._worldPosition = vec4.transformMat4(vec4.create(), vec4.fromValues(original[0], original[1], original[2], 1), modelViewMatrix);
		vec3.transformMat3(this._worldDirection, this.direction, nMat);
	}
}

class MultiModelRenderSGNode extends SGNode {

  // This class is simply the RenderSGNode but a little bit adapted,for the special effect 'level of detail'.
  // The only two changes are in the constructor and after the Uniforms got setted.

  constructor(model_close, model_medium, model_far, threshold_close, threshold_medium, children) {
    super(children);

    this.threshold_close = threshold_close;
    this.threshold_medium = threshold_medium;

    if (typeof model_close !== 'function') {

      //assume it is a model wrap it
      this.model_close = modelRenderer(model_close);
    } else {
      this.model_close = model_close;
    }

    if (typeof model_medium !== 'function') {

      //assume it is a model wrap it
      this.model_medium = modelRenderer(model_medium);
    } else {
      this.model_medium = model_medium;
    }

    if (typeof model_far !== 'function') {

      //assume it is a model wrap it
      this.model_far = modelRenderer(model_far);
    } else {
      this.model_far = model_far;
    }
  }

  setTransformationUniforms(context) {

    // set matrix uniforms
    const modelViewMatrix = mat4.multiply(mat4.create(), context.viewMatrix, context.sceneMatrix);
    const normalMatrix = mat3.normalFromMat4(mat3.create(), modelViewMatrix);
    const projectionMatrix = context.projectionMatrix;    

    const gl = context.gl,
      shader = context.shader;
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_modelView'), false, modelViewMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(shader, 'u_normalMatrix'), false, normalMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, 'u_projection'), false, projectionMatrix);
  
    let distance = getDistance(modelViewMatrix);
    if(distance < this.threshold_close) this.renderer = this.model_close;
    else if(distance < this.threshold_medium) this.renderer = this.model_medium;
    else this.renderer = this.model_far;
  }

  render(context) {

    this.setTransformationUniforms(context);

    // call the renderer
    this.renderer(context);

    // render children
    super.render(context);
  }
}

// #endregion

// #region Animation
let nonCameraAnimations = [];

// Returns one animation-matrix which sets all 3 axes and all 3 roations AND duration.
// Used for camera animation when not settings 'scale',
// or for space-objects when setting 'scale'.
// Expection are space-objects with scale 1, where scale does not have to be set.
function getAnimationMatrix(x, y, z, degreesX, degreesY, degreesZ, duration, scale = 1) {

  return {
    matrix:
      glm.transform(
        {
          translate: [x, y, z],
          rotateX: degreesX,
          rotateY: degreesY,
          rotateZ: degreesZ,
          scale: scale
        }
      )
    ,
    duration: duration
  }
}

// Returns an Animation-object which sets all 3 axes, all 3 roations, scale and duration.
// Used for spaceship animation, as everything can be set.
function addNonLoopingAnimation(node, x, y, z, degreesX, degreesY, degreesZ, duration, scale = 1) {
  
  nonCameraAnimations.push(
    new Animation(
      node,
      [getAnimationMatrix(x, y, z, degreesX, degreesY, degreesZ, duration, scale)],
      false // no loop
    )
  )
}

// Returns an array with many small Y-rotation-animations-matrices.
// Used for moons orbiting planets and space-objects rotation around their Y-axis.
function getYrotationAnimation(x, y, z, duration, splits, isClockwise = false, scale = 1) {

  let durationPerSplit = duration / splits;

  let negate = isClockwise ? -1 : 1;

  let animations = [];

  for (i = 0; i < splits; i++) {

    animations.push(
      getAnimationMatrix(x, y, z, 0, (negate * 360 / splits * (i+1)), 0, durationPerSplit, scale)
    );
  }

  return animations;
}

// Returns an array with many small rotation-animations-matrices.
// Used for space-objects rotation around their Z-axis.
function getZrotationAnimation(x, y, z, degreesX, degreesY, degreesZ, duration, splits, scale = 1) {

  let durationPerSplit = duration / splits;

  let animations = [];

  for (i = 0; i < splits; i++) {

    animations.push(
      getAnimationMatrix(x, y, z, degreesX, degreesY, (degreesZ / splits * (i+1)), durationPerSplit, scale)
    );
  }

  return animations;
}
// #endregion
// #endregion
