'use strict';

import _ 						  from 'lodash';
import React 				  from 'react';
import ReactDOM       from 'react-dom';
import createShader   from 'gl-shader';
import createBuffer   from 'gl-buffer';
import getContext     from 'get-canvas-context';
import keycode        from 'keycode';
import mouseWheel     from 'mouse-wheel';
import mousePressed   from 'mouse-pressed';
import mousePosition  from 'mouse-position';
import window         from 'global/window';

// glslify doens't support ES6 yet.
var glslify = require('glslify');

import Config         from './config';
import Constant       from './constant';
import Util           from './util';

class GraphGL extends React.Component {

	constructor(props) {
    super(props);
    // init state
    this.state = {
      scale: Config.scale,
      translateX: 0,
      translateY: 0,
      rectangle: [],
      mousePrevPos: [],
      mouseMoveDist: [],
      lasso: [],
      isMouseDown: false,
      currentMode: Config.currentMode
    };
  }

  screentoSpaceX (value) {
    return (value / this.props.width - 0.5) * 2 / this.state.scale - this.state.translateX;
  }

  screentoSpaceY (value) {
    return -(value / this.props.height - 0.5) * 2 / this.state.scale - this.state.translateY;
  }

  insidePolygon(x, y) {
    var pointinside = false;
    var i;
    var j = this.state.lasso.length - 2;
    for(i = 0; i < this.state.lasso.length; i += 2) {
      if ((this.state.lasso[i+1] < y && this.state.lasso[j+1] >= y
        || this.state.lasso[j+1] < y && this.state.lasso[i+1] >= y)
        && (this.state.lasso[i] <= x || this.state.lasso[j] <= x)) {
        pointinside ^= (this.state.lasso[i] + (y - this.state.lasso[i+1]) / (this.state.lasso[j+1] - this.state.lasso[i+1])
          * (this.state.lasso[j] - this.state.lasso[i]) < x);
      }
      j = i;
    }
    return pointinside;
  }

  _getBufferLasso() {
    var lassoVertices = [];
  
    for(var i = 0; i < this.state.lasso.length; i += 2) {
      if(this.state.lasso[i] == NaN){
        continue;
      }
      lassoVertices.push(
        //position and size: x,y,z,w
        this.state.lasso[i], this.state.lasso[i + 1], 0, 1,
        //color: rgba
        0.8, 0.3, 0.3, 1.0
      );
    }
    return lassoVertices;
  }

  _getBufferArray() {
    var vertices = [];

    // glVerticesPerVertex: circle resolution
    var glVerticesPerVertex = 12;
    var unitRad = 2 * Math.PI / glVerticesPerVertex;
    var radius = Config.nodeRadius;
    var edges = this.props.graphData.edges || [];
    var vertexPositions = _.result(_.find(this.props.graphData.vertex_properties,
      {name: 'position'}), 'value') || [];
    var edgeColor       = this.props.setting.uniformMapping.edgeColor;
    var nodeColor       = this.props.setting.uniformMapping.nodeColor;
    var nodeBorderColor = this.props.setting.uniformMapping.nodeBorderColor;

    // edge
    _.forEach(edges, (edge) => {
      var source = edge[0];
      var target = edge[1];
      vertices.push(
        // source x,y,z,w,
        vertexPositions[source][0], vertexPositions[source][1], 0.0, 1.0,
        // r,g.b.a
        edgeColor[0] / 255, edgeColor[1] / 255, edgeColor[2] / 255, edgeColor[3] / 255,
        // target x,y,z,w,
        vertexPositions[target][0], vertexPositions[target][1], 0.0, 1.0,
        // r,g,b,a
        edgeColor[0] / 255,
        edgeColor[1] / 255,
        edgeColor[2] / 255,
        edgeColor[3] / 255
      );
    });

    // for vertex fill
    _.forEach(vertexPositions, (vertexPos) => {
      for (var j = 0; j < glVerticesPerVertex; ++j) {
        vertices.push(
          // x,y,z,w,
          vertexPos[0] + radius * Math.cos(unitRad * j),
          vertexPos[1] + radius * Math.sin(unitRad * j),
          0.0,
          1.0,
          // r,g.b.a
          nodeColor[0] / 255,
          nodeColor[1] / 255,
          nodeColor[2] / 255,
          nodeColor[3] / 255
        );
      }
    });

    // for vertex stroke
    _.forEach(vertexPositions, (vertexPos) => {
      _.range(glVerticesPerVertex).forEach( (j) => {
        vertices.push(
          // x,y,z,w,r,g.b.a
          vertexPos[0] + radius * Math.cos(unitRad * j),
          vertexPos[1] + radius * Math.sin(unitRad * j),
          0.0,
          1.0,
          // r,g.b.a
          nodeBorderColor[0] / 255,
          nodeBorderColor[1] / 255,
          nodeBorderColor[2] / 255,
          nodeBorderColor[3] / 255
        );
      });
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

  _mouseScroll(dx, dy, dz) {
    if(this.state.scale + dy * Config.scrollStep < Config.minZoomScale) {
      this.setState({
        scale: Math.max(this.state.scale, 0)
      });
    }
    else {
      this.setState({
        scale: Math.max(this.state.scale + dy * Config.scrollStep, 0)
      });
    }
  }

  _mousePressDown(e) {
    if(e.button === Constant.Mouse.LEFT) {
      if(this.state.currentMode === Constant.Mode.HAND) {
        var vertexPositions = _.result(_.find(this.props.graphData.vertex_properties,
          {name: 'position'}), 'value') || [];

        var spacecoord  = [this.screentoSpaceX(e.x), this.screentoSpaceY(e.y)];
        for(var i = 0; i < vertexPositions.length; i++){
          if( Math.abs(vertexPositions[i][0] - spacecoord[0]) < Config.nodeRadius * this.state.scale &&
            Math.abs(vertexPositions[i][1] - spacecoord[1]) < Config.nodeRadius * this.state.scale){
            // TODO: do something?
            console.log('found');
          }
        }
        this.setState({
          mousePrevPos: [e.x, e.y],
          isMouseDown: true
        });
      }
      else if(this.state.currentMode === Constant.Mode.LASSO) {
        this.setState({
          isMouseDown: true,
          rectangle: [e.x, e.y, e.x, e.y]
        });  
      }
      else if(this.state.currentMode === Constant.Mode.IDK) {
        this.setState({
          isMouseDown: true,
          lasso: [this.screentoSpaceX(e.x), this.screentoSpaceY(e.y)]
        });  
      }
    } else if (e.button === Constant.Mouse.RIGHT) {
      // TODO: do nothing now, default right click used in a browser need to be stopped.
    }
  }

  _mouseMove(e) {
    // console.log('_mouseMove: ', e);
    if(this.state.isMouseDown) {
        if(this.state.currentMode === Constant.Mode.HAND) {
          if(Math.abs(e.x - this.state.mousePrevPos[0]) + Math.abs(e.y - this.state.mousePrevPos[1]) > 5) {
            var mouseMoveDist = [
              this.screentoSpaceX(e.x) - this.screentoSpaceX(this.state.mousePrevPos[0]),
              this.screentoSpaceY(e.y) - this.screentoSpaceY(this.state.mousePrevPos[1])
            ];
            this.setState({
              mousePrevPos: [e.x, e.y],
              mouseMoveDist: mouseMoveDist,
              translateX: this.state.translateX + mouseMoveDist[0],
              translateY: this.state.translateY + mouseMoveDist[1]
            });
          }
        } else if(this.state.currentMode === Constant.Mode.LASSO) {
          this.setState({
            rectangle: [
              this.state.rectangle[0],this.state.rectangle[1],
              e.x, e.y
            ]
          });
        } else if(this.state.currentMode === Constant.Mode.IDK) {
          this.setState({mousePrevPos: [e.x, e.y] });
        }
      }
  }

  _mousePressUp(e) {
    // console.log('_mousePressUp:', e);
    // check e so you can know whether there's other key pressed (ex: shift, ctrl, alt)
    // mouse left click
    if(e.button === Constant.Mouse.LEFT) {
      if(this.state.currentMode === Constant.Mode.HAND) {
        var spaceRectangle = Util.getSpaceRectangle(
          this.state.rectangle[0], this.state.rectangle[1],
          this.state.rectangle[2], this.state.rectangle[3]
        );

        var vertexPositions = _.result(_.find(this.props.graphData.vertex_properties,
          {name: 'position'}), 'value') || [];
        
        var found = _.filter(vertexPositions, (vertex) => {
          return vertex[0] > spaceRectangle[0] &&
            vertex[0] < spaceRectangle[2] &&
            vertex[1] > spaceRectangle[1] &&
            vertex[1] < spaceRectangle[3];
        });
        this._notifyOnSelectedNodesChanged(found);
      }
      else if(this.state.currentMode === Constant.Mode.LASSO) {
        var vertexPositions = _.result(_.find(this.props.graphData.vertex_properties,
          {name: 'position'}), 'value') || [];
        var found = _.filter(vertexPositions, (vertex) => {
          return this.insidePolygon(vertex[0], vertex[1]);
        });
        this._notifyOnSelectedNodesChanged(found);
      }
      else{
        this.setState({isMouseDown: false});
      }
    } else if (e.button === Constant.Mouse.RIGHT) {
      // TODO: do notthing now, default right click used in a browser need to be stopped.
    }

    this.setState({
      isMouseDown: false,
      rectangle: [],
      lasso: [],
      mousePrevPos: []
    });
  }

  _onkeypress(key) {
    switch(key.keyCode) {
      case keycode.KEY_1:
        this.setState({currentMode: Constant.Mode.HAND});
        break;
      case keycode.KEY_2:
        this.setState({currentMode: Constant.Mode.LASSO});
        break;
      case keycode.KEY_3:
        // TODO: not sure why we need Key_3
        this.setState({currentMode: Constant.Mode.IDK});
        break;
    }
  }

  componentDidMount() {
    // propogate props to state
    /*eslint-disable react/no-did-mount-set-state*/
    this.setState({
      scale: this.props.scale || this.state.scale,
      translateX: this.props.translateX || this.state.translateX,
      translateY: this.props.translateY || this.state.translateY
    });
    /*eslint-enable react/no-did-mount-set-state*/

    // register listeners:
    var canvasContainer = ReactDOM.findDOMNode(this.refs.overlay);
    
    // register listeners
    var mouseMoveCallback = _.throttle(this._mouseMove.bind(this),
      Config.mouseMoveThrottle, {'trailing' : true});
    mouseWheel(canvasContainer, this._mouseScroll.bind(this), true);
    mousePressed(canvasContainer, true)
      .on('up', this._mousePressUp.bind(this))
      .on('down', this._mousePressDown.bind(this))
    mousePosition(canvasContainer)
      .on('move', mouseMoveCallback);
    canvasContainer.addEventListener('keydown', this._onkeypress.bind(this));

    var gl = this._ctx = getContext('webgl', {canvas: canvasContainer});

    // NOTE: you can't replace the path of the shader with a string variable.
    // when webpack compile this code, it will transform it as compiled shader string.
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

  _notifyOnSelectedNodesChanged(selectedNodes) {
    if(this.props.onSelectedNodeChanged) {
      this.props.onSelectedNodeChanged(selectedNodes);
    }
  }

  _redraw() {
    // var frameTime = new Date();
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
    var vertexPositions = _.result(_.find(this.props.graphData.vertex_properties,
      {name: 'position'}), 'value') || [];
    var numVertices = vertexPositions.length;
    var glVerticesPerVertex = 12;
    _.range(numVertices).forEach( (i) => {
      gl.drawArrays(gl.TRIANGLE_FAN, numEdges * glVerticesPerEdge + i * glVerticesPerVertex, glVerticesPerVertex);
    });

    // draw nodes stroke
    gl.lineWidth(1);
    _.range(numVertices).forEach( (i) => {
      gl.drawArrays(gl.LINE_LOOP, numEdges * glVerticesPerEdge + numVertices * glVerticesPerVertex + i * glVerticesPerVertex, glVerticesPerVertex);
    });

    if(_.isEmpty(this.state.mouseSelect) === false) {
      // TODO: do we need to check this condition?
    } else if(_.isEmpty(this.state.rectangle) === false) {
       var spacecoord = [
        this.screentoSpaceX(this.state.rectangle[0]),
        this.screentoSpaceY(this.state.rectangle[1]),
        this.screentoSpaceX(this.state.rectangle[2]),
        this.screentoSpaceY(this.state.rectangle[3])
      ];             
      this._cbo = createBuffer(gl,[
        spacecoord[0], spacecoord[1], 0, 1, 0.8, 0.3, 0.3, 1,
        spacecoord[0], spacecoord[3], 0, 1, 0.8, 0.3, 0.3, 1,
        spacecoord[2], spacecoord[3], 0, 1, 0.8, 0.3, 0.3, 1,
        spacecoord[2], spacecoord[1], 0, 1, 0.8, 0.3, 0.3, 1
      ]);
      this._cbo.bind();
      this._shader.attributes.a_Pos.pointer(gl.FLOAT, false, 4 * 8, 4 * 0);
      this._shader.attributes.a_Color.pointer(gl.FLOAT, false, 4 * 8, 4 * 4);
      gl.drawArrays(gl.LINE_LOOP, 0, 4);
    } else if(_.isEmpty(this.state.mousePrevPos) === false) {
      this.state.lasso.push(
        this.screentoSpaceX(this.state.mousePrevPos[0]),
        this.screentoSpaceY(this.state.mousePrevPos[1])
      );
      
      if(this.state.lasso.length > 2) {
        this._cbo = createBuffer(gl, this._getBufferLasso());
        this._cbo.bind();
        this._shader.attributes.a_Pos.pointer(gl.FLOAT, false, 4 * 8, 4 * 0);
        this._shader.attributes.a_Color.pointer(gl.FLOAT, false, 4 * 8, 4 * 4);
        gl.drawArrays(gl.LINE_LOOP, 0, this.state.lasso.length / 2);
      }
    }
    this._vbo.unbind();
    // console.log('render time', (new Date() - frameTime) / 1000);
  }

  render() {

    const style = {
      width: this.props.width + 'px',
      height: this.props.height + 'px',
      border: '2px solid #CCCCCC'
    };

    return (
	    <canvas
        height={this.props.height}
        ref={'overlay'}
        style={style}
        width={this.props.width}/>
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
  translateY: React.PropTypes.number,
  onSelectedNodeChanged: React.PropTypes.func
};

module.exports = GraphGL;
