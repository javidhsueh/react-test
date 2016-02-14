import React from 'react';
import GraphGL from '../src/index'

// import graphData from './data/cond-mat-2005.vidi.js';
import graphData from './data/dolphins.vidi.js';

var renderSetting = {
  uniformMapping: {
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
    {id: 0, nodes: [2,5,6], nodeSize: 15, nodeColor: [255,0,0,255]}
  ]
};

export default class Demo extends React.Component {
  
  _onSelectedNodeChanged(selectedNodes) {
    console.log('Selected nodes: ', selectedNodes);
  }

  render() {
    return (
    	<div>
        <GraphGL
          graphData={graphData}
          height={800}
          onSelectedNodeChanged={this._onSelectedNodeChanged}
          setting={renderSetting}
          width={800} />
	    </div>
    );
  }
}
