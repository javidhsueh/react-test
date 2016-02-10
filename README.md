
# react-test

The goal of this component is to use stack.gl to render a network.
This repo is only for testing how to load shader using glslify-loading in webpack. 
Please help me to find a way to make it work. 

Please check src/index.js, componentDidMount(). 
That's the place where I should require the shaders. 
But I always got error messages like:

./~/glslify-loader!./~/raw-loader!./src/main.vertex.glsl
Module parse failed: /Users/javid/react-test/node_modules/glslify-loader/index.js!/Users/javid/react-test/node_modules/raw-loader/index.js!/Users/javid/react-test/node_modules/raw-loader/index.js!/Users/javid/react-test/node_modules/glslify-loader/index.js!/Users/javid/react-test/node_modules/raw-loader/index.js!/Users/javid/react-test/node_modules/glslify-loader/index.js!/Users/javid/react-test/src/main.vertex.glsl Line 1: Unexpected token ILLEGAL
You may need an appropriate loader to handle this file type.
| #define GLSLIFY 1
| module.exports = "module.exports = \"#define GLSLIFY 1\\nmodule.exports = \\\"#define GLSLIFY 1\\\\nuniform mat4 scaleMat;\\\\nuniform vec4 translateVec;\\\\n\\\\nvarying vec4 v_Color;\\\\n\\\\nattribute vec4 a_Pos;\\\\nattribute vec4 a_Color;\\\\n\\\\nvoid main() {\\\\n\\\\tgl_PointSize = 1.0;\\\\n\\\\tvec4 position = vec4(a_Pos[0], a_Pos[1], a_Pos[2], a_Pos[3]); // original pos\\\\n\\\\tgl_Position = (position + translateVec) * scaleMat ;\\\\n\\\\tv_Color = a_Color;\\\\n}\\\\n\\\"\""
 @ ./src/index.js 231:19-60

./~/glslify-loader!./~/raw-loader!./src/main.fragment.glsl
Module parse failed: /Users/javid/react-test/node_modules/glslify-loader/index.js!/Users/javid/react-test/node_modules/raw-loader/index.js!/Users/javid/react-test/node_modules/raw-loader/index.js!/Users/javid/react-test/node_modules/glslify-loader/index.js!/Users/javid/react-test/node_modules/raw-loader/index.js!/Users/javid/react-test/node_modules/glslify-loader/index.js!/Users/javid/react-test/src/main.fragment.glsl Line 1: Unexpected token ILLEGAL
You may need an appropriate loader to handle this file type.
| #define GLSLIFY 1
| module.exports = "module.exports = \"#define GLSLIFY 1\\nmodule.exports = \\\"#define GLSLIFY 1\\\\nprecision mediump float;\\\\n\\\\nvarying vec4 v_Color; // Receive the data from the vertex shader\\\\n\\\\nvoid main() {\\\\n\\\\tgl_FragColor = v_Color; //vec4(0.3, 0.3, 0.9, 1.0);\\\\n}\\\\n\\\"\""
 @ ./src/index.js 232:17-60


## Development

Please checkout the code at [here](https://github.com/javidhsueh/react-test).
* Developing - **npm start** - Runs the development server at *localhost:8080* and use Hot Module Replacement. You can override the default host and port through env (`HOST`, `PORT`).

