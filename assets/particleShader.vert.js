export const vertex = /* glsl */ `
attribute vec2 reference;

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;

varying vec2 v_texcoord;

void main() {
  vec3 particlePosition = texture2D( texturePosition, reference ).xyz;
  vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

  vec3 newPosition = position + particlePosition;

  v_texcoord = uv;
  gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
}
`;