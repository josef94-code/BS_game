// Sichtbarer Lichtkegel (Fake-Volumenlicht): oben hell, nach unten und am Rand ausblendend
shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never, shadows_disabled;

uniform vec4 farbe : source_color = vec4(1.0, 0.85, 0.55, 1.0);
uniform float staerke = 0.18;
uniform float flackern = 1.0;

varying float hoehe;

void vertex() {
	// CylinderMesh: y von -h/2 bis +h/2 -> 1 oben, 0 unten
	hoehe = clamp(VERTEX.y + 0.5, 0.0, 1.0);
}

void fragment() {
	float rand = pow(abs(dot(NORMAL, VIEW)), 1.6);
	float a = staerke * flackern * rand * pow(hoehe, 1.4);
	ALBEDO = farbe.rgb * a;
}
