// Comic-Kontur: Rückseiten leicht aufgeblasen und schwarz gezeichnet (Inverted Hull)
shader_type spatial;
render_mode unshaded, cull_front, depth_draw_opaque, shadows_disabled;

uniform float dicke = 0.025;
uniform vec4 farbe : source_color = vec4(0.04, 0.03, 0.03, 1.0);
// true: entlang der Normalen (runde Körper), false: vom Mittelpunkt weg (Quader, rissfrei)
uniform bool entlang_normale = true;

void vertex() {
	if (entlang_normale) {
		VERTEX += NORMAL * dicke;
	} else {
		VERTEX += normalize(VERTEX) * dicke * 1.4;
	}
}

void fragment() {
	ALBEDO = farbe.rgb;
}
