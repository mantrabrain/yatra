/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./assets/src/blocks/tour/components/item.js":
/*!***************************************************!*\
  !*** ./assets/src/blocks/tour/components/item.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Item": function() { return /* binding */ Item; }
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);


const Item = props => {
  let itemClassName = "yatra-tour-list-item ";

  if (props.options !== undefined) {
    if (props.options.tour_class !== undefined) {
      itemClassName = itemClassName + props.options.tour_class;
    }
  }

  return (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: itemClassName
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "yatra-item-inner"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("h2", {
    className: "yatra-tour-title"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("a", {
    href: "http://localhost/WordPressPlugins/tour/pathibhara-tour/"
  }, "Pathibhara Tour")), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("figure", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("img", {
    src: "http://localhost/WordPressPlugins/wp-content/uploads/2021/12/nepal.jpg"
  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("ul", {
    className: "yatra-tour-meta-options"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("li", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("i", {
    className: "fa fa-users"
  }), "\xA0", (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("strong", null, "Maximum Traveller: "), "10"), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("li", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("i", {
    className: "fa fa-chair"
  }), "\xA0", (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("strong", null, "Minimum Pax: "), "1"), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("li", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("i", {
    className: "fa fa-globe"
  }), "\xA0", (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("strong", null, "Country: "), "Nepal")), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "deals-footer"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("a", {
    href: "http://localhost/WordPressPlugins/tour/pathibhara-tour/",
    className: "button button-primary"
  }, "Book Now "))));
};

/***/ }),

/***/ "./assets/src/blocks/tour/components/template.js":
/*!*******************************************************!*\
  !*** ./assets/src/blocks/tour/components/template.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TourTemplate": function() { return /* binding */ TourTemplate; }
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _item_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./item.js */ "./assets/src/blocks/tour/components/item.js");

// Setup the block
//import {Item} from "./item.js";
//import {useState, useEffect} from '@wordpress/element';


const {
  apiFetch
} = wp;
const TourTemplate = props => {
  function getDynamicTemplate() {
    let postData = new FormData();
    postData.append('action', yatraBlocks.tour_action);
    apiFetch({
      url: yatraBlocks.ajax_url,
      method: 'POST',
      credentials: 'same-origin',
      body: postData
    }).then(response => {
      if (response.success) {
        return response.data;
      }
    }).catch(() => {
      return {};
    });
  }

  console.log(dynamic);
  return (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "yatra-shortcode-wrapper yatra-block-template-wrap"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "yatra-tour-list-wrap yatra-col-3"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_item_js__WEBPACK_IMPORTED_MODULE_2__.Item, {
    options: dynamic
  }), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_item_js__WEBPACK_IMPORTED_MODULE_2__.Item, {
    options: dynamic
  }), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_item_js__WEBPACK_IMPORTED_MODULE_2__.Item, {
    options: dynamic
  }), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_item_js__WEBPACK_IMPORTED_MODULE_2__.Item, {
    options: dynamic
  })));
};

/***/ }),

/***/ "./assets/src/blocks/tour/index.js":
/*!*****************************************!*\
  !*** ./assets/src/blocks/tour/index.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _components_template_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/template.js */ "./assets/src/blocks/tour/components/template.js");






let attributes = {
  content: {
    type: 'string',
    required: true,
    default: 'Inside of block',
    text_color: {
      type: 'string',
      default: '#ffffff'
    },
    bg_color: {
      type: 'string',
      default: '#000000'
    },
    per_page: {
      type: 'number',
      default: 10
    }
  }
};

const Edit = _ref => {
  let {
    attributes,
    setAttributes
  } = _ref;

  const onChangeBGColor = hexColor => {
    setAttributes({
      bg_color: hexColor
    });
  };

  const onChangeTextColor = hexColor => {
    setAttributes({
      text_color: hexColor
    });
  };

  const onChangePostPerPage = perPage => {
    setAttributes({
      per_page: perPage
    });
  };

  return (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useBlockProps)(), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.InspectorControls, null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    id: "gutenpride-controls"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("fieldset", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("legend", {
    className: "block-base-control__label"
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Posts Per Page', 'yatra')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_components__WEBPACK_IMPORTED_MODULE_3__.RangeControl, {
    label: "Columns",
    value: attributes.per_page,
    onChange: value => onChangePostPerPage(value),
    min: 2,
    max: 10
  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("fieldset", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("legend", {
    className: "blocks-base-control__label"
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Background color', 'gutenpride')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.ColorPalette // Element Tag for Gutenberg standard colour selector
  , {
    onChange: onChangeBGColor // onChange event callback

  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("fieldset", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("legend", {
    className: "blocks-base-control__label"
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Text color', 'gutenpride')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.ColorPalette // Element Tag for Gutenberg standard colour selector
  , {
    onChange: onChangeTextColor // onChange event callback

  })))), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_components_template_js__WEBPACK_IMPORTED_MODULE_5__.TourTemplate, null));
};

(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_1__.registerBlockType)('yatra/tour', {
  title: 'Tour',
  apiVersion: 2,
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('This block is used to show the tour packages of Yatra WordPress plugin.', 'yatra'),
  category: 'yatra',
  icon: 'dashicons dashicons-palmtree',
  supports: {
    html: false
  },
  attributes,
  edit: Edit,
  save: _ref2 => {
    let {
      attributes
    } = _ref2;
    return (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_2__.useBlockProps.save(), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(_components_template_js__WEBPACK_IMPORTED_MODULE_5__.TourTemplate, null));
  }
});

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ (function(module) {

module.exports = window["React"];

/***/ }),

/***/ "@wordpress/block-editor":
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
/***/ (function(module) {

module.exports = window["wp"]["blockEditor"];

/***/ }),

/***/ "@wordpress/blocks":
/*!********************************!*\
  !*** external ["wp","blocks"] ***!
  \********************************/
/***/ (function(module) {

module.exports = window["wp"]["blocks"];

/***/ }),

/***/ "@wordpress/components":
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/***/ (function(module) {

module.exports = window["wp"]["components"];

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ (function(module) {

module.exports = window["wp"]["element"];

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ (function(module) {

module.exports = window["wp"]["i18n"];

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
!function() {
/*!************************************!*\
  !*** ./assets/src/blocks/index.js ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _tour_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tour/index.js */ "./assets/src/blocks/tour/index.js");

}();
/******/ })()
;
//# sourceMappingURL=blocks.js.map