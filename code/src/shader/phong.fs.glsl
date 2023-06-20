/**
 * a phong shader implementation
 * Created by Samuel Gratzl on 29.02.2016.
 */
precision mediump float;

/**
 * definition of a material structure containing common properties
 */
struct Material {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec4 emission;
	float shininess;
};

/**
 * definition of the light properties related to material properties
 */
struct Light {
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
};

// added spotlight
struct SpotLight{
	vec4 ambient;
	vec4 diffuse;
	vec4 specular;
	vec3 direction;
	float angle;
};


uniform Material u_material;
uniform Light u_light;
// uniform Light u_light2; // (already) added second light-source
uniform SpotLight u_spotLight; // added spotlight


// varying vectors for light computation
varying vec3 v_normalVec;
varying vec3 v_eyeVec;
varying vec3 v_lightVec;
// varying vec3 v_light2Vec; // (already) added second light-source
varying vec3 v_spotLightVec; // added spotlight


vec4 calculateSimplePointLight(Light light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec) {
	// You can find all built-in functions (min, max, clamp, reflect, normalize, etc.) 
	// and variables (gl_FragCoord, gl_Position) in the OpenGL Shading Language Specification: 
	// https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.4.60.html#built-in-functions
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

  // implement phong shader
	// compute diffuse term
	float diffuse = max(dot(normalVec,lightVec),0.0);

	// compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0) , material.shininess);


	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	return c_amb + c_diff + c_spec + c_em;
}

vec4 calculateSpotLight(SpotLight light, Material material, vec3 lightVec, vec3 normalVec, vec3 eyeVec) {
	lightVec = normalize(lightVec);
	normalVec = normalize(normalVec);
	eyeVec = normalize(eyeVec);

    // implement phong shader
	// compute diffuse term
	float diffuse = max(dot(normalVec,lightVec), 0.0);

	// compute specular term
	vec3 reflectVec = reflect(-lightVec,normalVec);
	float spec = pow( max( dot(reflectVec, eyeVec), 0.0), material.shininess);


	vec4 c_amb  = clamp(light.ambient * material.ambient, 0.0, 1.0);
	vec4 c_diff = clamp(diffuse * light.diffuse * material.diffuse, 0.0, 1.0);
	vec4 c_spec = clamp(spec * light.specular * material.specular, 0.0, 1.0);
	vec4 c_em   = material.emission;

	// calculate angle and distance
	float angle = acos(dot(normalize(light.direction.xyz), -lightVec));
	float distance = length(lightVec);

	if (angle > light.angle) {
        return c_amb + c_em;
    } else {
        float factor = clamp((10.0 - distance) / 2.0, 0.0, 1.0);
        return c_amb + factor * (c_diff + c_spec) + c_em;
    }
}

void main() {

	gl_FragColor =
		calculateSimplePointLight(u_light, u_material, v_lightVec, v_normalVec, v_eyeVec)
		//+ calculateSimplePointLight(u_light2, u_material, v_light2Vec, v_normalVec, v_eyeVec); // (already) added second light-source
		+ calculateSpotLight(u_spotLight, u_material, v_spotLightVec, v_normalVec, v_eyeVec); // added spotlight
}
