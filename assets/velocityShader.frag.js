export const vertex = /* glsl */ `

uniform float dt;
uniform float gravity;

void main()	{

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 velocity = texture2D( textureVelocity, uv ).xyz;

  vec3 force = vec3( 0.0, gravity, 0.0);

  gl_FragColor = vec4( velocity + force * dt, 1.0 );

}
`;