const THREE = require('n3d-threejs')

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

const camera = new THREE.Camera()
const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
renderer.setSize(WIDTH, HEIGHT)
document.body.appendChild(renderer.domElement)

const vertexShader = `
  precision highp float;

  attribute vec3 position;

  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  uniform vec2 iResolution;
  uniform float iTime;
  uniform sampler2D iTexture;

  float noise2d(vec2 p) {
  	float t = texture2D(iTexture, p).x;
  	t += 0.5 * texture2D(iTexture, p * 2.0).x;
  	t += 0.25 * texture2D(iTexture, p * 4.0).x;
  	return t / 1.75;
  }

  float line(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    vec2 ap = p - a;
    return length(ap - ab * clamp(dot(ab, ap) / dot(ab, ab), 0., 1.));
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv;

    vec2 start = vec2(0., 1.0);
    vec2 end = vec2(1.0, 1.0);

    float n = 10. + noise2d(p) + iTime * 10.;
    p.x *= (1.0 + sin(noise2d(p * 0.05) * p.y * 14.) * 0.05 * n);
    float d = line(p, start, end);
    d += noise2d(p * vec2(0.2)) * 0.005;
    float c = smoothstep((10.0 * n) /iResolution.y, 0.0, d);
    gl_FragColor = vec4(vec3(1.0 - c), 1.0);
  }
`

const geometry = new THREE.PlaneGeometry(2, 2)
const material = new THREE.RawShaderMaterial({
  uniforms: {
    iResolution: {type: 'v2', value: new THREE.Vector2(WIDTH, HEIGHT)},
    iTime: {type: 'f', value: 0},
    iTexture: {type: 't', value: THREE.ImageUtils.loadTexture("noise.png")}
  },
  vertexShader,
  fragmentShader
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

function render(t) {
  mesh.material.uniforms.iTime.value = t * 0.001
  renderer.render(scene, camera)
  requestAnimationFrame(render)
}

requestAnimationFrame(render)
