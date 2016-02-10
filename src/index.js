'use strict';

import _ 						from 'lodash';
import React 				from 'react';
import ReactDOM        from 'react-dom';

import window from 'global/window';

import getContext from 'get-canvas-context';
// import glslify from 'glslify';
var glslify =require('glslify');
import createShader from 'gl-shader';
import createBuffer from 'gl-buffer';

// Convert a JavaScript double precision Number to the equivalent single
// precision value.
function float(value) {
  var array = new Float32Array(1);
  array[0] = value;
  return array[0];
}

// Split a Number of double precision into two Numbers of single precision.
function split(a) {
  var tHi = float(a);
  var tLo = a - tHi;
  return [tHi, tLo];
}

class GraphGL extends React.Component {

	constructor(props) {
    super(props);
    // init state
    this.state = {
      scale: 1,
      translateX: 0,
      translateY: 0
    };
  }

  _getBufferArray() {
    var vertices = [];

    // glVerticesPerVertex: circle resolution
    var glVerticesPerVertex = 12;
    var unitRad = 2 * Math.PI / glVerticesPerVertex;
    var radius = 0.001 / this.state.scale;
    var edges = this.props.graphData.edges || [];
    var vertexPositions = this.props.graphData.vertex_properties[0]['value'] || []; // how to access with 'name':'position'?

    var edgeColor       = this.props.setting.uniformMapping.edgeColor;
    var nodeColor       = this.props.setting.uniformMapping.nodeColor;
    var nodeBorderColor = this.props.setting.uniformMapping.nodeBorderColor;

    // edge
    _.forEach(edges, function(edge) {
      var source = edge[0];
      var target = edge[1];
      vertices.push(
        // source x,y,z,w,r,g.b.a
        vertexPositions[source][0] / 40,
        vertexPositions[source][1] / 40,
        0.0,
        1.0,
        edgeColor[0] / 255,
        edgeColor[1] / 255,
        edgeColor[2] / 255,
        edgeColor[3] / 255,
        // target x,y,z,w,r,g.b.a
        vertexPositions[target][0] / 40,
        vertexPositions[target][1] / 40,
        0.0,
        1.0,
        edgeColor[0] / 255,
        edgeColor[1] / 255,
        edgeColor[2] / 255,
        edgeColor[3] / 255
      );
    });

    // for vertex fill
    _.forEach(vertexPositions, function(vertexPos) {
      for (var j = 0; j < glVerticesPerVertex; ++j) {
        vertices.push(
          // x,y,z,w,r,g.b.a
          vertexPos[0] / 40 + radius * Math.cos(unitRad * j),
          vertexPos[1] / 40 + radius * Math.sin(unitRad * j),
          0.0,
          1.0,
          nodeColor[0] / 255,
          nodeColor[1] / 255,
          nodeColor[2] / 255,
          nodeColor[3] / 255
        );
      }
    });

    // for vertex stroke
    _.forEach(vertexPositions, function(vertexPos) {
      for (var j = 0; j < glVerticesPerVertex; ++j) {
        vertices.push(
          // x,y,z,w,r,g.b.a
          vertexPos[0] / 40 + radius * Math.cos(unitRad * j),
          vertexPos[1] / 40 + radius * Math.sin(unitRad * j),
          0.0,
          1.0,
          nodeBorderColor[0] / 255,
          nodeBorderColor[1] / 255,
          nodeBorderColor[2] / 255,
          nodeBorderColor[3] / 255
        );
      }
    });

    console.log(vertexPositions.length + ' nodes, ' + edges.length + ' edges are loaded');
    return vertices;
  }

  _updateBufferObj() {
    var gl = this._ctx;
    if (this._vbo) {
      this._vbo.dispose();
    }
    this._vbo = createBuffer(gl, this._getBufferArray());
  }

  componentDidMount() {

    // register listeners:
    var canvasContainer = ReactDOM.findDOMNode(this.refs.overley);

    // get gl context
    var vertex = require('glslify!raw!./main.vertex.glsl')
    var frag = require('glslify!raw!./main.fragment.glsl')
    console.log(vertex, frag)

    var gl = this._ctx = getContext('webgl', {canvas: canvasContainer});
    this._shader = createShader(gl,
      glslify('./main.vertex.glsl'),
      glslify('./main.fragment.glsl'));
    this._updateBufferObj();
    this._redraw();
  	
  }

  componentWillReceiveProps(nextProps) {
    // TODO: might need to do some dity check for speed up
  }

  componentDidUpdate() {
    this._redraw();
  }

  componentWillUnMount() {
    // TODO: unregister mouse listeners
    // not sure how to do this
  }

  _redraw() {
    var frameTime = new Date();
    var gl = this._ctx;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this._shader.bind();

    var scale = this.state.scale;
    var scaleMat = new Float32Array([
      scale, 0.0,   0.0,   0.0,
      0.0,   scale, 0.0,   0.0,
      0.0,   0.0,   scale, 0.0,
      0.0,   0.0,   0.0,   1.0
    ]);

    this._shader.uniforms.scaleMat = scaleMat;
    this._shader.uniforms.translateVec = [this.state.translateX, this.state.translateY, 0, 0];

    this._vbo.bind();
    this._shader.attributes.a_Pos.pointer(gl.FLOAT, false, 4 * 8, 4 * 0);
    this._shader.attributes.a_Color.pointer(gl.FLOAT, false, 4 * 8, 4 * 4);

    // draw edges
    var numEdges = this.props.graphData.edges.length;
    var glVerticesPerEdge = 2;
    gl.lineWidth(1);
    gl.drawArrays(gl.LINES, 0, numEdges * glVerticesPerEdge);

    //draw nodes fill
    var numVertices = this.props.graphData.vertex_properties[0]['value'].length;
    var glVerticesPerVertex = 12;

    _.range(numVertices).forEach( (i) => {
      gl.drawArrays(gl.TRIANGLE_FAN, numEdges * glVerticesPerEdge + i * glVerticesPerVertex, glVerticesPerVertex);
    });
    //draw nodes stroke
    gl.lineWidth(1);
    _.range(numVertices).forEach( (i) => {
      gl.drawArrays(gl.LINE_LOOP, numEdges * glVerticesPerEdge + numVertices * glVerticesPerVertex + i * glVerticesPerVertex, glVerticesPerVertex);      
    });

    this._vbo.unbind();
    console.log('Render time', (new Date() - frameTime)/1000);
  }

  render() {

    const style = {
      width: this.props.width + 'px',
      height: this.props.height + 'px',
      border: '2px solid #CCCCCC'
    };

    return (
	    <canvas ref={"overlay"}
        width={this.props.width}
        height={this.props.height}
        style={style}/>
    );
  }
}

GraphGL.propTypes = {
  width: React.PropTypes.number.isRequired,
  graphData: React.PropTypes.object.isRequired,
  height: React.PropTypes.number.isRequired,
  setting: React.PropTypes.object.isRequired,
  scale: React.PropTypes.number,
  translateX: React.PropTypes.number,
  translateY: React.PropTypes.number
};

module.exports = GraphGL;
