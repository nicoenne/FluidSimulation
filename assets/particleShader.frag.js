export const vertex = /* glsl */ `
precision mediump float;

varying vec2 v_texcoord;

void main() {
  vec2 centreOffset = v_texcoord - vec2(0.5);
  float sqrDstFromCenter = dot(centreOffset, centreOffset);
  float delta = fwidth(sqrt(sqrDstFromCenter));
  float circleAlpha = 1. - smoothstep(1. - delta, 1. + delta, sqrDstFromCenter);
  gl_FragColor = vec4(0.0, 0.0, 0.0, circleAlpha);
}
`;