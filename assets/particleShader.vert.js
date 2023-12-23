export const vertex = /* glsl */ `

attribute vec2 a_position;
attribute vec2 a_velocity;

uniform vec2 u_resolution;

varying float v_color;

void main() {
  vec2 clipSpace = a_position / u_resolution;
  gl_Position = vec4(clipSpace, 0, 1);
  gl_PointSize = 150.0;

  v_color = dot(a_velocity, a_velocity);
}
`;