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
  //https://www.shadertoy.com/view/4dfXDn

  precision highp float;

  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec2 iMouse;
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

  #define	SUNSIZE		0.05
  #define SUNBRIGHTNESS 1.0

  float lineDist(vec2 p, vec4 pos, float width)
  {
    vec2 start = vec2(pos.x * iResolution.x, pos.y * iResolution.y);
    vec2 end = vec2(pos.z * iResolution.x, pos.w * iResolution.y);
  	vec2 dir = start - end;
  	float lngth = length(dir);
  	dir /= lngth;
  	vec2 proj = max(0.0, min(lngth, dot((start - p), dir))) * dir;
  	return length( (start - p) - proj ) - (width / 2.0);
  }

  float shadow(vec2 p, vec2 pos, float radius, vec4 linePos)
  {
    vec2 start = vec2(linePos.x * iResolution.x, linePos.y * iResolution.y);
    vec2 end = vec2(linePos.z * iResolution.x, linePos.w * iResolution.y);

  	vec2 dir = normalize(pos - p);
  	float dl = length(p - pos);

  	// fraction of light visible, starts at one radius (second half added in the end);
  	float lf = radius * dl;

  	// distance traveled
  	float dt = 0.01;

  	for (int i = 0; i < 64; ++i)
  	{
  		// distance to scene at current position
  		float sd = lineDist(p + dir * dt, 	linePos,	10.0);

          // early out when this ray is guaranteed to be full shadow
          if (sd < -radius)
              return 0.0;

  		// width of cone-overlap at light
  		// 0 in center, so 50% overlap: add one radius outside of loop to get total coverage
  		// should be '(sd / dt) * dl', but '*dl' outside of loop
  		lf = min(lf, sd / dt);

  		// move ahead
  		dt += max(1.0, abs(sd));
  		if (dt > dl) break;
  	}

  	// multiply by dl to get the real projected overlap (moved out of loop)
  	// add one radius, before between -radius and + radius
  	// normalize to 1 ( / 2*radius)
  	lf = clamp((lf*dl + radius) / (2.0 * radius), 0.0, 1.0);
  	lf = smoothstep(0.0, 1.0, lf);
  	return lf;
  }



  vec4 drawLight(vec2 p, vec2 pos, vec4 color, float dist, float range, float radius, vec4 linePos)
  {
  	// distance to light
  	float ld = length(p - pos);

  	// out of range
  	if (ld > range) return vec4(0.0);

  	// shadow and falloff
  	float shad = shadow(p, pos, radius, linePos);
  	float fall = (range - ld)/range;
  	fall *= fall;
  	return (shad * fall) * color;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = gl_FragCoord.xy;

    vec3 bgColor = vec3(uv, 1.0);
    vec4 col = vec4(bgColor * 0.15, 1.0);
    vec4 light1Col = vec4(bgColor, 1.0);
    vec4 light2Col = vec4(bgColor, 1.0);
    vec2 light2Pos = vec2(
      0.4 + abs(sin(iTime * 0.1) - 0.4) * iResolution.x,
      (noise2d(vec2(sin(iTime * 0.001), 0.01)) + 0.8) * 0.47 * iResolution.y
    );
    vec2 mousePos = iMouse * iResolution;

    vec4 line1Pos = vec4(0.2, 0.2, 0.4, 0.3);
    float dist = lineDist(p, line1Pos,	10.0);
    col += drawLight(p, mousePos, light1Col, dist, 500.0, 0.2, line1Pos);
    col += drawLight(p, light2Pos, light2Col, dist, 400.0, 0.01, line1Pos);

    vec4 line2Pos = vec4(0.6, 0.4, 0.7, 0.36);
    dist = lineDist(p, line2Pos,	20.0);
    col += drawLight(p, mousePos, light1Col, dist, 500.0, 0.2, line2Pos);
    col += drawLight(p, light2Pos, light2Col, dist, 400.0, 0.01, line2Pos);

    vec4 line3Pos = vec4(0.6, 0.4, 0.7, 0.36);
    dist = lineDist(p, line3Pos,	20.0);
    col += drawLight(p, mousePos, light1Col, dist, 500.0, 0.2, line3Pos);
    col += drawLight(p, light2Pos, light2Col, dist, 400.0, 0.01, line3Pos);


    gl_FragColor = clamp(col, 0.0, 1.0);
  }
`

const geometry = new THREE.PlaneGeometry(2, 2)
const material = new THREE.RawShaderMaterial({
  uniforms: {
    iResolution: {type: 'v2', value: new THREE.Vector2(WIDTH, HEIGHT)},
    iTime: {type: 'f', value: 0},
    iTexture: {type: 't', value: THREE.ImageUtils.loadTexture("noise.png")},
    iMouse: {type: 'v2', value: new THREE.Vector2(0.53, .0)}
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

let isDragging = false;
window.addEventListener('mouseup', (e) => {
  isDragging = false;
})

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    console.log(e.clientX, e.clientX / WIDTH)
    mesh.material.uniforms.iMouse.value.x = e.clientX / WIDTH;
    mesh.material.uniforms.iMouse.value.y = (HEIGHT - e.clientY) / HEIGHT;
  }
})

window.addEventListener('mousedown', (e) => {
  isDragging = true;
})

requestAnimationFrame(render)
