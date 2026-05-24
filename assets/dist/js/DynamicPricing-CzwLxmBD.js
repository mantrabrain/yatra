import { a5 as React, a3 as isFunction, ao as Animate, an as isEqual, r as reactExports, c0 as Target, p as Calendar, U as Users, bm as BarChart, T as TrendingUp, as as DollarSign, ar as Clock, Z as Zap, j as jsxRuntimeExports, S as Sparkles, at as ArrowRight, A as Activity, av as CheckCircle, t as useQueryClient, u as useQuery, v as useMutation, l as Settings, aw as Plus, az as AlertCircle, h as Package, aJ as PenSquare, aA as Check, aN as Trash2, aV as Save } from "./react-vendor-CqkbFEvK.js";
import { af as clsx, ag as Dot, ah as findAllByType, ai as ErrorBar, aj as Layer, ak as filterProps, al as Curve, am as interpolateNumber, an as isNil, ao as hasClipDot, ap as LabelList, aq as getValueByDataKey, ar as uniqueId, as as Global, at as getCateCoordinateOfLine, au as generateCategoricalChart, av as XAxis, aw as YAxis, ax as formatAxisMap, B as Button, C as Card, d as CardContent, P as PageHeader, ay as SearchFilterToolbar, a2 as BulkActionToolbar, f as CardHeader, g as CardTitle, h as CardDescription, U as Table, e as Badge, az as ResponsiveContainer, aA as CartesianGrid, aB as Tooltip, k as ConfirmationDialog } from "../../admin/dist/js/app.js";
import { R as RuleTypeSelectionModal } from "./RuleTypeSelectionModal-BpEgGbfR.js";
import { T as Toggle } from "./toggle-C9qtIVLs.js";
import { _ as __, u as useToast, a as apiClient, f as formatYatraMoney } from "./index-fqW8jODk.js";
var _excluded = ["type", "layout", "connectNulls", "ref"], _excluded2 = ["key"];
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
function _callSuper(t, o, e) {
  return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t2) {
  }
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct2() {
    return !!t;
  })();
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });
  Object.defineProperty(subClass, "prototype", { writable: false });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(t);
}
var Line = /* @__PURE__ */ function(_PureComponent) {
  function Line2() {
    var _this;
    _classCallCheck(this, Line2);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, Line2, [].concat(args));
    _defineProperty(_this, "state", {
      isAnimationFinished: true,
      totalLength: 0
    });
    _defineProperty(_this, "generateSimpleStrokeDasharray", function(totalLength, length) {
      return "".concat(length, "px ").concat(totalLength - length, "px");
    });
    _defineProperty(_this, "getStrokeDasharray", function(length, totalLength, lines) {
      var lineLength = lines.reduce(function(pre, next) {
        return pre + next;
      });
      if (!lineLength) {
        return _this.generateSimpleStrokeDasharray(totalLength, length);
      }
      var count = Math.floor(length / lineLength);
      var remainLength = length % lineLength;
      var restLength = totalLength - length;
      var remainLines = [];
      for (var i = 0, sum = 0; i < lines.length; sum += lines[i], ++i) {
        if (sum + lines[i] > remainLength) {
          remainLines = [].concat(_toConsumableArray(lines.slice(0, i)), [remainLength - sum]);
          break;
        }
      }
      var emptyLines = remainLines.length % 2 === 0 ? [0, restLength] : [restLength];
      return [].concat(_toConsumableArray(Line2.repeat(lines, count)), _toConsumableArray(remainLines), emptyLines).map(function(line) {
        return "".concat(line, "px");
      }).join(", ");
    });
    _defineProperty(_this, "id", uniqueId("recharts-line-"));
    _defineProperty(_this, "pathRef", function(node) {
      _this.mainCurve = node;
    });
    _defineProperty(_this, "handleAnimationEnd", function() {
      _this.setState({
        isAnimationFinished: true
      });
      if (_this.props.onAnimationEnd) {
        _this.props.onAnimationEnd();
      }
    });
    _defineProperty(_this, "handleAnimationStart", function() {
      _this.setState({
        isAnimationFinished: false
      });
      if (_this.props.onAnimationStart) {
        _this.props.onAnimationStart();
      }
    });
    return _this;
  }
  _inherits(Line2, _PureComponent);
  return _createClass(Line2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (!this.props.isAnimationActive) {
        return;
      }
      var totalLength = this.getTotalLength();
      this.setState({
        totalLength
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if (!this.props.isAnimationActive) {
        return;
      }
      var totalLength = this.getTotalLength();
      if (totalLength !== this.state.totalLength) {
        this.setState({
          totalLength
        });
      }
    }
  }, {
    key: "getTotalLength",
    value: function getTotalLength() {
      var curveDom = this.mainCurve;
      try {
        return curveDom && curveDom.getTotalLength && curveDom.getTotalLength() || 0;
      } catch (err) {
        return 0;
      }
    }
  }, {
    key: "renderErrorBar",
    value: function renderErrorBar(needClip, clipPathId) {
      if (this.props.isAnimationActive && !this.state.isAnimationFinished) {
        return null;
      }
      var _this$props = this.props, points = _this$props.points, xAxis = _this$props.xAxis, yAxis = _this$props.yAxis, layout = _this$props.layout, children = _this$props.children;
      var errorBarItems = findAllByType(children, ErrorBar);
      if (!errorBarItems) {
        return null;
      }
      var dataPointFormatter = function dataPointFormatter2(dataPoint, dataKey) {
        return {
          x: dataPoint.x,
          y: dataPoint.y,
          value: dataPoint.value,
          errorVal: getValueByDataKey(dataPoint.payload, dataKey)
        };
      };
      var errorBarProps = {
        clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : null
      };
      return /* @__PURE__ */ React.createElement(Layer, errorBarProps, errorBarItems.map(function(item) {
        return /* @__PURE__ */ React.cloneElement(item, {
          key: "bar-".concat(item.props.dataKey),
          data: points,
          xAxis,
          yAxis,
          layout,
          dataPointFormatter
        });
      }));
    }
  }, {
    key: "renderDots",
    value: function renderDots(needClip, clipDot, clipPathId) {
      var isAnimationActive = this.props.isAnimationActive;
      if (isAnimationActive && !this.state.isAnimationFinished) {
        return null;
      }
      var _this$props2 = this.props, dot = _this$props2.dot, points = _this$props2.points, dataKey = _this$props2.dataKey;
      var lineProps = filterProps(this.props, false);
      var customDotProps = filterProps(dot, true);
      var dots = points.map(function(entry, i) {
        var dotProps = _objectSpread(_objectSpread(_objectSpread({
          key: "dot-".concat(i),
          r: 3
        }, lineProps), customDotProps), {}, {
          index: i,
          cx: entry.x,
          cy: entry.y,
          value: entry.value,
          dataKey,
          payload: entry.payload,
          points
        });
        return Line2.renderDotItem(dot, dotProps);
      });
      var dotsProps = {
        clipPath: needClip ? "url(#clipPath-".concat(clipDot ? "" : "dots-").concat(clipPathId, ")") : null
      };
      return /* @__PURE__ */ React.createElement(Layer, _extends({
        className: "recharts-line-dots",
        key: "dots"
      }, dotsProps), dots);
    }
  }, {
    key: "renderCurveStatically",
    value: function renderCurveStatically(points, needClip, clipPathId, props) {
      var _this$props3 = this.props, type = _this$props3.type, layout = _this$props3.layout, connectNulls = _this$props3.connectNulls;
      _this$props3.ref;
      var others = _objectWithoutProperties(_this$props3, _excluded);
      var curveProps = _objectSpread(_objectSpread(_objectSpread({}, filterProps(others, true)), {}, {
        fill: "none",
        className: "recharts-line-curve",
        clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : null,
        points
      }, props), {}, {
        type,
        layout,
        connectNulls
      });
      return /* @__PURE__ */ React.createElement(Curve, _extends({}, curveProps, {
        pathRef: this.pathRef
      }));
    }
  }, {
    key: "renderCurveWithAnimation",
    value: function renderCurveWithAnimation(needClip, clipPathId) {
      var _this2 = this;
      var _this$props4 = this.props, points = _this$props4.points, strokeDasharray = _this$props4.strokeDasharray, isAnimationActive = _this$props4.isAnimationActive, animationBegin = _this$props4.animationBegin, animationDuration = _this$props4.animationDuration, animationEasing = _this$props4.animationEasing, animationId = _this$props4.animationId, animateNewValues = _this$props4.animateNewValues, width = _this$props4.width, height = _this$props4.height;
      var _this$state = this.state, prevPoints = _this$state.prevPoints, totalLength = _this$state.totalLength;
      return /* @__PURE__ */ React.createElement(Animate, {
        begin: animationBegin,
        duration: animationDuration,
        isActive: isAnimationActive,
        easing: animationEasing,
        from: {
          t: 0
        },
        to: {
          t: 1
        },
        key: "line-".concat(animationId),
        onAnimationEnd: this.handleAnimationEnd,
        onAnimationStart: this.handleAnimationStart
      }, function(_ref) {
        var t = _ref.t;
        if (prevPoints) {
          var prevPointsDiffFactor = prevPoints.length / points.length;
          var stepData = points.map(function(entry, index) {
            var prevPointIndex = Math.floor(index * prevPointsDiffFactor);
            if (prevPoints[prevPointIndex]) {
              var prev = prevPoints[prevPointIndex];
              var interpolatorX = interpolateNumber(prev.x, entry.x);
              var interpolatorY = interpolateNumber(prev.y, entry.y);
              return _objectSpread(_objectSpread({}, entry), {}, {
                x: interpolatorX(t),
                y: interpolatorY(t)
              });
            }
            if (animateNewValues) {
              var _interpolatorX = interpolateNumber(width * 2, entry.x);
              var _interpolatorY = interpolateNumber(height / 2, entry.y);
              return _objectSpread(_objectSpread({}, entry), {}, {
                x: _interpolatorX(t),
                y: _interpolatorY(t)
              });
            }
            return _objectSpread(_objectSpread({}, entry), {}, {
              x: entry.x,
              y: entry.y
            });
          });
          return _this2.renderCurveStatically(stepData, needClip, clipPathId);
        }
        var interpolator = interpolateNumber(0, totalLength);
        var curLength = interpolator(t);
        var currentStrokeDasharray;
        if (strokeDasharray) {
          var lines = "".concat(strokeDasharray).split(/[,\s]+/gim).map(function(num) {
            return parseFloat(num);
          });
          currentStrokeDasharray = _this2.getStrokeDasharray(curLength, totalLength, lines);
        } else {
          currentStrokeDasharray = _this2.generateSimpleStrokeDasharray(totalLength, curLength);
        }
        return _this2.renderCurveStatically(points, needClip, clipPathId, {
          strokeDasharray: currentStrokeDasharray
        });
      });
    }
  }, {
    key: "renderCurve",
    value: function renderCurve(needClip, clipPathId) {
      var _this$props5 = this.props, points = _this$props5.points, isAnimationActive = _this$props5.isAnimationActive;
      var _this$state2 = this.state, prevPoints = _this$state2.prevPoints, totalLength = _this$state2.totalLength;
      if (isAnimationActive && points && points.length && (!prevPoints && totalLength > 0 || !isEqual(prevPoints, points))) {
        return this.renderCurveWithAnimation(needClip, clipPathId);
      }
      return this.renderCurveStatically(points, needClip, clipPathId);
    }
  }, {
    key: "render",
    value: function render() {
      var _filterProps;
      var _this$props6 = this.props, hide = _this$props6.hide, dot = _this$props6.dot, points = _this$props6.points, className = _this$props6.className, xAxis = _this$props6.xAxis, yAxis = _this$props6.yAxis, top = _this$props6.top, left = _this$props6.left, width = _this$props6.width, height = _this$props6.height, isAnimationActive = _this$props6.isAnimationActive, id = _this$props6.id;
      if (hide || !points || !points.length) {
        return null;
      }
      var isAnimationFinished = this.state.isAnimationFinished;
      var hasSinglePoint = points.length === 1;
      var layerClass = clsx("recharts-line", className);
      var needClipX = xAxis && xAxis.allowDataOverflow;
      var needClipY = yAxis && yAxis.allowDataOverflow;
      var needClip = needClipX || needClipY;
      var clipPathId = isNil(id) ? this.id : id;
      var _ref2 = (_filterProps = filterProps(dot, false)) !== null && _filterProps !== void 0 ? _filterProps : {
        r: 3,
        strokeWidth: 2
      }, _ref2$r = _ref2.r, r = _ref2$r === void 0 ? 3 : _ref2$r, _ref2$strokeWidth = _ref2.strokeWidth, strokeWidth = _ref2$strokeWidth === void 0 ? 2 : _ref2$strokeWidth;
      var _ref3 = hasClipDot(dot) ? dot : {}, _ref3$clipDot = _ref3.clipDot, clipDot = _ref3$clipDot === void 0 ? true : _ref3$clipDot;
      var dotSize = r * 2 + strokeWidth;
      return /* @__PURE__ */ React.createElement(Layer, {
        className: layerClass
      }, needClipX || needClipY ? /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", {
        id: "clipPath-".concat(clipPathId)
      }, /* @__PURE__ */ React.createElement("rect", {
        x: needClipX ? left : left - width / 2,
        y: needClipY ? top : top - height / 2,
        width: needClipX ? width : width * 2,
        height: needClipY ? height : height * 2
      })), !clipDot && /* @__PURE__ */ React.createElement("clipPath", {
        id: "clipPath-dots-".concat(clipPathId)
      }, /* @__PURE__ */ React.createElement("rect", {
        x: left - dotSize / 2,
        y: top - dotSize / 2,
        width: width + dotSize,
        height: height + dotSize
      }))) : null, !hasSinglePoint && this.renderCurve(needClip, clipPathId), this.renderErrorBar(needClip, clipPathId), (hasSinglePoint || dot) && this.renderDots(needClip, clipDot, clipPathId), (!isAnimationActive || isAnimationFinished) && LabelList.renderCallByParent(this.props, points));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(nextProps, prevState) {
      if (nextProps.animationId !== prevState.prevAnimationId) {
        return {
          prevAnimationId: nextProps.animationId,
          curPoints: nextProps.points,
          prevPoints: prevState.curPoints
        };
      }
      if (nextProps.points !== prevState.curPoints) {
        return {
          curPoints: nextProps.points
        };
      }
      return null;
    }
  }, {
    key: "repeat",
    value: function repeat(lines, count) {
      var linesUnit = lines.length % 2 !== 0 ? [].concat(_toConsumableArray(lines), [0]) : lines;
      var result = [];
      for (var i = 0; i < count; ++i) {
        result = [].concat(_toConsumableArray(result), _toConsumableArray(linesUnit));
      }
      return result;
    }
  }, {
    key: "renderDotItem",
    value: function renderDotItem(option, props) {
      var dotItem;
      if (/* @__PURE__ */ React.isValidElement(option)) {
        dotItem = /* @__PURE__ */ React.cloneElement(option, props);
      } else if (isFunction(option)) {
        dotItem = option(props);
      } else {
        var key = props.key, dotProps = _objectWithoutProperties(props, _excluded2);
        var className = clsx("recharts-line-dot", typeof option !== "boolean" ? option.className : "");
        dotItem = /* @__PURE__ */ React.createElement(Dot, _extends({
          key
        }, dotProps, {
          className
        }));
      }
      return dotItem;
    }
  }]);
}(reactExports.PureComponent);
_defineProperty(Line, "displayName", "Line");
_defineProperty(Line, "defaultProps", {
  xAxisId: 0,
  yAxisId: 0,
  connectNulls: false,
  activeDot: true,
  dot: true,
  legendType: "line",
  stroke: "#3182bd",
  strokeWidth: 1,
  fill: "#fff",
  points: [],
  isAnimationActive: !Global.isSsr,
  animateNewValues: true,
  animationBegin: 0,
  animationDuration: 1500,
  animationEasing: "ease",
  hide: false,
  label: false
});
_defineProperty(Line, "getComposedData", function(_ref4) {
  var props = _ref4.props, xAxis = _ref4.xAxis, yAxis = _ref4.yAxis, xAxisTicks = _ref4.xAxisTicks, yAxisTicks = _ref4.yAxisTicks, dataKey = _ref4.dataKey, bandSize = _ref4.bandSize, displayedData = _ref4.displayedData, offset = _ref4.offset;
  var layout = props.layout;
  var points = displayedData.map(function(entry, index) {
    var value = getValueByDataKey(entry, dataKey);
    if (layout === "horizontal") {
      return {
        x: getCateCoordinateOfLine({
          axis: xAxis,
          ticks: xAxisTicks,
          bandSize,
          entry,
          index
        }),
        y: isNil(value) ? null : yAxis.scale(value),
        value,
        payload: entry
      };
    }
    return {
      x: isNil(value) ? null : xAxis.scale(value),
      y: getCateCoordinateOfLine({
        axis: yAxis,
        ticks: yAxisTicks,
        bandSize,
        entry,
        index
      }),
      value,
      payload: entry
    };
  });
  return _objectSpread({
    points,
    layout
  }, offset);
});
var LineChart = generateCategoricalChart({
  chartName: "LineChart",
  GraphicalChild: Line,
  axisComponents: [{
    axisType: "xAxis",
    AxisComp: XAxis
  }, {
    axisType: "yAxis",
    AxisComp: YAxis
  }],
  formatAxisMap
});
const DynamicPricingPremium = () => {
  const features = [
    {
      icon: Target,
      title: __("Smart Pricing Rules"),
      description: __(
        "Create intelligent pricing rules based on demand, season, and booking patterns."
      )
    },
    {
      icon: Calendar,
      title: __("Time-based Pricing"),
      description: __(
        "Set different prices for early bookings, last-minute deals, and peak seasons."
      )
    },
    {
      icon: Users,
      title: __("Group Pricing"),
      description: __(
        "Offer tiered pricing based on group size and booking volume."
      )
    },
    {
      icon: BarChart,
      title: __("Revenue Analytics"),
      description: __(
        "Track pricing performance and optimize your revenue strategy."
      )
    }
  ];
  const stats = [
    {
      icon: TrendingUp,
      value: "42%",
      label: __("Revenue Increase")
    },
    {
      icon: Users,
      value: "3.2x",
      label: __("Booking Conversion")
    },
    {
      icon: Target,
      value: "Unlimited",
      label: __("Pricing Rules")
    },
    {
      icon: DollarSign,
      value: "Auto",
      label: __("Price Optimization")
    }
  ];
  const popularRules = [
    {
      icon: Clock,
      title: __("Early Bird Discounts"),
      description: __("Reward early bookings with attractive discounts."),
      discount: __("Save up to 20%")
    },
    {
      icon: Zap,
      title: __("Last-minute Deals"),
      description: __("Fill remaining spots with dynamic last-minute pricing."),
      discount: __("Save up to 30%")
    },
    {
      icon: Calendar,
      title: __("Seasonal Pricing"),
      description: __(
        "Adjust prices automatically based on peak and off-peak seasons."
      ),
      discount: __("Varies by season")
    },
    {
      icon: Users,
      title: __("Group Discounts"),
      description: __("Offer better rates for larger group bookings."),
      discount: __("Save 10-25%")
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-amber-600 dark:text-amber-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-amber-900 dark:text-amber-100", children: __("Premium Feature") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-700 dark:text-amber-300 text-sm", children: __(
            "Dynamic Pricing is a premium module. Upgrade to Yatra Pro to unlock intelligent pricing automation."
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          className: "bg-amber-600 text-white hover:bg-amber-700 px-6 py-2 text-sm font-medium",
          onClick: () => window.open(
            "https://wpyatra.com/pricing?module=dynamic-pricing",
            "_blank"
          ),
          children: [
            __("Upgrade to Pro"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white", children: __("Dynamic Pricing") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3 h-3 mr-1" }),
          __("PRO")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto", children: __(
        "Maximize your revenue with intelligent pricing that automatically adjusts based on demand, season, and booking patterns."
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-12", children: stats.map((stat, index) => {
      const Icon = stat.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Card,
        {
          className: "border border-gray-200 dark:border-gray-700",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stat.value }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 dark:text-gray-400", children: stat.label })
            ] })
          ] }) })
        },
        index
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center", children: __("Powerful Features") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: features.map((feature, index) => {
        const Icon = feature.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: "border border-gray-200 dark:border-gray-700",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: feature.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 text-sm", children: feature.description })
              ] })
            ] }) })
          },
          index
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center", children: __("Popular Pricing Rules") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: popularRules.map((rule, index) => {
        const Icon = rule.icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Card,
          {
            className: "border border-gray-200 dark:border-gray-700",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: rule.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mb-3", children: rule.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-blue-600 dark:text-blue-400 font-semibold text-sm", children: rule.discount })
            ] }) })
          },
          index
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "mb-12 border border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: __("How It Works") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400", children: __("Intelligent pricing in 4 simple steps") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: __("1. Set Rules") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
            "Define pricing rules based on demand, season, and booking patterns"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "w-8 h-8 text-green-600 dark:text-green-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: __("2. Monitor Demand") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("System tracks booking patterns and demand in real-time") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: __("3. Auto-Adjust") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __(
            "Prices automatically adjust based on your predefined rules"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-8 h-8 text-orange-600 dark:text-orange-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold mb-2", children: __("4. Maximize Revenue") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Optimize pricing for maximum revenue and occupancy") })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 md:mb-0 md:pr-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: __("Unlock Dynamic Pricing") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: __(
          "Get intelligent price adjustments and maximize your revenue with Yatra Pro."
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Early bird discounts") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Last-minute deals") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Demand-based pricing") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-sm font-medium mb-3",
            onClick: () => window.open(
              "https://wpyatra.com/pricing?module=dynamic-pricing",
              "_blank"
            ),
            children: [
              __("Upgrade to Pro"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: __("14-day money-back guarantee") })
      ] })
    ] }) })
  ] });
};
const isModuleAvailable = () => {
  const yatraAdmin = window == null ? void 0 : window.yatraAdmin;
  return Boolean(yatraAdmin == null ? void 0 : yatraAdmin.isPro);
};
const DynamicPricingPage = () => {
  var _a, _b, _c;
  const [activeTab, setActiveTab] = reactExports.useState("rules");
  const [showRuleTypeModal, setShowRuleTypeModal] = reactExports.useState(false);
  const [settings, setSettings] = reactExports.useState({
    rule_priority_mode: "highest",
    maximum_markup_percent: 50,
    maximum_discount_percent: 30,
    calculation_period: 7,
    update_frequency: "hourly",
    show_original_price: true,
    show_savings_badge: true,
    show_urgency_messages: false,
    /** discounted = rules use sale/effective price; regular = rules use list price when known */
    calculation_base: "discounted"
  });
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [sortBy, setSortBy] = reactExports.useState("name");
  const [sortOrder, setSortOrder] = reactExports.useState("asc");
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const [bulkAction, setBulkAction] = reactExports.useState("");
  const [showColumnsDropdown, setShowColumnsDropdown] = reactExports.useState(false);
  const [confirmDialog, setConfirmDialog] = reactExports.useState({
    isOpen: false,
    rule: null
  });
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const closeConfirmDialog = () => setConfirmDialog({
    isOpen: false,
    rule: null,
    title: "",
    message: "",
    confirmText: "",
    variant: "danger",
    isLoading: false,
    onConfirm: () => {
    }
  });
  const invalidateRules = () => {
    queryClient.invalidateQueries({ queryKey: ["dynamic-pricing-rules"] });
    queryClient.invalidateQueries({
      queryKey: ["dynamic-pricing-statistics"]
    });
  };
  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiClient.post("/dynamic-pricing/settings", settings);
      showToast(__("Settings saved successfully"), "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      showToast(__("Failed to save settings. Please try again."), "error");
    } finally {
      setIsSaving(false);
    }
  };
  const handleSelectRuleType = (ruleType) => {
    const baseUrl = window.location.href.split("&action=")[0];
    window.location.href = `${baseUrl}&action=create-pricing-rule&rule_type=${ruleType}`;
  };
  if (!isModuleAvailable()) return /* @__PURE__ */ jsxRuntimeExports.jsx(DynamicPricingPremium, {});
  const { data: settingsData } = useQuery({
    queryKey: ["dynamic-pricing-settings"],
    queryFn: async () => {
      const response = await apiClient.get("/dynamic-pricing/settings");
      const body = (response == null ? void 0 : response.data) ?? response;
      const payload = (body == null ? void 0 : body.data) ?? body;
      return payload && typeof payload === "object" ? payload : {};
    }
  });
  React.useEffect(() => {
    if (settingsData && typeof settingsData === "object") {
      setSettings((prev) => ({
        ...prev,
        ...settingsData,
        calculation_base: settingsData.calculation_base === "regular" ? "regular" : "discounted"
      }));
    }
  }, [settingsData]);
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["dynamic-pricing-rules"],
    queryFn: async () => {
      const response = await apiClient.get("/dynamic-pricing/rules");
      return response;
    }
  });
  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError
  } = useQuery({
    queryKey: ["dynamic-pricing-statistics"],
    queryFn: async () => {
      const response = await apiClient.get("/dynamic-pricing/statistics");
      return response;
    }
  });
  const rulesPayload = ((_a = rulesData == null ? void 0 : rulesData.data) == null ? void 0 : _a.data) ?? (rulesData == null ? void 0 : rulesData.data) ?? [];
  const statsPayload = ((_b = statsData == null ? void 0 : statsData.data) == null ? void 0 : _b.data) ?? (statsData == null ? void 0 : statsData.data) ?? {};
  const rules = rulesPayload || [];
  const stats = statsPayload || {};
  const globalCurrency = ((_c = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _c.currency) || "USD";
  const formatCurrencyAmount = (amount) => formatYatraMoney(Number(amount) || 0, globalCurrency, {
    zeroAsUnknown: false
  });
  const trendData = Array.isArray(
    stats == null ? void 0 : stats.pricing_history_trend_last_30_days
  ) ? stats.pricing_history_trend_last_30_days.map((row) => {
    const day = String(row.day || "");
    const dateLabel = day ? new Date(day).toLocaleDateString() : "";
    return {
      day,
      dateLabel,
      events: Number(row.events) || 0,
      totalAdjustmentAmount: Number(row.total_adjustment_amount) || 0,
      avgAdjustmentPercentage: Number(row.avg_adjustment_percentage) || 0
    };
  }) : [];
  const ruleImpact = Array.isArray(
    stats == null ? void 0 : stats.pricing_history_rule_impact_last_30_days
  ) ? stats.pricing_history_rule_impact_last_30_days : [];
  const analyticsLoading = isLoading || isStatsLoading;
  const statsErrorMessage = statsError ? (statsError == null ? void 0 : statsError.message) || String(statsError) : "";
  const filteredRules = reactExports.useMemo(() => {
    let filtered = [...rules];
    if (searchTerm) {
      filtered = filtered.filter(
        (rule) => {
          var _a2, _b2;
          return ((_a2 = rule.name) == null ? void 0 : _a2.toLowerCase().includes(searchTerm.toLowerCase())) || ((_b2 = rule.rule_type) == null ? void 0 : _b2.toLowerCase().includes(searchTerm.toLowerCase()));
        }
      );
    }
    if (statusFilter === "all") {
      filtered = filtered.filter((rule) => rule.status !== "trash");
    } else {
      filtered = filtered.filter((rule) => rule.status === statusFilter);
    }
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === "created_at" || sortBy === "updated_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return filtered;
  }, [rules, searchTerm, statusFilter, sortBy, sortOrder]);
  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids }) => {
      const requests = ids.map((id) => {
        if (action === "delete") {
          return apiClient.delete(`/dynamic-pricing/rules/${id}`);
        } else if (action === "restore") {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, {
            status: "active"
          });
        } else if (action === "trash") {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, {
            status: "trash"
          });
        } else if (action === "active" || action === "inactive") {
          return apiClient.put(`/dynamic-pricing/rules/${id}`, {
            status: action
          });
        }
        return Promise.resolve();
      });
      const results = await Promise.allSettled(requests);
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      return { succeeded, failed, total: results.length };
    },
    onSuccess: (result) => {
      invalidateRules();
      setSelectedIds([]);
      setBulkAction("");
      if (result.failed === 0) {
        showToast(__("Bulk action completed successfully"), "success");
      } else if (result.succeeded === 0) {
        showToast(__("Failed to complete bulk action"), "error");
      } else {
        showToast(
          `${result.succeeded}/${result.total} ${__("rules updated; some failed")}`,
          "warning"
        );
      }
    },
    onError: () => {
      showToast(__("Failed to complete bulk action"), "error");
    }
  });
  const handleBulkApply = () => {
    if (!bulkAction) {
      showToast(__("Select a bulk action first"), "warning");
      return;
    }
    if (selectedIds.length === 0) {
      showToast(__("Select at least one rule"), "warning");
      return;
    }
    bulkMutation.mutate({ action: bulkAction, ids: selectedIds });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        title: __("Dynamic Pricing"),
        description: __(
          "Intelligent price adjustments based on demand, seasonality, and booking patterns"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "-mb-px flex space-x-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setActiveTab("rules"),
            className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "rules" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "w-5 h-5 inline-block mr-2" }),
              __("Pricing Rules")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setActiveTab("analytics"),
            className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "analytics" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart, { className: "w-5 h-5 inline-block mr-2" }),
              __("Analytics")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setActiveTab("settings"),
            className: `py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "settings" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-5 h-5 inline-block mr-2" }),
              __("Settings")
            ]
          }
        )
      ] }),
      activeTab === "rules" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowRuleTypeModal(true), className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-2" }),
        __("Create Rule")
      ] })
    ] }) }),
    activeTab === "rules" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" })
      ] }) }) }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Total Rules") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.total_rules || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Active Rules") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: stats.active_rules || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-8 h-8 text-green-600 dark:text-green-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Inactive Rules") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-gray-600 dark:text-gray-400", children: stats.inactive_rules || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-8 h-8 text-gray-600 dark:text-gray-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Rule Types") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: stats.rule_types_used || 0 })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SearchFilterToolbar,
        {
          searchTerm,
          onSearchChange: setSearchTerm,
          statusFilter,
          onStatusChange: setStatusFilter,
          statusOptions: [
            { value: "all", label: __("All Status") },
            { value: "active", label: __("Active") },
            { value: "inactive", label: __("Inactive") },
            { value: "trash", label: __("Trash") }
          ],
          sortBy,
          onSortByChange: setSortBy,
          sortOrder,
          onSortOrderChange: setSortOrder,
          sortOptions: [
            { value: "name", label: __("Name") },
            { value: "priority", label: __("Priority") },
            { value: "created_at", label: __("Created Date") },
            { value: "updated_at", label: __("Updated Date") }
          ],
          onResetFilters: () => {
            setSearchTerm("");
            setStatusFilter("all");
            setSortBy("name");
            setSortOrder("asc");
          },
          hasFilters: !!searchTerm || statusFilter !== "all" || sortBy !== "name" || sortOrder !== "asc",
          placeholder: __("Search rules...")
        }
      ) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        BulkActionToolbar,
        {
          selectedIds,
          bulkAction,
          setBulkAction,
          onApply: handleBulkApply,
          onClearSelection: () => setSelectedIds([]),
          statusFilter,
          setStatusFilter,
          statusOptions: [
            {
              key: "all",
              label: __("All"),
              count: stats.total_rules ?? rules.filter((r) => r.status !== "trash").length
            },
            {
              key: "active",
              label: __("Active"),
              count: stats.active_rules || 0
            },
            {
              key: "inactive",
              label: __("Inactive"),
              count: stats.inactive_rules || 0
            },
            {
              key: "trash",
              label: __("Trash"),
              count: stats.trash_rules || 0
            }
          ],
          showColumnsDropdown,
          setShowColumnsDropdown,
          columnOptions: [
            { key: "name", label: __("Rule Name"), visible: true },
            { key: "adjustment", label: __("Adjustment"), visible: true },
            {
              key: "applicable_trips",
              label: __("Applicable To"),
              visible: true
            },
            { key: "priority", label: __("Priority"), visible: true },
            { key: "status", label: __("Status"), visible: true },
            { key: "created_at", label: __("Created"), visible: true }
          ],
          onToggleColumn: () => {
          },
          bulkMutationPending: bulkMutation.isPending,
          totalItems: filteredRules.length,
          bulkActionOptions: statusFilter === "trash" ? [
            { value: "restore", label: __("Restore") },
            { value: "delete", label: __("Delete Permanently") }
          ] : [
            { value: "active", label: __("Mark as Active") },
            { value: "inactive", label: __("Mark as Inactive") },
            { value: "trash", label: __("Move to Trash") }
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Pricing Rules") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Manage your dynamic pricing rules") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Table,
          {
            data: filteredRules,
            columns: [
              {
                key: "name",
                label: __("Rule Name"),
                sortable: true,
                visible: true,
                render: (rule) => {
                  var _a2;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "a",
                      {
                        href: `${window.location.href.split("&action=")[0]}&action=edit-pricing-rule&id=${rule.id}`,
                        className: `font-medium hover:underline transition-colors cursor-pointer ${rule.status === "trash" || statusFilter === "trash" ? "text-gray-400 dark:text-gray-600" : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"}`,
                        children: rule.name
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `text-sm ${rule.status === "trash" || statusFilter === "trash" ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`,
                        children: (_a2 = rule.rule_type) == null ? void 0 : _a2.replace("_", " ")
                      }
                    )
                  ] });
                }
              },
              {
                key: "adjustment",
                label: __("Adjustment"),
                visible: true,
                render: (rule) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: rule.adjustment_type === "percentage" ? `${rule.adjustment_value > 0 ? "+" : ""}${rule.adjustment_value}%` : formatYatraMoney(
                  Number(rule.adjustment_value) || 0,
                  globalCurrency,
                  { zeroAsUnknown: false }
                ) })
              },
              {
                key: "applicable_trips",
                label: __("Applicable To"),
                visible: true,
                render: (rule) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: rule.applicable_trips === "all" ? __("All Trips") : __("Specific Trips") })
              },
              {
                key: "priority",
                label: __("Priority"),
                sortable: true,
                visible: true,
                render: (rule) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: rule.priority })
              },
              {
                key: "status",
                label: __("Status"),
                sortable: true,
                visible: true,
                render: (rule) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: rule.status === "active" ? "success" : "outline",
                    children: rule.status
                  }
                )
              },
              {
                key: "created_at",
                label: __("Created"),
                sortable: true,
                visible: true,
                render: (rule) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500 dark:text-gray-400", children: new Date(rule.created_at).toLocaleDateString() })
              }
            ],
            actions: [
              {
                key: "edit",
                label: __("Edit"),
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(PenSquare, { className: "w-4 h-4" }),
                onClick: (rule) => {
                  const baseUrl = window.location.href.split("&action=")[0];
                  window.location.href = `${baseUrl}&action=edit-pricing-rule&id=${rule.id}`;
                }
              },
              {
                key: "active",
                label: __("Mark as Active"),
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" }),
                onClick: (rule) => {
                  setConfirmDialog({
                    isOpen: true,
                    rule,
                    title: __("Mark as Active"),
                    message: __(
                      "Are you sure you want to mark this pricing rule as active? It will start applying to trip pricing."
                    ),
                    onConfirm: async () => {
                      try {
                        await apiClient.put(
                          `/dynamic-pricing/rules/${rule.id}`,
                          {
                            status: "active"
                          }
                        );
                        showToast(
                          __("Pricing rule marked as active successfully"),
                          "success"
                        );
                        queryClient.invalidateQueries({
                          queryKey: ["dynamic-pricing-rules"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["dynamic-pricing-statistics"]
                        });
                        setConfirmDialog({
                          isOpen: false,
                          rule: null,
                          title: "",
                          message: "",
                          onConfirm: () => {
                          }
                        });
                      } catch (error) {
                        showToast(
                          __("Failed to update pricing rule status"),
                          "error"
                        );
                      }
                    }
                  });
                },
                condition: (rule) => rule.status !== "active" && rule.status !== "trash"
              },
              {
                key: "inactive",
                label: __("Mark as Inactive"),
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                onClick: (rule) => {
                  setConfirmDialog({
                    isOpen: true,
                    rule,
                    title: __("Mark as Inactive"),
                    message: __(
                      "Are you sure you want to mark this pricing rule as inactive? It will no longer apply to trip pricing."
                    ),
                    onConfirm: async () => {
                      try {
                        await apiClient.put(
                          `/dynamic-pricing/rules/${rule.id}`,
                          {
                            status: "inactive"
                          }
                        );
                        showToast(
                          __(
                            "Pricing rule marked as inactive successfully"
                          ),
                          "success"
                        );
                        queryClient.invalidateQueries({
                          queryKey: ["dynamic-pricing-rules"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["dynamic-pricing-statistics"]
                        });
                        setConfirmDialog({
                          isOpen: false,
                          rule: null,
                          title: "",
                          message: "",
                          onConfirm: () => {
                          }
                        });
                      } catch (error) {
                        showToast(
                          __("Failed to update pricing rule status"),
                          "error"
                        );
                      }
                    }
                  });
                },
                condition: (rule) => rule.status === "active"
              },
              {
                key: "restore",
                label: __("Restore"),
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" }),
                onClick: (rule) => {
                  setConfirmDialog({
                    isOpen: true,
                    rule,
                    title: __("Restore Rule"),
                    message: __(
                      "Are you sure you want to restore this pricing rule? It will be moved back to active status."
                    ),
                    onConfirm: async () => {
                      try {
                        await apiClient.put(
                          `/dynamic-pricing/rules/${rule.id}`,
                          {
                            status: "active"
                          }
                        );
                        showToast(
                          __("Pricing rule restored successfully"),
                          "success"
                        );
                        queryClient.invalidateQueries({
                          queryKey: ["dynamic-pricing-rules"]
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["dynamic-pricing-statistics"]
                        });
                        setConfirmDialog({
                          isOpen: false,
                          rule: null,
                          title: "",
                          message: "",
                          onConfirm: () => {
                          }
                        });
                      } catch (error) {
                        showToast(
                          __("Failed to restore pricing rule"),
                          "error"
                        );
                      }
                    }
                  });
                },
                condition: (rule) => rule.status === "trash" || statusFilter === "trash"
              },
              {
                key: "trash",
                label: __("Move to Trash"),
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                onClick: (rule) => {
                  setConfirmDialog({
                    isOpen: true,
                    rule,
                    title: __("Move Rule to Trash"),
                    message: __(
                      "Are you sure you want to move this pricing rule to Trash? It will stop applying to trip pricing immediately. You can restore it from the Trash filter."
                    ),
                    confirmText: __("Move to Trash"),
                    variant: "warning",
                    onConfirm: async () => {
                      setConfirmDialog((prev) => ({
                        ...prev,
                        isLoading: true
                      }));
                      try {
                        await apiClient.put(
                          `/dynamic-pricing/rules/${rule.id}`,
                          { status: "trash" }
                        );
                        showToast(
                          __("Pricing rule moved to Trash"),
                          "success"
                        );
                        invalidateRules();
                        closeConfirmDialog();
                      } catch (error) {
                        setConfirmDialog((prev) => ({
                          ...prev,
                          isLoading: false
                        }));
                        showToast(
                          __("Failed to move rule to Trash"),
                          "error"
                        );
                      }
                    }
                  });
                },
                condition: (rule) => rule.status !== "trash" && statusFilter !== "trash"
              },
              {
                key: "delete",
                label: __("Delete Permanently"),
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                onClick: (rule) => {
                  setConfirmDialog({
                    isOpen: true,
                    rule,
                    title: __("Delete Pricing Rule Permanently"),
                    message: __(
                      "This will permanently delete the pricing rule. This action cannot be undone. Continue?"
                    ),
                    confirmText: __("Delete Permanently"),
                    variant: "danger",
                    onConfirm: async () => {
                      setConfirmDialog((prev) => ({
                        ...prev,
                        isLoading: true
                      }));
                      try {
                        await apiClient.delete(
                          `/dynamic-pricing/rules/${rule.id}`
                        );
                        showToast(
                          __("Pricing rule deleted permanently"),
                          "success"
                        );
                        invalidateRules();
                        closeConfirmDialog();
                      } catch (error) {
                        setConfirmDialog((prev) => ({
                          ...prev,
                          isLoading: false
                        }));
                        showToast(
                          __("Failed to delete rule"),
                          "error"
                        );
                      }
                    }
                  });
                },
                condition: (rule) => rule.status === "trash" || statusFilter === "trash",
                variant: "destructive"
              }
            ],
            selectedItemIds: selectedIds,
            onSelectItem: (id, checked) => {
              if (checked) {
                setSelectedIds([...selectedIds, id]);
              } else {
                setSelectedIds(
                  selectedIds.filter((selectedId) => selectedId !== id)
                );
              }
            },
            onSelectAll: (checked) => {
              if (checked) {
                setSelectedIds(filteredRules.map((rule) => rule.id));
              } else {
                setSelectedIds([]);
              }
            },
            isAllSelected: selectedIds.length === filteredRules.length && filteredRules.length > 0,
            getItemId: (rule) => rule.id,
            isLoading,
            emptyText: __("No pricing rules found"),
            emptyDescription: __(
              'Click "Create Rule" button above to get started'
            )
          }
        ) })
      ] })
    ] }),
    activeTab === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      analyticsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" })
      ] }) }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Total Rules") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: stats.total_rules || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("All pricing rules") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Active Rules") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: stats.active_rules || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-600 dark:text-green-400 mt-1", children: __("Currently active") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-8 h-8 text-green-600 dark:text-green-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Inactive Rules") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-orange-600 dark:text-orange-400", children: stats.inactive_rules || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-orange-600 dark:text-orange-400 mt-1", children: __("Paused rules") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-8 h-8 text-orange-600 dark:text-orange-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Rule Types Used") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: stats.rule_types_used || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-purple-600 dark:text-purple-400 mt-1", children: __("Different types") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" })
        ] }) }) })
      ] }),
      analyticsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2 animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" })
      ] }) }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Pricing Events") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-blue-600 dark:text-blue-400", children: stats.pricing_history_total || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Recorded price adjustments") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart, { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Trips Affected") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-orange-600 dark:text-orange-400", children: stats.pricing_history_trips_affected || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Unique trips with adjustments") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-8 h-8 text-orange-600 dark:text-orange-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Avg Adjustment") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-purple-600 dark:text-purple-400", children: typeof stats.pricing_history_avg_adjustment_percentage === "number" ? `${stats.pricing_history_avg_adjustment_percentage.toFixed(2)}%` : "0%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Average % change") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-8 h-8 text-purple-600 dark:text-purple-400" })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: __("Last 30 Days") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-green-600 dark:text-green-400", children: stats.pricing_history_last_30_days || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Recent pricing events") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-8 h-8 text-green-600 dark:text-green-400" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Rule Performance") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("How each pricing rule is performing") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: analyticsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" })
            ]
          },
          i
        )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: ruleImpact.length > 0 ? ruleImpact.map((ri) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: ri.name || `${__("Rule")} #${ri.rule_id}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "default",
                      className: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
                      children: (ri.rule_type || "").replace("_", " ")
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: ri.adjustment_type || "" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    __("Events"),
                    ": ",
                    ri.events || 0
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    __("Avg Adjustment"),
                    ":",
                    " ",
                    typeof ri.avg_adjustment_value === "number" ? ri.avg_adjustment_value.toFixed(2) : Number(ri.avg_adjustment_value || 0).toFixed(
                      2
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: __("Impact (30d)") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatCurrencyAmount(
                  Number(ri.total_adjustment_amount) || 0
                ) })
              ] })
            ]
          },
          ri.rule_id
        )) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-8 text-gray-500 dark:text-gray-400", children: rules.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __(
            "No rule-level impact recorded in the last 30 days"
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2 max-w-lg mx-auto", children: __(
            "Charts use dynamic pricing history when a booking applies an adjusted price. Complete a checkout (or recalculate pricing) after rules are active to populate metrics."
          ) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: __("No pricing rules created yet") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm mt-2", children: __(
            "Create your first rule to see performance metrics"
          ) })
        ] }) }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Revenue Impact Trend") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __(
            "30-day revenue comparison with and without dynamic pricing"
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          !analyticsLoading && statsErrorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 text-sm text-red-600 dark:text-red-400", children: [
            __("Failed to load statistics:"),
            " ",
            statsErrorMessage
          ] }) : null,
          analyticsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }) : trendData.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full", style: { height: 280 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              LineChart,
              {
                data: trendData,
                margin: { top: 10, right: 20, left: 0, bottom: 0 },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    XAxis,
                    {
                      dataKey: "day",
                      tick: { fontSize: 12 },
                      tickFormatter: (v) => v ? new Date(String(v)).toLocaleDateString() : ""
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    YAxis,
                    {
                      tick: { fontSize: 12 },
                      tickFormatter: (v) => formatCurrencyAmount(Number(v) || 0)
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tooltip,
                    {
                      formatter: (value, name) => {
                        if (name === "totalAdjustmentAmount") {
                          return [
                            formatCurrencyAmount(Number(value) || 0),
                            __("Revenue Impact")
                          ];
                        }
                        if (name === "events") {
                          return [Number(value) || 0, __("Events")];
                        }
                        if (name === "avgAdjustmentPercentage") {
                          return [
                            `${Number(value || 0).toFixed(2)}%`,
                            __("Avg Adjustment")
                          ];
                        }
                        return [value, name];
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Line,
                    {
                      type: "monotone",
                      dataKey: "totalAdjustmentAmount",
                      stroke: "#22c55e",
                      strokeWidth: 2,
                      dot: { r: 2 },
                      activeDot: { r: 4 }
                    }
                  )
                ]
              }
            ) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[420px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full table-fixed border-collapse text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-white dark:bg-gray-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 px-4 w-1/4", children: __("Date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 px-4 w-1/6 text-right", children: __("Events") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 px-4 w-1/3 text-right", children: __("Revenue Impact") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 px-4 w-1/4 text-right", children: __("Avg Adjustment") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: trendData.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  className: "border-b border-gray-100 dark:border-gray-800",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4 text-gray-900 dark:text-white", children: row.day ? new Date(
                      String(row.day)
                    ).toLocaleDateString() : "" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4 text-right text-gray-900 dark:text-white", children: row.events ?? 0 }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4 text-right text-gray-900 dark:text-white tabular-nums", children: formatCurrencyAmount(
                      Number(row.totalAdjustmentAmount) || 0
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4 text-right text-gray-900 dark:text-white tabular-nums", children: `${Number(row.avgAdjustmentPercentage || 0).toFixed(2)}%` })
                  ]
                },
                row.day
              )) })
            ] }) }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-40 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center px-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 dark:text-gray-400", children: Number(stats.pricing_history_total) > 0 && Number(stats.pricing_history_last_30_days) === 0 ? __(
              "No pricing events in the last 30 days (older history exists)."
            ) : __("No pricing history in the last 30 days") }),
            rules.length > 0 && Number(stats.pricing_history_total) === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto", children: __(
              "Revenue impact is recorded when a booking uses a trip price adjusted by your rules. Place a test booking to see this chart fill in."
            ) }) : null
          ] }) })
        ] })
      ] })
    ] }),
    activeTab === "settings" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("General Settings") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Configure global dynamic pricing behavior") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Rule calculation base") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: settings.calculation_base || "discounted",
                onChange: (e) => handleSettingChange(
                  "calculation_base",
                  e.target.value === "regular" ? "regular" : "discounted"
                ),
                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "discounted", children: __(
                    "Promotional / sale price (stack dynamic pricing on the price customers already see after trip discounts)"
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "regular", children: __(
                    "Regular list price (compute adjustments from catalog price; requires original price in context)"
                  ) })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
              "Choose whether percentage and fixed rules use the discounted trip price or the regular list price as their starting point. Bookings and availability pass both values when possible."
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Rule Priority Mode") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: settings.rule_priority_mode,
                onChange: (e) => handleSettingChange(
                  "rule_priority_mode",
                  e.target.value
                ),
                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "highest", children: __(
                    "Apply Largest Adjustment Only (one rule wins by magnitude)"
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cumulative", children: __("Apply All Matching Rules (Cumulative / Stack)") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "best", children: __("Apply Best Price for Customer (Lowest Final)") })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
              "How to combine matching rules. Caps below still apply afterwards. Per-rule numeric Priority is used as a tie-breaker when multiple rules tie for largest / best."
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Maximum Price Increase (%)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: settings.maximum_markup_percent,
                onChange: (e) => handleSettingChange(
                  "maximum_markup_percent",
                  parseInt(e.target.value)
                ),
                min: "0",
                max: "100",
                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
              "Hard cap on upward adjustments (markup) across all matched rules to avoid surprising customers with sudden surges."
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Maximum Price Decrease (%)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: settings.maximum_discount_percent,
                onChange: (e) => handleSettingChange(
                  "maximum_discount_percent",
                  parseInt(e.target.value)
                ),
                min: "0",
                max: "100",
                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __(
              "Hard cap on downward adjustments (discount) so dynamic pricing can never push a trip below this fraction of its base price."
            ) })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Demand Calculation") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("Configure how booking demand is calculated") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: [1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Calculation Period (Days)") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: settings.calculation_period,
                onChange: (e) => handleSettingChange(
                  "calculation_period",
                  parseInt(e.target.value)
                ),
                min: "1",
                max: "30",
                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("Number of days to analyze for demand trends") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: __("Update Frequency") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: settings.update_frequency,
                onChange: (e) => handleSettingChange("update_frequency", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hourly", children: __("Every Hour") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "daily", children: __("Once Daily") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "realtime", children: __("Real-time (On Each Booking)") })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: __("How often to recalculate demand scores") })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: __("Display Settings") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: __("How dynamic pricing is shown to customers") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: [1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" })
        ] }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: __("Show Original Price") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __(
                "Display crossed-out original price when discount applied"
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Toggle,
              {
                checked: settings.show_original_price,
                onChange: (checked) => handleSettingChange("show_original_price", checked)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: __("Show Savings Badge") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __('Display "Save X%" badge on discounted trips') })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Toggle,
              {
                checked: settings.show_savings_badge,
                onChange: (checked) => handleSettingChange("show_savings_badge", checked)
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-gray-900 dark:text-white", children: __("Show Urgency Messages") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: __(
                'Display messages like "Price increases soon" for demand-based rules'
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Toggle,
              {
                checked: settings.show_urgency_messages,
                onChange: (checked) => handleSettingChange("show_urgency_messages", checked)
              }
            )
          ] })
        ] }) })
      ] }),
      !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleSaveSettings,
          disabled: isSaving,
          className: "px-6",
          children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2 animate-spin" }),
            __("Saving...")
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-2" }),
            __("Save Settings")
          ] })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RuleTypeSelectionModal,
      {
        isOpen: showRuleTypeModal,
        onClose: () => setShowRuleTypeModal(false),
        onSelectType: handleSelectRuleType
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmationDialog,
      {
        isOpen: confirmDialog.isOpen,
        onClose: closeConfirmDialog,
        onConfirm: () => {
          var _a2;
          return (_a2 = confirmDialog.onConfirm) == null ? void 0 : _a2.call(confirmDialog);
        },
        title: confirmDialog.title || "",
        message: confirmDialog.message || "",
        confirmText: confirmDialog.confirmText,
        variant: confirmDialog.variant ?? "danger",
        isLoading: confirmDialog.isLoading ?? false
      }
    )
  ] });
};
export {
  DynamicPricingPage as default
};
//# sourceMappingURL=DynamicPricing-CzwLxmBD.js.map
