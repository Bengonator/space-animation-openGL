/**
 * a phong shader implementation
 * Created by Samuel Gratzl on 29.02.2016.
 */
attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_modelView;
uniform mat3 u_normalMatrix;
uniform mat4 u_projection;

uniform vec3 u_lightPos;
// uniform vec3 u_light2Pos; // (already) added second light-source
uniform vec3 u_spotLightPos; // added spotlight

// output of this shader
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
// varying vec3 v_light2Vec; // (already) added second light-source
varying vec3 v_spotLightVec; // added spotlight

void main() {
	vec4 eyePosition = u_modelView * vec4(a_position, 1);

  	v_normalVec = u_normalMatrix * a_normal;

  	v_eyeVec = -eyePosition.xyz;
	//light position as uniform
	v_lightVec = u_lightPos - eyePosition.xyz;
	// v_light2Vec = u_light2Pos - eyePosition.xyz; // (already) added second light-source
	v_spotLightVec = u_spotLightPos - eyePosition.xyz; // added spotlight

	gl_Position = u_projection * eyePosition;
}
