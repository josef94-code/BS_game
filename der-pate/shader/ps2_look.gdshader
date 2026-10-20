// Nachbearbeitung im Stil der PS2-Ära (GTA III): weicher Schimmer, warme Farbstimmung,
// angehobene Schatten, Vignette und leichtes Filmkorn.
shader_type canvas_item;

uniform sampler2D bild : hint_screen_texture, filter_linear_mipmap;
uniform float schimmer = 0.4;
uniform float saettigung = 0.88;
uniform vec3 licht_farbe : source_color = vec3(1.0, 0.94, 0.82);
uniform vec3 schatten_farbe : source_color = vec3(0.06, 0.07, 0.1);
uniform float kontrast = 1.08;
uniform float vignette = 0.55;
uniform float koernung = 0.045;

void fragment() {
	vec2 uv = SCREEN_UV;
	vec3 c = texture(bild, uv).rgb;
	// weicher Schimmer: unscharfe Kopie aufhellend darüberlegen
	vec3 weich = (textureLod(bild, uv, 2.0).rgb + textureLod(bild, uv, 3.5).rgb) * 0.5;
	c = mix(c, 1.0 - (1.0 - c) * (1.0 - weich * 0.8), schimmer);
	// Farbstimmung
	float hell = dot(c, vec3(0.299, 0.587, 0.114));
	c = mix(vec3(hell), c, saettigung);
	c = c * licht_farbe + schatten_farbe * (1.0 - hell);
	c = (c - 0.5) * kontrast + 0.5;
	// Vignette
	vec2 d = uv - 0.5;
	c *= 1.0 - vignette * dot(d, d) * 1.6;
	// Filmkorn
	float n = fract(sin(dot(floor(FRAGCOORD.xy) + vec2(TIME * 61.0, TIME * 37.0), vec2(12.9898, 78.233))) * 43758.5453);
	c += (n - 0.5) * koernung;
	COLOR = vec4(clamp(c, 0.0, 1.0), 1.0);
}
