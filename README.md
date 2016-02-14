# react-graph-gl

This component is implemented to render large graph with interactive speed. 
It's a statelful react component, which means it changes the visualization result according to the props you passed into. 


## Usage

````js
    return r.div({},[
      r(GraphGL, {
        graphData: graphData,
        setting: renderSetting,
        width: 1000,
        height: 1000
      })
    ]);
````

See example/main.js for a full example

## API

### graphData: (object)
The graph data.

### width: (number)
The width of the container.

### height: (number)
The height of the container.

### setting: (object)
The rendering setting of the graph. Including three parts:
````js
// example: 
  setting: {
    uniformSetting: {
      nodeSize: 5,
      nodeColor: [43, 140, 190, 255],
      nodeShape: 'circle',
      nodeBorderColor: [143, 140, 190, 255],
      nodeShowLabel: true,
      edgeThickness: 2.0,
      edgeColor: [200, 200, 200, 255],
      edgePattern: 'solid',
      edgeRouting: 'line',
      edgeShowLabel: true
    },
    dataMapping: {
      nodeSizeProperty: 'none',
      nodeSizeRange: [1, 20],
      nodeColorProperty: 'none',
      nodeColorMap: [
        {offset: 0, color: [0, 0, 255, 255]},
	    {offset: 0.5, color: [128, 0, 128, 255]},
	    {offset: 1, color: [255, 0, 0, 255]}
      ],
      edgeThicknessProperty: 'none',
      edgeThicknessRange: [0.1, 5.0],
      edgeColorProperty: 'none',
      edgeColorMap: [
        {offset: 0, color: [0, 0, 255, 255]},
        {offset: 0.5, color: [128, 0, 128, 255]},
        {offset: 1, color: [255, 0, 0, 255]}
      ]
    },
    individualMapping: [
      {id: 0, nodes: [2,5,6], nodeSize: 15, nodeColor: [255, 0, 0, 255]}
    ]
  }
````
The rednering result will change according to this setting. 


## Callback

### function onNodeSelected (selectedNodes)


## More related work to read

1. [Andrew Thall](http://andrewthall.org/)'s
[Extended-Precision Floating-Point Numbers for GPU Computation](http://andrewthall.org/papers/df64_qf128.pdf).
2. [Improving precision in your vertex transform](http://github.prideout.net/emulating-double-precision/)
3. [Double Precision in OpenGL and WebGL](http://blog.hvidtfeldts.net/index.php/2012/07/double-precision-in-opengl-and-webgl/)
4. [Heavy computing with GLSL – Part 2: Emulated double precision](https://www.thasler.com/blog/blog/glsl-part2-emu)

## To install

    npm install

## To run

    npm run start

This will start a budo server running on localhost:9966.
