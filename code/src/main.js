// #region defaults
// the OpenGL context
var gl = null;
var program = null;

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
  wrecked_car: './src/models/wrecked_car/wrecked_car.obj',
  antenna: './src/models/antenna/antenna.obj',
  holocron: './src/models/holocron/holocron.obj',

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
      // initiation
      getAnimationMatrix(0, 0, 0, 0, 0, 0, 1),    // just to make sure, that the animation starts at the center
      getAnimationMatrix(0, 0, 0, 0, 0, 0, 1000), // short delay at start

      // move to the right of first planet, rotate left
      getAnimationMatrix(0, 0, 14, 0, 0, 0, 4500),
      getAnimationMatrix(1, 0, 18, 0, 5, 0, 2000),
      getAnimationMatrix(2, 0, 22, 0, 10, 0, 2000),

      // move in front of second planet
      getAnimationMatrix(4, 0, 26, 7, 11, 0, 3900),   // rotate down to see cargo ship
      getAnimationMatrix(8, 0, 33, -10, 12, 0, 3800), // rotate up to see the planet

      // quickly move and rotate to the right (because scared of fighters racing past)
      getAnimationMatrix(4, 5, 30, -14, -14, -8, 1000),
      
      // move to the left of the car, rotate right
      getAnimationMatrix(4, 3, 30, 6, -30, 0, 3500),  // look at car
      getAnimationMatrix(x, y, z, yd, xd, 0, 8000),   // look further right and move to backdoors
    ], 
    false
  );

  if (!DEBUG) cameraAnimation.start()

  root = createSceneGraph(gl, resources);
}

function createSceneGraph(gl, resources) {

  // create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs))

  // EDIT: adding nodes
  // sun
  sun = createLightSphere(resources, -25, 0, 120, 35);
  root.append(sun);
  
  // planet with one moon
  p1 = createPlanet(root, 6, -1.5, 25, 1.5, 10000, 36);    
  createMoon(p1, 3, 1, 0, 0.4);
    
  // cargo spaceship
  s1 = createSpaceObject(
    root, resources.cargo_spaceship, 0.3,
    20, -30, 0,     // angles
    100, -10, -50,  // from
    -30, -20, 200,  // to
    25000           // duration
  );

  // planet with three moons
  p2 = createPlanet(root, 15, 4.7, 50, 2, 13000, 36, true);  
  createMoon(p2, 3, -1, 0, 0.2);
  createMoon(p2, -2, -1, 3, 0.25);
  createMoon(p2, 4, 1, 0, 0.25);

  // a fighter-spaceship triplet, which scares the pilot
  createSpaceObject( // left
    root, resources.fighter_spaceship, 0.001,
    100, 220, 200,
    142, -199.5, -99.5,
    //10, 5.5, 42.5,  // these are the values, where the spaceship is perfectly between planet2 and the camera
    -122, 210.5, 186.5,
    35000
  );
  createSpaceObject( // middle
    root, resources.fighter_spaceship, 0.001, 
    100, 220, 200,
    140, -200, -100,
    //8, 5, 43,  // these are the values, where the spaceship is perfectly between planet2 and the cameraw
    -124, 210, 186,
    35000
  );
  createSpaceObject( // right
    root, resources.fighter_spaceship, 0.001,
    100, 220, 200,
    139.1, -202, -100.5,
    //7.1, 3, 43.5,  // these are the values, where the spaceship is perfectly between planet2 and the camera
    -124.9, 208, 186.5,
    35000
  );
 
  // #region big planet with moons which have moons
  p3 = createPlanet(root, -2, -1, 60, 3.5, 19000, 36);

  m1 = createPlanet(p3, 4, 0, 5, 1.2, 3000, 36);
  createMoon(m1, 2, -0.3, -0.5, 0.25);
  createMoon(m1, -1, 0.3, 1.5, 0.2);

  m2 = createPlanet(p3, -5.2, 1.5, 2.7, 1, 7000, 36, true);
  createMoon(m2, 1.4, -0.3, -0.9, 0.25);

  createMoon(p3, -3, -1.5, -5, 0.7);
  // #endregion
  
  // #region region car in front of biggest planet  
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
      getZrotationAnimation(-12, 1, 40, 0, -130, 360, 20000, 36, 1),
      true // infinite loop
    )
  );

  // car
  createSpaceObject(
    carGroup, resources.wrecked_car, 0.03,
    0, 0, 0,
    0, -2, 0
  );

  // antenna
  antenna = createSpaceObject(
    carGroup, resources.antenna, 0.1,
    0, 0, 0,
    0.25, 0.905, 0
  );
  nonCameraAnimations.push(
    new Animation(
      antenna,
      getYrotationAnimation(0.25, 0.905, 0, 7500, 36, true, 0.1),
      true
    )
  );

  // holocrons
  holocron = createSpaceObject(
    carGroup, resources.holocron, 0.04,
    0, 0, 0,
    0, -1, 0
  );
  nonCameraAnimations.push(
    new Animation(
      holocron,
      getYrotationAnimation(0, -1, 0, 1500, 36, false, 0.03),
      true
    )
  );

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

// #region Camera
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
// #endregion

// #region Creation
const prec = 80; // how many latitude and longitude lines should a sphere have

function createLightSphere(resources, x, y, z, radius, r, g, b) {

  // https://learnopengl.com/Lighting/Basic-Lighting
  // Ambient lighting: even when it is dark there is usually still some light somewhere in the world (the moon, a distant light) so objects are almost never completely dark. To simulate this we use an ambient lighting constant that always gives the object some color.
  // Diffuse lighting: simulates the directional impact a light object has on an object. This is the most visually significant component of the lighting model. The more a part of an object faces the light source, the brighter it becomes.
  // Specular lighting: simulates the bright spot of a light that appears on shiny objects. Specular highlights are more inclined to the color of the light than the color of the object

  // create white light node
  let light = new LightSGNode();
  light.ambient = [0.6, 0.6, 0.6, 1];
  if (arguments.length > 5) {
    light.diffuse = [r, g, b, 1];
  } else {
    light.diffuse = [1, 1, 1, 1];
  }
  light.specular = [1, 1, 1, 1];
  light.position = [x, y, z];

  light.append(
    new ShaderSGNode(
      createProgram(gl, resources.vs_single, resources.fs_single),
      new RenderSGNode(
        makeSphere(radius, prec, prec)
      )
    )
  );

  return light;
}

function getMaterialNode(model) {
  return new MaterialSGNode(
    new RenderSGNode(model)
  );
}

function createMoon(parent, x, y, z, radius) {
  
  let planetMaterial = getMaterialNode(makeSphere(radius, prec, prec));

  // make reflect light from sun
  planetMaterial.ambient = [0.2, 0.2, 0.2, 1];  // changes (the color of) both sides
  planetMaterial.diffuse = [0.9, 0.9, 0.9, 1];  // changes (the color of) the lighted side 
  planetMaterial.specular = [0.0, 0.0, 0.0, 1];    // so that there is no small light circle on the dark side of the planet
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
  x, y, z,        // starting position when created
  toX, toY, toZ,  // end position after animation
  duration) {
  
  let spaceshipMaterial = getMaterialNode(model);
  
  // make reflect light from sun
  spaceshipMaterial.ambient = [0.2, 0.2, 0.2, 1]; // changes (the color of) both sides
  spaceshipMaterial.diffuse = [0.9, 0.9, 0.9, 1]; // changes (the color of) the lighted side 
  spaceshipMaterial.specular = [0.0, 0.0, 0.0, 1];   // so that there is no small light circle on the dark side of the spaceship
  spaceshipMaterial.shininess = 3;

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

  // 9 parameters are always needed, but only if the 4 additionals are given, create an animation
  if (arguments.length > 9) {
    addNonLoopingAnimation(spaceship, toX, toY, toZ, degreesX, degreesY, degreesZ, duration, scale);
  }

  return spaceship;
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
// #endregion
// #endregion
