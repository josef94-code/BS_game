// Missionsmarker: leuchtender Zylinder, nach oben transparent auslaufend
shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never, shadows_disabled;

uniform vec4 farbe : source_color = vec4(1.0, 0.8, 0.1, 1.0);
uniform float staerke = 0.9;
varying float hoehe;

void vertex() {
	hoehe = clamp(VERTEX.y + 0.5, 0.0, 1.0);
}

void fragment() {
	float puls = 0.75 + 0.25 * sin(TIME * 3.0);
	float a = staerke * pow(1.0 - hoehe, 2.2) * puls;
	ALBEDO = farbe.rgb * a;
}
