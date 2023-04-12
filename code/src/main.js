//the OpenGL context
var gl = null,
  program = null;

//Camera
var camera = null;
var cameraPos = vec3.create();
var cameraCenter = vec3.create();
var cameraAnimation = null;

// scenegraph root node
var root = null;

// time in last render step
var previousTime = 0;

//load the shader resources using a utility function
loadResources({
  vs: './src/shader/phong.vs.glsl',
  fs: './src/shader/phong.fs.glsl',
  vs_single: './src/shader/single.vs.glsl',
  fs_single: './src/shader/single.fs.glsl',

  // EDIT: load external objects
  tie_fighter: './src/models/tie_fighter/tie_fighter.obj',
  death_star: './src/models/death_star/death_star.obj'

}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
  //create a GL context
  gl = createContext();

  //setup camera
  cameraStartPos = vec3.fromValues(0, 1, -20);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);

  // EDIT: set camera animation path
  //setup an animation for the camera, moving it into position
  cameraAnimation = new Animation(
            camera, 
            [
              {matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 1, -20)), duration: 5000},
              //{matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 20, -20)), duration: 5000}
            ], 
            false
  );

  //cameraAnimation.start()

  //TODO create your own scenegraph
  root = createSceneGraph(gl, resources);
}

function createSceneGraph(gl, resources) {

  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs))

  // create node with different shaders
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.2, 10, 10))
    ]);
  }

  // EDIT: adding nodes
  root.append(createPlanet(5, 5, 5, 3, 50, 50));




  // create white light node
  let light = new LightSGNode();
  light.ambient = [.5, .5, .5, 1];
  light.diffuse = [1, 1, 1, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0, 3.5, 2];
  light.append(createLightSphere(resources));
  // add light to scenegraph
  root.append(light);


  // // create C3PO
  // let c3po = new MaterialSGNode([
  //   new RenderSGNode(resources.death_star)
  // ]);
  // //gold
  // c3po.ambient = [0.24725, 0.1995, 0.0745, 1];
  // c3po.diffuse = [0.75164, 0.60648, 0.22648, 1];
  // c3po.specular = [0.628281, 0.555802, 0.366065, 1];
  // c3po.shininess = 50;
  // // let transformNode = new TransformationSGNode(glm.translate(0, -1.5, 0), [
  // let transformNode = new TransformationSGNode(glm.translate(0, 0, 0), [
  //   c3po
  // ]);

  // let scaleNode = new TransformationSGNode(glm.scale(0.005, 0.005, 0.005), [transformNode]);

  // // add C3PO to scenegraph
  // root.append(scaleNode);

  // create floor
  let floor = new MaterialSGNode([
    new RenderSGNode(makeRect(20, 20))
  ]);
  //dark
  floor.ambient = [0.2, 0.2, 0.2, 1];
  floor.diffuse = [0.1, 0.1, 0.1, 1];
  floor.specular = [0.5, 0.5, 0.5, 1];
  floor.shininess = 3;
  // add floor to scenegraph
  root.append(new TransformationSGNode(glm.transform({ translate: [0, 0, 0], rotateX: -90, scale: 3 }), [
    floor
  ]));

  return root;
}

/**
 * render one frame
 */
function render(timeInMilliseconds) {

  // check for resize of browser window and adjust canvas sizes
  checkForWindowResize(gl);

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.05, 0.03, 0.10, 1);

  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  //Create projection Matrix and context for rendering.
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0, 1, -10], [0, 0, 0], [0, 1, 0]);


  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;

  //update animation BEFORE camera
  cameraAnimation.update(deltaTime);
  camera.update(deltaTime);

  //At the end of the automatic flight, switch to manual control
  if(!cameraAnimation.running && !camera.control.enabled) {
    camera.control.enabled = true;
  }

  //TODO use your own scene for rendering

  //Apply camera
  camera.render(context);

  //Render scene
  root.render(context);

  //request another call as soon as possible
  requestAnimationFrame(render);
}

// EDIT: functions we created
function createPlanet(x, y, z, radius, lat, long) {
  let planet = new TransformationSGNode(glm.translate(x, y, z),
    [new TransformationSGNode]
  );

  planet.append(new RenderSGNode(makeSphere(radius, lat, long)));

  return planet;
}

