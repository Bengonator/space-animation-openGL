
# CG Lab Project

Submission template for the CG lab project at the Johannes Kepler University Linz.


### Concept Submission due on 31.03.2023

(Explain the basic story of your movie, i.e., planned scenes, what happens, which objects are used, etc.)

You fly through space and look out of the cockpit (in first person).<br>
You see buttons and other control equipment.<br>
Further,you see various kinds of planets/space station, all with different sizes, colours, textures, texture details, ... (spheric or cubic).<br>
We also plan on adding another spaceship, which flies across the screen and might (if requested/needed) produces a sound.<br>


### Special Effects

Selected special effects must add up to exactly 30 points. Replace yes/no with either yes or no.

| Selected   | ID | Name                                  | Points |
|------------|----|---------------------------------------|--------|
| yes        | S1 | Multi texturing                       | 15     |  
| yes        | S2 | Level of detail                       | 15     |


## Intermediate Submission due on 29.04.2023

Prepare a first version of your movie that:
 * is 30 seconds long,
 * contains animated objects, and
 * has an animated camera movement. 

Push your code on the day of the submission deadline. 
The repository needs to contain:
  * code/ Intermediate code + resources + libs
  * video/ A screen recording of the intermediate result

Nothing to change here in `README` file.

**Note:** You don’t need to use any lighting, materials, or textures yet. This will be discussed in later labs and can be added to the project afterwards!


## Final Submission due on 20.06.2023

The repository needs to contain:
  * code/ Documented code + resources + libs
  * video/ A screen recording of the movie
  * README.md


### Effects

Select which effects you have implemented in the table below. Replace yes/no/partial with one of the options.
Mention in the comments column of the table where you have implemented the code and where it is visible (e.g., spotlight is the lamp post shining on the street). 

| Implemented    | ID | Name                                                                                                   | Max. Points | Issues / Comments |
|----------------|----|--------------------------------------------------------------------------------------------------------|-------------|-------------------|
| yes            | 1a | Add at least one manually composed object that consists of multiple scene graph nodes.                 |  6          | The carGroup consist of the car, the antenna and the holocron. |
| yes            | 1b | Animate separate parts of the composed object and also move the composed object itself in the scene.   |  4          | The carGroup rotates over the Z-axis. The antenna and the holocron rotate over the Y-axis in opposing directions and at a different speed. |
| yes | 1c | Use at least two clearly different materials for the composed object.                                  |  3          | While, the car has a matte surface, the antenna and the holocron are very shiny. The material is different in general, as the car ambient is grey, while the other two objects are golden (inpired by your C3PO). |
| partial | 1d | Texture parts of your composed object by setting proper texture coordinates.                           |  5          | Tried to implement a texture to our composed object, applied all changes in the phong shaders, but had issues in the main.js by implementing the textures/texture nodes to the scenegraph. Every part of the implementation is commented out. With that, the video works perfectly, but you can still see all the changes and effort which was put into the texturing. |
| yes | 2a | Use multiple light sources.                                                                            |  5          | Not only do we have the static massiv sun in the background, but we also have a sweet tiny moon, which moves around a larger planet on the left hand side. |
| yes | 2b | One light source should be moving in the scene.                                                        |  3          | The small flashlight is circling around the van and shines at the back of it. |
| yes | 2c | Implement at least one spot-light.                                                                     | 10          | The flashlight which moves around the car is a spotlight. The ambience is all zeros, the diffuse is all ones, in order to achive a great spotlight effect. With this, the trunk of the car is partly dark and partly light, which makes a gread effect with the holocron. |
| yes | 2d | Apply Phong shading to all objects in the scene.                                                       |  4          | The Phong shader was/is implemented. Part of it would be the second light source, the spotlight (and also the textures). |
| yes            | 3  | The camera is animated 30 seconds without user intervention. Animation quality and complexity of the camera and the objects influence the judgement. |  10          | The complex animation perfectly shows the great scenery, which consist of multiple planets with moons, sometimes even the moons have moons. A slow cargo spaceship and a fighter-triplet create calmness and exitement. The camera moves in all three axes, it also rotates and uses different speed for different parts of the animation. |
| no | Sx | Multi texturing                                                                                        | 15          | Multi texturing is not implemented due to time |
| yes            | Sy | Level of detail                                                                                        | 15          | The car has three levels of details. The first one is seen at the start of the animation. This low-detail car simply has the walls and four wheels. The second one can be seen before the camera turns left at the earlier part of the animation. This model has windows, missing doors, damaged doors and a ramp at the back of the car. The most detailed one can be seen at the end of the animation. |
| partial | SE | Special effects are nicely integrated and well documented                                              | 20          | The special effect is very well documented. On the one hand here in this table, on the other hand, a more technical explaination regarding code and maths can be found below. The different models are design by myself, which was lots of work, but also fun. Personally, I think that the swap of the models is clearly visible, but not too disturbing. This was not easy, as the idea normally is to swap in a way, that the player does not see it. |


### Special Effect Description

Describe how the effects work in principle and how you implemented them. If your effect does not work but you tried to implement it, make sure that you explain this. Even if your code is broken do not delete it (e.g., keep it as a comment). If you describe the effect (how it works, and how to implement it in theory), then you will also get some points. If you remove the code and do not explain it in the README this will lead to 0 points for the effect and the integration SE.

#### Multi texturing:


#### Level of detail:
We created the class MultiModelRenderSGNode which extends SGNode. Most of the code is copied from the RenderSGNode.
The constructor expects three models and two thresholds. If the distance is smaller than the first threshold, the first model is rendered.
If the distance is smaller than the second threshold, the second model is rendered. In all other cases, the third model is rendered.

The distance is calulated by using the 'modelViewMatrix'.
In 'getDistance()' the three coordinate-values are retrieved by using 'getCoordsFromMatrix()'
In 'getCoordsFromMatrix()' the three coordinate-values are retrieved by accessing the matrix at the values 12, 13 and 14.
Back in 'getDistance()' the squareroot of the sum of the squared values of thoose three coordinate-values is calculated:
"sqrt([12]^2 + [13]^2 + [14]^2)"
This value is returned as 'distance'.

