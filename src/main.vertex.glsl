uniform mat4 scaleMat;
uniform vec4 translateVec;

varying vec4 v_Color;

attribute vec4 a_Pos;
attribute vec4 a_Color;

void main() {
	gl_PointSize = 1.0;
	vec4 position = vec4(a_Pos[0], a_Pos[1], a_Pos[2], a_Pos[3]); // original pos
	gl_Position = (position + translateVec) * scaleMat ;
	v_Color = a_Color;
}
