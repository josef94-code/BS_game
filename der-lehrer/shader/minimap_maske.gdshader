// Schneidet alles, was die Minimap zeichnet, kreisrund aus
shader_type canvas_item;

uniform vec2 mitte = vec2(110.0, 110.0);
uniform float radius = 108.0;
varying vec2 lokal;

void vertex() {
	lokal = VERTEX;
}

void fragment() {
	if (length(lokal - mitte) > radius) {
		discard;
	}
}
