precision mediump float;

varying vec4 v_Color; // Receive the data from the vertex shader

void main() {
	gl_FragColor = v_Color;
}
