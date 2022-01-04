!function(){"use strict";var e={n:function(t){var a=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(a,{a:a}),a},d:function(t,a){for(var n in a)e.o(a,n)&&!e.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:a[n]})},o:function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}},t=window.wp.element,a=window.wp.blocks,n=window.wp.blockEditor,r=window.wp.components,o=window.wp.i18n,i=window.wp.serverSideRender,l=e.n(i);(0,a.registerBlockType)("yatra/activity",{apiVersion:2,title:(0,o.__)("Activity","yatra"),description:(0,o.__)("This block is used to show the activity list of Yatra WordPress plugin.","yatra"),icon:{foreground:"#1abc9c",src:"dashicons dashicons-universal-access"},category:"yatra",edit:e=>{const{attributes:a,setAttributes:i}=e,c=(0,n.useBlockProps)();return(0,t.createElement)("div",c,(0,t.createElement)(l(),{block:"yatra/activity",attributes:a}),(0,t.createElement)(n.InspectorControls,{key:"setting"},(0,t.createElement)("div",{id:"yatra-activity-controls"},(0,t.createElement)(r.Panel,null,(0,t.createElement)(r.PanelBody,{title:(0,o.__)("Activity Settings","yatra"),initialOpen:!0},(0,t.createElement)(r.SelectControl,{label:(0,o.__)("Order","yatra"),value:a.order,options:[{label:(0,o.__)("Ascending","yatra"),value:"asc"},{label:(0,o.__)("Descending","yatra"),value:"desc"}],onChange:e=>i({order:e})}),(0,t.createElement)(r.SelectControl,{label:(0,o.__)("Columns","yatra"),value:a.columns,options:[{label:(0,o.__)("Two (2)","yatra"),value:2},{label:(0,o.__)("Three (3)","yatra"),value:3},{label:(0,o.__)("Four (4)","yatra"),value:4}],onChange:e=>i({columns:e})}))))))}})}();