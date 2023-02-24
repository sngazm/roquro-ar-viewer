#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

const float PI = acos(-1.);

float random(vec2 st){
   return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}
vec2 random2(vec2 p){
   return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

//
// Description : GLSL 2D simplex noise function
//      Author : Ian McEwan, Ashima Arts
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License :
//  Copyright (C) 2011 Ashima Arts. All rights reserved.
//  Distributed under the MIT License. See LICENSE file.
//  https://github.com/ashima/webgl-noise
//
float snoise(vec2 v) {

    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g);
}

float lPoly(vec2 p,float n) {
//   float a = atan(p.x,p.y) + PI ;
  float a = atan(p.x,p.y);
  float r = (PI * 2.) / n;
  return cos(floor(.5+a/r)*r-a)*length(p)/cos(r*.5);
}

float smoothLine(float threshold, float weight, float p) {
   return smoothstep(threshold - weight, threshold, p) - smoothstep(threshold, threshold + weight, p);
}

float fixedpow(float a, float x)
{
    return pow(abs(a), x) * sign(a);
}

float cbrt(float a)
{
    return fixedpow(a, 0.3333333333);
}

vec3 lsrgb2oklab(vec3 c)
{
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    float l_ = cbrt(l);
    float m_ = cbrt(m);
    float s_ = cbrt(s);

    return vec3(
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    );
}

vec3 oklab2lsrgb(vec3 c)
{
    float l_ = c.r + 0.3963377774 * c.g + 0.2158037573 * c.b;
    float m_ = c.r - 0.1055613458 * c.g - 0.0638541728 * c.b;
    float s_ = c.r - 0.0894841775 * c.g - 1.2914855480 * c.b;

    float l = l_ * l_ * l_;
    float m = m_ * m_ * m_;
    float s = s_ * s_ * s_;

    return vec3(
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 oklabMix(vec3 colorA, vec3 colorB, float r) {
  return oklab2lsrgb(mix(lsrgb2oklab(colorA), lsrgb2oklab(colorB), r));
}

void main() {
  vec2 g_st = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  vec2 max = vec2(u_resolution.xy / min(u_resolution.x, u_resolution.y));
  vec2 center = max / 2.0;
  vec2 n_st = (gl_FragCoord.xy / min(u_resolution.x, u_resolution.y)) * 2.0 - max;

  float r = distance(n_st, vec2(0, 0));
  float theta = atan(n_st.y, n_st.x);
  
  vec3 color;

  // グラデーション(中心から)
  vec3 colorA = vec3(0.498, 0.4, 0.7961);
  vec3 colorB = vec3(0.1176, 0.051, 0.2667);
  color = oklabMix(colorA, colorB, r);
  
  // グラデーション(上下)
  vec3 colorC = vec3(0.7843, 0.1765, 0.1765);
  vec3 colorD = vec3(0.0941, 0.3294, 0.5843);
  color += oklabMix(colorC, colorD, g_st.y) * 1.5;
  
  // 集中線
  float flashWeight = 0.8;
  float flashThreshold = 1.4 + cos((theta) * 100.0) * .1;
  float flashXY = r + (cos(u_time)) * 0.5;
  float flash = smoothLine(flashThreshold, flashWeight, flashXY) * 0.2;
  color += vec3(flash);


	gl_FragColor = vec4(color, 1.0);
}

