import { I as getDefaultExportFromCjs, r as reactExports, j as jsxRuntimeExports, as as X, al as Info, at as AlertTriangle, aK as AlertCircle, a$ as CheckCircle2 } from "./react-vendor-CGraIJLZ.js";
function memize(fn, options) {
  var size = 0;
  var head;
  var tail;
  options = options || {};
  function memoized() {
    var node = head, len = arguments.length, args, i;
    searchCache: while (node) {
      if (node.args.length !== arguments.length) {
        node = node.next;
        continue;
      }
      for (i = 0; i < len; i++) {
        if (node.args[i] !== arguments[i]) {
          node = node.next;
          continue searchCache;
        }
      }
      if (node !== head) {
        if (node === tail) {
          tail = node.prev;
        }
        node.prev.next = node.next;
        if (node.next) {
          node.next.prev = node.prev;
        }
        node.next = head;
        node.prev = null;
        head.prev = node;
        head = node;
      }
      return node.val;
    }
    args = new Array(len);
    for (i = 0; i < len; i++) {
      args[i] = arguments[i];
    }
    node = {
      args,
      // Generate the result from original function
      val: fn.apply(null, args)
    };
    if (head) {
      head.prev = node;
      node.next = head;
    } else {
      tail = node;
    }
    if (size === /** @type {MemizeOptions} */
    options.maxSize) {
      tail = /** @type {MemizeCacheNode} */
      tail.prev;
      tail.next = null;
    } else {
      size++;
    }
    head = node;
    return node.val;
  }
  memoized.clear = function() {
    head = null;
    tail = null;
    size = 0;
  };
  return memoized;
}
var sprintf$2 = {};
(function(exports$1) {
  !function() {
    var re = {
      not_type: /[^T]/,
      not_primitive: /[^v]/,
      number: /[diefg]/,
      numeric_arg: /[bcdiefguxX]/,
      json: /[j]/,
      text: /^[^\x25]+/,
      modulo: /^\x25{2}/,
      placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
      key: /^([a-z_][a-z_\d]*)/i,
      key_access: /^\.([a-z_][a-z_\d]*)/i,
      index_access: /^\[(\d+)\]/,
      sign: /^[+-]/
    };
    function sprintf2(key) {
      return sprintf_format(sprintf_parse(key), arguments);
    }
    function vsprintf(fmt, argv) {
      return sprintf2.apply(null, [fmt].concat(argv || []));
    }
    function sprintf_format(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, arg, output = "", i, k, ph, pad, pad_character, pad_length, is_positive, sign;
      for (i = 0; i < tree_length; i++) {
        if (typeof parse_tree[i] === "string") {
          output += parse_tree[i];
        } else if (typeof parse_tree[i] === "object") {
          ph = parse_tree[i];
          if (ph.keys) {
            arg = argv[cursor];
            for (k = 0; k < ph.keys.length; k++) {
              if (arg == void 0) {
                throw new Error(sprintf2('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k - 1]));
              }
              arg = arg[ph.keys[k]];
            }
          } else if (ph.param_no) {
            arg = argv[ph.param_no];
          } else {
            arg = argv[cursor++];
          }
          if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
            arg = arg();
          }
          if (re.numeric_arg.test(ph.type) && (typeof arg !== "number" && isNaN(arg))) {
            throw new TypeError(sprintf2("[sprintf] expecting number but found %T", arg));
          }
          if (re.number.test(ph.type)) {
            is_positive = arg >= 0;
          }
          switch (ph.type) {
            case "b":
              arg = parseInt(arg, 10).toString(2);
              break;
            case "c":
              arg = String.fromCharCode(parseInt(arg, 10));
              break;
            case "d":
            case "i":
              arg = parseInt(arg, 10);
              break;
            case "j":
              arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0);
              break;
            case "e":
              arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential();
              break;
            case "f":
              arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg);
              break;
            case "g":
              arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg);
              break;
            case "o":
              arg = (parseInt(arg, 10) >>> 0).toString(8);
              break;
            case "s":
              arg = String(arg);
              arg = ph.precision ? arg.substring(0, ph.precision) : arg;
              break;
            case "t":
              arg = String(!!arg);
              arg = ph.precision ? arg.substring(0, ph.precision) : arg;
              break;
            case "T":
              arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
              arg = ph.precision ? arg.substring(0, ph.precision) : arg;
              break;
            case "u":
              arg = parseInt(arg, 10) >>> 0;
              break;
            case "v":
              arg = arg.valueOf();
              arg = ph.precision ? arg.substring(0, ph.precision) : arg;
              break;
            case "x":
              arg = (parseInt(arg, 10) >>> 0).toString(16);
              break;
            case "X":
              arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase();
              break;
          }
          if (re.json.test(ph.type)) {
            output += arg;
          } else {
            if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
              sign = is_positive ? "+" : "-";
              arg = arg.toString().replace(re.sign, "");
            } else {
              sign = "";
            }
            pad_character = ph.pad_char ? ph.pad_char === "0" ? "0" : ph.pad_char.charAt(1) : " ";
            pad_length = ph.width - (sign + arg).length;
            pad = ph.width ? pad_length > 0 ? pad_character.repeat(pad_length) : "" : "";
            output += ph.align ? sign + arg + pad : pad_character === "0" ? sign + pad + arg : pad + sign + arg;
          }
        }
      }
      return output;
    }
    var sprintf_cache = /* @__PURE__ */ Object.create(null);
    function sprintf_parse(fmt) {
      if (sprintf_cache[fmt]) {
        return sprintf_cache[fmt];
      }
      var _fmt = fmt, match, parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = re.text.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        } else if ((match = re.modulo.exec(_fmt)) !== null) {
          parse_tree.push("%");
        } else if ((match = re.placeholder.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = re.key.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                } else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                } else {
                  throw new SyntaxError("[sprintf] failed to parse named argument key");
                }
              }
            } else {
              throw new SyntaxError("[sprintf] failed to parse named argument key");
            }
            match[2] = field_list;
          } else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");
          }
          parse_tree.push(
            {
              placeholder: match[0],
              param_no: match[1],
              keys: match[2],
              sign: match[3],
              pad_char: match[4],
              align: match[5],
              width: match[6],
              precision: match[7],
              type: match[8]
            }
          );
        } else {
          throw new SyntaxError("[sprintf] unexpected placeholder");
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return sprintf_cache[fmt] = parse_tree;
    }
    {
      exports$1["sprintf"] = sprintf2;
      exports$1["vsprintf"] = vsprintf;
    }
    if (typeof window !== "undefined") {
      window["sprintf"] = sprintf2;
      window["vsprintf"] = vsprintf;
    }
  }();
})(sprintf$2);
const sprintfjs = /* @__PURE__ */ getDefaultExportFromCjs(sprintf$2);
const logErrorOnce = memize(console.error);
function sprintf$1(format, ...args) {
  try {
    return sprintfjs.sprintf(format, ...args);
  } catch (error) {
    if (error instanceof Error) {
      logErrorOnce("sprintf error: \n\n" + error.toString());
    }
    return format;
  }
}
var PRECEDENCE, OPENERS, TERMINATORS, PATTERN;
PRECEDENCE = {
  "(": 9,
  "!": 8,
  "*": 7,
  "/": 7,
  "%": 7,
  "+": 6,
  "-": 6,
  "<": 5,
  "<=": 5,
  ">": 5,
  ">=": 5,
  "==": 4,
  "!=": 4,
  "&&": 3,
  "||": 2,
  "?": 1,
  "?:": 1
};
OPENERS = ["(", "?"];
TERMINATORS = {
  ")": ["("],
  ":": ["?", "?:"]
};
PATTERN = /<=|>=|==|!=|&&|\|\||\?:|\(|!|\*|\/|%|\+|-|<|>|\?|\)|:/;
function postfix(expression) {
  var terms = [], stack = [], match, operator, term, element;
  while (match = expression.match(PATTERN)) {
    operator = match[0];
    term = expression.substr(0, match.index).trim();
    if (term) {
      terms.push(term);
    }
    while (element = stack.pop()) {
      if (TERMINATORS[operator]) {
        if (TERMINATORS[operator][0] === element) {
          operator = TERMINATORS[operator][1] || operator;
          break;
        }
      } else if (OPENERS.indexOf(element) >= 0 || PRECEDENCE[element] < PRECEDENCE[operator]) {
        stack.push(element);
        break;
      }
      terms.push(element);
    }
    if (!TERMINATORS[operator]) {
      stack.push(operator);
    }
    expression = expression.substr(match.index + operator.length);
  }
  expression = expression.trim();
  if (expression) {
    terms.push(expression);
  }
  return terms.concat(stack.reverse());
}
var OPERATORS = {
  "!": function(a) {
    return !a;
  },
  "*": function(a, b) {
    return a * b;
  },
  "/": function(a, b) {
    return a / b;
  },
  "%": function(a, b) {
    return a % b;
  },
  "+": function(a, b) {
    return a + b;
  },
  "-": function(a, b) {
    return a - b;
  },
  "<": function(a, b) {
    return a < b;
  },
  "<=": function(a, b) {
    return a <= b;
  },
  ">": function(a, b) {
    return a > b;
  },
  ">=": function(a, b) {
    return a >= b;
  },
  "==": function(a, b) {
    return a === b;
  },
  "!=": function(a, b) {
    return a !== b;
  },
  "&&": function(a, b) {
    return a && b;
  },
  "||": function(a, b) {
    return a || b;
  },
  "?:": function(a, b, c) {
    if (a) {
      throw b;
    }
    return c;
  }
};
function evaluate(postfix2, variables) {
  var stack = [], i, j, args, getOperatorResult, term, value;
  for (i = 0; i < postfix2.length; i++) {
    term = postfix2[i];
    getOperatorResult = OPERATORS[term];
    if (getOperatorResult) {
      j = getOperatorResult.length;
      args = Array(j);
      while (j--) {
        args[j] = stack.pop();
      }
      try {
        value = getOperatorResult.apply(null, args);
      } catch (earlyReturn) {
        return earlyReturn;
      }
    } else if (variables.hasOwnProperty(term)) {
      value = variables[term];
    } else {
      value = +term;
    }
    stack.push(value);
  }
  return stack[0];
}
function compile(expression) {
  var terms = postfix(expression);
  return function(variables) {
    return evaluate(terms, variables);
  };
}
function pluralForms(expression) {
  var evaluate2 = compile(expression);
  return function(n) {
    return +evaluate2({ n });
  };
}
var DEFAULT_OPTIONS = {
  contextDelimiter: "",
  onMissingKey: null
};
function getPluralExpression(pf) {
  var parts, i, part;
  parts = pf.split(";");
  for (i = 0; i < parts.length; i++) {
    part = parts[i].trim();
    if (part.indexOf("plural=") === 0) {
      return part.substr(7);
    }
  }
}
function Tannin(data, options) {
  var key;
  this.data = data;
  this.pluralForms = {};
  this.options = {};
  for (key in DEFAULT_OPTIONS) {
    this.options[key] = options !== void 0 && key in options ? options[key] : DEFAULT_OPTIONS[key];
  }
}
Tannin.prototype.getPluralForm = function(domain, n) {
  var getPluralForm = this.pluralForms[domain], config, plural, pf;
  if (!getPluralForm) {
    config = this.data[domain][""];
    pf = config["Plural-Forms"] || config["plural-forms"] || // Ignore reason: As known, there's no way to document the empty
    // string property on a key to guarantee this as metadata.
    // @ts-ignore
    config.plural_forms;
    if (typeof pf !== "function") {
      plural = getPluralExpression(
        config["Plural-Forms"] || config["plural-forms"] || // Ignore reason: As known, there's no way to document the empty
        // string property on a key to guarantee this as metadata.
        // @ts-ignore
        config.plural_forms
      );
      pf = pluralForms(plural);
    }
    getPluralForm = this.pluralForms[domain] = pf;
  }
  return getPluralForm(n);
};
Tannin.prototype.dcnpgettext = function(domain, context, singular, plural, n) {
  var index, key, entry;
  if (n === void 0) {
    index = 0;
  } else {
    index = this.getPluralForm(domain, n);
  }
  key = singular;
  if (context) {
    key = context + this.options.contextDelimiter + singular;
  }
  entry = this.data[domain][key];
  if (entry && entry[index]) {
    return entry[index];
  }
  if (this.options.onMissingKey) {
    this.options.onMissingKey(singular, domain);
  }
  return index === 0 ? singular : plural;
};
const DEFAULT_LOCALE_DATA = {
  "": {
    /** @param {number} n */
    plural_forms(n) {
      return n === 1 ? 0 : 1;
    }
  }
};
const I18N_HOOK_REGEXP = /^i18n\.(n?gettext|has_translation)(_|$)/;
const createI18n = (initialData, initialDomain, hooks) => {
  const tannin = new Tannin({});
  const listeners = /* @__PURE__ */ new Set();
  const notifyListeners = () => {
    listeners.forEach((listener) => listener());
  };
  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };
  const getLocaleData = (domain = "default") => tannin.data[domain];
  const doSetLocaleData = (data, domain = "default") => {
    var _a;
    tannin.data[domain] = {
      ...tannin.data[domain],
      ...data
    };
    tannin.data[domain][""] = {
      ...DEFAULT_LOCALE_DATA[""],
      ...(_a = tannin.data[domain]) == null ? void 0 : _a[""]
    };
    delete tannin.pluralForms[domain];
  };
  const setLocaleData = (data, domain) => {
    doSetLocaleData(data, domain);
    notifyListeners();
  };
  const addLocaleData = (data, domain = "default") => {
    var _a;
    tannin.data[domain] = {
      ...tannin.data[domain],
      ...data,
      // Populate default domain configuration (supported locale date which omits
      // a plural forms expression).
      "": {
        ...DEFAULT_LOCALE_DATA[""],
        ...(_a = tannin.data[domain]) == null ? void 0 : _a[""],
        ...data == null ? void 0 : data[""]
      }
    };
    delete tannin.pluralForms[domain];
    notifyListeners();
  };
  const resetLocaleData = (data, domain) => {
    tannin.data = {};
    tannin.pluralForms = {};
    setLocaleData(data, domain);
  };
  const dcnpgettext = (domain = "default", context, single, plural, number) => {
    if (!tannin.data[domain]) {
      doSetLocaleData(void 0, domain);
    }
    return tannin.dcnpgettext(domain, context, single, plural, number);
  };
  const getFilterDomain = (domain = "default") => domain;
  const __2 = (text, domain) => {
    let translation = dcnpgettext(domain, void 0, text);
    if (!hooks) {
      return translation;
    }
    translation = /** @type {string} */
    /** @type {*} */
    hooks.applyFilters("i18n.gettext", translation, text, domain);
    return (
      /** @type {string} */
      /** @type {*} */
      hooks.applyFilters("i18n.gettext_" + getFilterDomain(domain), translation, text, domain)
    );
  };
  const _x = (text, context, domain) => {
    let translation = dcnpgettext(domain, context, text);
    if (!hooks) {
      return translation;
    }
    translation = /** @type {string} */
    /** @type {*} */
    hooks.applyFilters("i18n.gettext_with_context", translation, text, context, domain);
    return (
      /** @type {string} */
      /** @type {*} */
      hooks.applyFilters("i18n.gettext_with_context_" + getFilterDomain(domain), translation, text, context, domain)
    );
  };
  const _n = (single, plural, number, domain) => {
    let translation = dcnpgettext(domain, void 0, single, plural, number);
    if (!hooks) {
      return translation;
    }
    translation = /** @type {string} */
    /** @type {*} */
    hooks.applyFilters("i18n.ngettext", translation, single, plural, number, domain);
    return (
      /** @type {string} */
      /** @type {*} */
      hooks.applyFilters("i18n.ngettext_" + getFilterDomain(domain), translation, single, plural, number, domain)
    );
  };
  const _nx = (single, plural, number, context, domain) => {
    let translation = dcnpgettext(domain, context, single, plural, number);
    if (!hooks) {
      return translation;
    }
    translation = /** @type {string} */
    /** @type {*} */
    hooks.applyFilters("i18n.ngettext_with_context", translation, single, plural, number, context, domain);
    return (
      /** @type {string} */
      /** @type {*} */
      hooks.applyFilters("i18n.ngettext_with_context_" + getFilterDomain(domain), translation, single, plural, number, context, domain)
    );
  };
  const isRTL = () => {
    return "rtl" === _x("ltr", "text direction");
  };
  const hasTranslation = (single, context, domain) => {
    var _a, _b;
    const key = context ? context + "" + single : single;
    let result = !!((_b = (_a = tannin.data) == null ? void 0 : _a[domain !== null && domain !== void 0 ? domain : "default"]) == null ? void 0 : _b[key]);
    if (hooks) {
      result = /** @type { boolean } */
      /** @type {*} */
      hooks.applyFilters("i18n.has_translation", result, single, context, domain);
      result = /** @type { boolean } */
      /** @type {*} */
      hooks.applyFilters("i18n.has_translation_" + getFilterDomain(domain), result, single, context, domain);
    }
    return result;
  };
  if (hooks) {
    const onHookAddedOrRemoved = (hookName) => {
      if (I18N_HOOK_REGEXP.test(hookName)) {
        notifyListeners();
      }
    };
    hooks.addAction("hookAdded", "core/i18n", onHookAddedOrRemoved);
    hooks.addAction("hookRemoved", "core/i18n", onHookAddedOrRemoved);
  }
  return {
    getLocaleData,
    setLocaleData,
    addLocaleData,
    resetLocaleData,
    subscribe,
    __: __2,
    _x,
    _n,
    _nx,
    isRTL,
    hasTranslation
  };
};
function validateNamespace(namespace) {
  if ("string" !== typeof namespace || "" === namespace) {
    console.error("The namespace must be a non-empty string.");
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.\-\/]*$/.test(namespace)) {
    console.error("The namespace can only contain numbers, letters, dashes, periods, underscores and slashes.");
    return false;
  }
  return true;
}
function validateHookName(hookName) {
  if ("string" !== typeof hookName || "" === hookName) {
    console.error("The hook name must be a non-empty string.");
    return false;
  }
  if (/^__/.test(hookName)) {
    console.error("The hook name cannot begin with `__`.");
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(hookName)) {
    console.error("The hook name can only contain numbers, letters, dashes, periods and underscores.");
    return false;
  }
  return true;
}
function createAddHook(hooks, storeKey) {
  return function addHook(hookName, namespace, callback, priority = 10) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    if (!validateNamespace(namespace)) {
      return;
    }
    if ("function" !== typeof callback) {
      console.error("The hook callback must be a function.");
      return;
    }
    if ("number" !== typeof priority) {
      console.error("If specified, the hook priority must be a number.");
      return;
    }
    const handler = {
      callback,
      priority,
      namespace
    };
    if (hooksStore[hookName]) {
      const handlers = hooksStore[hookName].handlers;
      let i;
      for (i = handlers.length; i > 0; i--) {
        if (priority >= handlers[i - 1].priority) {
          break;
        }
      }
      if (i === handlers.length) {
        handlers[i] = handler;
      } else {
        handlers.splice(i, 0, handler);
      }
      hooksStore.__current.forEach((hookInfo) => {
        if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
          hookInfo.currentIndex++;
        }
      });
    } else {
      hooksStore[hookName] = {
        handlers: [handler],
        runs: 0
      };
    }
    if (hookName !== "hookAdded") {
      hooks.doAction("hookAdded", hookName, namespace, callback, priority);
    }
  };
}
function createRemoveHook(hooks, storeKey, removeAll = false) {
  return function removeHook(hookName, namespace) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    if (!removeAll && !validateNamespace(namespace)) {
      return;
    }
    if (!hooksStore[hookName]) {
      return 0;
    }
    let handlersRemoved = 0;
    if (removeAll) {
      handlersRemoved = hooksStore[hookName].handlers.length;
      hooksStore[hookName] = {
        runs: hooksStore[hookName].runs,
        handlers: []
      };
    } else {
      const handlers = hooksStore[hookName].handlers;
      for (let i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i].namespace === namespace) {
          handlers.splice(i, 1);
          handlersRemoved++;
          hooksStore.__current.forEach((hookInfo) => {
            if (hookInfo.name === hookName && hookInfo.currentIndex >= i) {
              hookInfo.currentIndex--;
            }
          });
        }
      }
    }
    if (hookName !== "hookRemoved") {
      hooks.doAction("hookRemoved", hookName, namespace);
    }
    return handlersRemoved;
  };
}
function createHasHook(hooks, storeKey) {
  return function hasHook(hookName, namespace) {
    const hooksStore = hooks[storeKey];
    if ("undefined" !== typeof namespace) {
      return hookName in hooksStore && hooksStore[hookName].handlers.some((hook) => hook.namespace === namespace);
    }
    return hookName in hooksStore;
  };
}
function createRunHook(hooks, storeKey, returnFirstArg = false) {
  return function runHooks(hookName, ...args) {
    const hooksStore = hooks[storeKey];
    if (!hooksStore[hookName]) {
      hooksStore[hookName] = {
        handlers: [],
        runs: 0
      };
    }
    hooksStore[hookName].runs++;
    const handlers = hooksStore[hookName].handlers;
    if (!handlers || !handlers.length) {
      return returnFirstArg ? args[0] : void 0;
    }
    const hookInfo = {
      name: hookName,
      currentIndex: 0
    };
    hooksStore.__current.push(hookInfo);
    while (hookInfo.currentIndex < handlers.length) {
      const handler = handlers[hookInfo.currentIndex];
      const result = handler.callback.apply(null, args);
      if (returnFirstArg) {
        args[0] = result;
      }
      hookInfo.currentIndex++;
    }
    hooksStore.__current.pop();
    if (returnFirstArg) {
      return args[0];
    }
    return void 0;
  };
}
function createCurrentHook(hooks, storeKey) {
  return function currentHook() {
    var _a;
    var _hooksStore$__current;
    const hooksStore = hooks[storeKey];
    return (_hooksStore$__current = (_a = hooksStore.__current[hooksStore.__current.length - 1]) == null ? void 0 : _a.name) !== null && _hooksStore$__current !== void 0 ? _hooksStore$__current : null;
  };
}
function createDoingHook(hooks, storeKey) {
  return function doingHook(hookName) {
    const hooksStore = hooks[storeKey];
    if ("undefined" === typeof hookName) {
      return "undefined" !== typeof hooksStore.__current[0];
    }
    return hooksStore.__current[0] ? hookName === hooksStore.__current[0].name : false;
  };
}
function createDidHook(hooks, storeKey) {
  return function didHook(hookName) {
    const hooksStore = hooks[storeKey];
    if (!validateHookName(hookName)) {
      return;
    }
    return hooksStore[hookName] && hooksStore[hookName].runs ? hooksStore[hookName].runs : 0;
  };
}
class _Hooks {
  constructor() {
    this.actions = /* @__PURE__ */ Object.create(null);
    this.actions.__current = [];
    this.filters = /* @__PURE__ */ Object.create(null);
    this.filters.__current = [];
    this.addAction = createAddHook(this, "actions");
    this.addFilter = createAddHook(this, "filters");
    this.removeAction = createRemoveHook(this, "actions");
    this.removeFilter = createRemoveHook(this, "filters");
    this.hasAction = createHasHook(this, "actions");
    this.hasFilter = createHasHook(this, "filters");
    this.removeAllActions = createRemoveHook(this, "actions", true);
    this.removeAllFilters = createRemoveHook(this, "filters", true);
    this.doAction = createRunHook(this, "actions");
    this.applyFilters = createRunHook(this, "filters", true);
    this.currentAction = createCurrentHook(this, "actions");
    this.currentFilter = createCurrentHook(this, "filters");
    this.doingAction = createDoingHook(this, "actions");
    this.doingFilter = createDoingHook(this, "filters");
    this.didAction = createDidHook(this, "actions");
    this.didFilter = createDidHook(this, "filters");
  }
}
function createHooks() {
  return new _Hooks();
}
const defaultHooks = createHooks();
const {
  addAction,
  addFilter,
  removeAction,
  removeFilter,
  hasAction,
  hasFilter,
  removeAllActions,
  removeAllFilters,
  doAction,
  applyFilters,
  currentAction,
  currentFilter,
  doingAction,
  doingFilter,
  didAction,
  didFilter,
  actions,
  filters
} = defaultHooks;
const i18n = createI18n(void 0, void 0, defaultHooks);
i18n.getLocaleData.bind(i18n);
i18n.setLocaleData.bind(i18n);
i18n.resetLocaleData.bind(i18n);
i18n.subscribe.bind(i18n);
const __$1 = i18n.__.bind(i18n);
i18n._x.bind(i18n);
i18n._n.bind(i18n);
i18n._nx.bind(i18n);
i18n.isRTL.bind(i18n);
i18n.hasTranslation.bind(i18n);
function __(key, textDomain) {
  var _a, _b, _c, _d, _e, _f;
  if (typeof window !== "undefined") {
    const w = window;
    const fromAccount = (_b = (_a = w.yatraAccountPage) == null ? void 0 : _a.translations) == null ? void 0 : _b[key];
    if (typeof fromAccount === "string" && fromAccount !== "") {
      return fromAccount;
    }
    const fromAdmin = (_d = (_c = w.yatraAdmin) == null ? void 0 : _c.translations) == null ? void 0 : _d[key];
    if (typeof fromAdmin === "string" && fromAdmin !== "") {
      return fromAdmin;
    }
  }
  if (typeof window !== "undefined" && ((_f = (_e = window.wp) == null ? void 0 : _e.i18n) == null ? void 0 : _f.__)) {
    return window.wp.i18n.__(key, textDomain || "yatra");
  }
  return __$1(key, textDomain || "yatra");
}
function sprintf(format, ...args) {
  var _a, _b;
  if (typeof window !== "undefined" && ((_b = (_a = window.wp) == null ? void 0 : _a.i18n) == null ? void 0 : _b.sprintf)) {
    return window.wp.i18n.sprintf(format, ...args);
  }
  return sprintf$1(
    format,
    ...args
  );
}
const ToastContext = reactExports.createContext(void 0);
const useToast = () => {
  const context = reactExports.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
const ToastProvider = ({
  children
}) => {
  const [toasts, setToasts] = reactExports.useState([]);
  const showToast = reactExports.useCallback(
    (message, type = "success", duration = 4e3) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast = { id, message, type, duration };
      setToasts((prev) => [...prev, newToast]);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );
  const removeToast = reactExports.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastContext.Provider, { value: { showToast, removeToast }, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, { toasts, onRemove: removeToast })
  ] });
};
const ToastContainer = ({
  toasts,
  onRemove
}) => {
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none", children: toasts.map((toast) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToastItem, { toast, onRemove }, toast.id)) });
};
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);
  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { className: "w-5 h-5 text-green-600" });
      case "error":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-red-600" });
      case "warning":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-600" });
      case "info":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-blue-600" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-5 h-5 text-gray-600" });
    }
  };
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
      case "error":
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400";
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `
        pointer-events-auto
        flex items-start gap-3
        p-4 rounded-lg border
        shadow-lg backdrop-blur-sm
        min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        ${getStyles()}
      `,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: getIcon() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 text-sm font-medium", children: toast.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: handleRemove,
            className: "flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors",
            "aria-label": __("Close", "yatra"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" })
          }
        )
      ]
    }
  );
};
const API_ENDPOINTS = {
  // Bookings
  BOOKINGS: "/bookings",
  BOOKING_GET: (id) => `/bookings/${id}`,
  BOOKING_STATUS: (id) => `/bookings/${id}/status`,
  BOOKING_DELETE: (id) => `/bookings/${id}`,
  BOOKINGS_BULK: "/bookings/bulk",
  BOOKINGS_STATS: "/bookings/stats",
  /** POST body: `{ booking_id }` — returns `{ checkout_url }` in `data`. */
  PAYMENT_REMAINING_SESSION: "/payment/remaining/session",
  BOOKING_CONSENT_STATUS: (id) => `/bookings/${id}/consent-status`,
  // Customers
  CUSTOMERS: "/customers",
  CUSTOMER_GET: (id) => `/customers/${id}`,
  CUSTOMER_DELETE: (id) => `/customers/${id}`,
  CUSTOMERS_BULK: "/customers/bulk",
  CUSTOMER_STATS: "/customers/stats",
  CUSTOMER_BOOKINGS: (id) => `/customers/${id}/bookings`,
  CUSTOMER_ME: "/customers/me",
  CUSTOMER_MY_BOOKINGS: "/customers/my-bookings",
  CUSTOMER_MY_PAYMENTS: "/customers/my-payments",
  CUSTOMER_MY_DOCUMENTS: "/customers/my-documents",
  CUSTOMER_MY_SUPPORT_TICKETS: "/customers/my-support-tickets",
  /** GET single booking for current user (details view). */
  CUSTOMER_MY_BOOKING: (id) => `/customers/my-bookings/${id}`,
  // Travelers
  TRAVELERS: "/travelers",
  TRAVELERS_BULK: "/travelers/bulk",
  // Reviews
  REVIEWS: "/reviews",
  REVIEW_DELETE: (id) => `/reviews/${id}`,
  REVIEW_STATUS: (id) => `/reviews/${id}/status`,
  REVIEWS_BULK: "/reviews/bulk",
  // Trips
  TRIPS: "/trips",
  TRIP_GET: (id) => `/trips/${id}`,
  TRIP_DELETE: (id) => `/trips/${id}`,
  TRIP_PERMANENT_DELETE: (id) => `/trips/${id}/permanent-delete`,
  TRIP_DUPLICATE: (id) => `/trips/${id}/duplicate`,
  TRIPS_STATS: "/trips/stats",
  TRIP_ATTRIBUTES: (id) => `/trips/${id}/attributes`,
  // Departures
  DEPARTURES: "/departures",
  TRIP_DEPARTURES: (tripId) => `/trips/${tripId}/departures`,
  DEPARTURE_GET: (tripId, id) => `/trips/${tripId}/departures/${id}`,
  DEPARTURE_UPDATE: (tripId, id) => `/trips/${tripId}/departures/${id}`,
  DEPARTURE_DELETE: (tripId, id) => `/trips/${tripId}/departures/${id}`,
  TRIP_DEPARTURES_PAST: (tripId) => `/trips/${tripId}/departures/past`,
  // Recurring Rules
  RECURRING_RULES: (tripId) => `/trips/${tripId}/recurring-rules`,
  RECURRING_RULE_GET: (tripId, ruleId) => `/trips/${tripId}/recurring-rules/${ruleId}`,
  // Payments
  PAYMENTS: "/payments",
  PAYMENTS_STATS: "/payments/stats",
  PAYMENT_GET: (id) => `/payments/${id}`,
  PAYMENT_DELETE: (id) => `/payments/${id}`,
  // Usage tracking (opt-in telemetry)
  USAGE_TRACKING_STATUS: "/usage-tracking/status",
  USAGE_TRACKING_SETTINGS: "/usage-tracking/settings",
  USAGE_TRACKING_SEND: "/usage-tracking/send",
  USAGE_TRACKING_PREVIEW: "/usage-tracking/preview",
  USAGE_TRACKING_CLEAR_CACHE: "/usage-tracking/clear-cache",
  USAGE_TRACKING_DELETE_SNAPSHOTS: "/usage-tracking/delete-snapshots",
  // Settings
  SETTINGS: "/settings",
  SETTINGS_GROUP: (group) => `/settings?group=${group}`,
  SETTINGS_PAGES: "/settings/pages",
  SETTINGS_FLUSH_REWRITE_RULES: "/settings/flush-rewrite-rules",
  SETTINGS_CHECK_SHORTCODE: (pageId) => `/settings/check-shortcode/${pageId}`,
  SETTINGS_INSERT_SHORTCODE: (pageId) => `/settings/insert-shortcode/${pageId}`,
  SETTINGS_EMAIL_TEMPLATE_PREVIEW: "/settings/email-template-preview",
  // Payment (definitions for admin Settings UI)
  PAYMENT_GATEWAY_DEFINITIONS: "/payment/gateways/definitions",
  // Enquiries
  ENQUIRIES: "/enquiries",
  ENQUIRY_GET: (id) => `/enquiries/${id}`,
  ENQUIRY_DELETE: (id) => `/enquiries/${id}`,
  ENQUIRIES_BULK: "/enquiries/bulk",
  ENQUIRY_STATS: "/enquiries/stats",
  ENQUIRY_RESPOND: (id) => `/enquiries/${id}/respond`,
  // Reports
  REPORTS: "/reports",
  REPORTS_EXPORT: (type) => `/reports/export?type=${type}`,
  // Modules
  MODULES: "/modules",
  // Facebook Pixel
  FACEBOOK_PIXEL_SETTINGS: "/facebook-pixel/settings",
  FACEBOOK_PIXEL_TEST: "/facebook-pixel/test",
  FACEBOOK_PIXEL_TEST_TOKEN: "/facebook-pixel/test-token",
  FACEBOOK_PIXEL_EVENTS: "/facebook-pixel/events",
  FACEBOOK_PIXEL_EVENT_LOGS: "/facebook-pixel/event-logs",
  // Google Analytics 4
  GOOGLE_ANALYTICS_SETTINGS: "/google-analytics/settings",
  GOOGLE_ANALYTICS_TEST: "/google-analytics/test",
  GOOGLE_ANALYTICS_VALIDATE_MEASUREMENT_ID: "/google-analytics/validate/measurement-id",
  GOOGLE_ANALYTICS_VALIDATE_API_SECRET: "/google-analytics/validate/api-secret",
  GOOGLE_ANALYTICS_EVENTS: "/google-analytics/events",
  GOOGLE_ANALYTICS_EVENT_LOGS: "/google-analytics/logs",
  // Abandoned Bookings
  ABANDONED_BOOKINGS: "/abandoned-bookings",
  ABANDONED_BOOKING_GET: (id) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKING_DELETE: (id) => `/abandoned-bookings/${id}`,
  ABANDONED_BOOKINGS_SETTINGS: "/abandoned-bookings/settings",
  ABANDONED_BOOKINGS_STATISTICS: "/abandoned-bookings/statistics",
  ABANDONED_BOOKING_SEND_EMAIL: (id) => `/abandoned-bookings/${id}/send-email`,
  ABANDONED_BOOKINGS_CAMPAIGNS: "/abandoned-bookings/campaigns",
  ABANDONED_BOOKINGS_CAMPAIGN_GET: (id) => `/abandoned-bookings/campaigns/${id}`,
  // Google Calendar
  GOOGLE_CALENDAR_SETTINGS: "/google-calendar/settings",
  GOOGLE_CALENDAR_CONNECT: "/google-calendar/connect",
  GOOGLE_CALENDAR_DISCONNECT: "/google-calendar/disconnect",
  GOOGLE_CALENDAR_SYNC_ALL: "/google-calendar/sync-all",
  // Tools
  TOOLS_SYSTEM_STATUS: "/tools/system-status",
  TOOLS_ACTIVE_JOBS: "/tools/active-jobs",
  TOOLS_LOGS: (type, page) => `/tools/logs/${type}?page=${page}`,
  TOOLS_LOGS_CLEAR: (type) => `/tools/logs/${type}/clear`,
  TOOLS_EXPORT_JOB: "/tools/export-job",
  TOOLS_JOB_ACTION: (endpoint, jobId) => `/tools/${endpoint}/${jobId}`,
  TOOLS_EXPORT_DOWNLOAD: (jobId) => `/tools/export-job/${jobId}/download`,
  TOOLS_EXPORT_DELETE: (jobId) => `/tools/export-job/${jobId}`,
  TOOLS_EXPORT_STATUS: (jobId) => `/tools/export-job/${jobId}`,
  TOOLS_IMPORT_JOB: "/tools/import-job",
  TOOLS_IMPORT_JOB_GET: (jobId) => `/tools/import-job/${jobId}`,
  TOOLS_ALL_JOBS: "/tools/all-jobs",
  TOOLS_CRON_JOBS: "/tools/cron-jobs",
  TOOLS_CRON_RUN: (hook) => `/tools/cron-jobs/${hook}/run`,
  TOOLS_CLEAR_CACHE: "/tools/clear-cache",
  TOOLS_CACHE_VIEW: "/cache/view",
  TOOLS_CACHE_CLEAR_ITEM: "/cache/clear-item",
  // Migration
  MIGRATION_STATUS: "/migration/status",
  MIGRATION_CLEAR: "/migration/clear",
  MIGRATION_PROGRESS: "/migration/progress",
  MIGRATION_MIGRATE_ALL: "/migration/migrate-all",
  MIGRATION_CANCEL: "/migration/cancel",
  // Payment Gateways
  PAYMENT_GATEWAYS: "/payment/gateways",
  // Signed Consents
  SIGNED_CONSENTS: "/signed-consents",
  SIGNED_CONSENT_GET: (id) => `/signed-consents/${id}`,
  SIGNED_CONSENT_PDF: (id) => `/signed-consents/${id}/pdf`,
  SIGNED_CONSENTS_PREVIEW: "/signed-consents/preview",
  // Dynamic Pricing
  DYNAMIC_PRICING_SETTINGS: "/dynamic-pricing/settings",
  // Availability
  AVAILABILITY: (tripId) => `/trips/${tripId}/availability`,
  // Itinerary
  ITINERARY: "/itinerary",
  ITINERARY_GET: (id, mode) => mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_DELETE: (id, mode) => mode ? `/itinerary/${id}?mode=${mode}` : `/itinerary/${id}`,
  ITINERARY_BY_TRIP: (tripId) => `/itinerary?trip_id=${tripId}`,
  ITINERARY_DAY_ENTRY_BY_DAY_ID: (dayId) => `/itinerary/day-entry-by-day-id/${dayId}`,
  // One-shot save of every activity for a single day. Replaces N sequential
  // PUTs (one per activity) with a single batch request — the controller
  // dispatches each row to update/create and returns per-row results.
  ITINERARY_DAY_ACTIVITIES_BULK: (dayId) => `/itinerary/day/${dayId}/activities/bulk`,
  // Saved Trips
  SAVED_TRIPS: "/saved-trips",
  // Email automation (Yatra Pro module — routes registered when module is active)
  EMAIL_TEMPLATES: "/email-templates",
  EMAIL_TEMPLATE_GET: (id) => `/email-templates/${id}`,
  EMAIL_TEMPLATE_PREVIEW: (id) => `/email-templates/${id}/preview`,
  EMAIL_TEMPLATE_TEST: (id) => `/email-templates/${id}/test`,
  EMAIL_TEMPLATE_DUPLICATE: (id) => `/email-templates/${id}/duplicate`,
  EMAIL_TEMPLATE_VARIABLES: "/email-templates/variables",
  EMAIL_SEQUENCES: "/email-sequences",
  EMAIL_SEQUENCE_GET: (id) => `/email-sequences/${id}`,
  EMAIL_LOGS: "/email-logs",
  // Notices (Admin UI + WP notices)
  NOTICES: "/notices",
  NOTICE_DISMISS: (id) => `/notices/${id}/dismiss`
};
const serializePayload = (body) => {
  if (!body) {
    return void 0;
  }
  if (typeof body === "string") {
    return body;
  }
  if (body instanceof URLSearchParams) {
    return body.toString();
  }
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const entries = {};
    body.forEach((value, key) => {
      entries[key] = value;
    });
    try {
      return JSON.stringify(entries, null, 2);
    } catch {
      return "[FormData]";
    }
  }
  if (typeof body === "object") {
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }
  return String(body);
};
const formatRequestUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    const params = new URLSearchParams(parsed.search);
    const restRoute = params.get("rest_route");
    if (restRoute) {
      params.delete("rest_route");
      const decodedRoute = decodeURIComponent(restRoute);
      const normalizedRoute = decodedRoute.startsWith("/") ? decodedRoute : `/${decodedRoute}`;
      const remainingParams = params.toString();
      return `${parsed.origin}${normalizedRoute}${remainingParams ? `?${remainingParams}` : ""}`;
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};
class ApiError extends Error {
  constructor(message, response, requestInfo) {
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.requestInfo = requestInfo;
  }
}
class ApiClient {
  /** Public account page uses `yatraAccountPage`; admin uses `yatraAdmin`. Resolve per request so module load order never leaves an empty nonce. */
  resolveBaseUrl() {
    var _a, _b;
    if (typeof window === "undefined") {
      return "/wp-json/yatra/v1";
    }
    const w = window;
    const raw = ((_a = w.yatraAccountPage) == null ? void 0 : _a.apiUrl) || ((_b = w.yatraAdmin) == null ? void 0 : _b.apiUrl) || "/wp-json/yatra/v1";
    return raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }
  resolveNonce() {
    var _a, _b;
    if (typeof window === "undefined") {
      return "";
    }
    const w = window;
    return ((_a = w.yatraAccountPage) == null ? void 0 : _a.nonce) || ((_b = w.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  }
  async request(endpoint, options = {}, queryParams) {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let url;
    const baseUrl = this.resolveBaseUrl();
    if (baseUrl.includes("?rest_route=")) {
      const [base, queryString] = baseUrl.split("?");
      const params = new URLSearchParams(queryString);
      const restRoute = params.get("rest_route") || "";
      params.set("rest_route", restRoute + cleanEndpoint);
      if (endpointQuery) {
        const endpointParams = new URLSearchParams(endpointQuery);
        endpointParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      if (queryParams) {
        queryParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      url = `${base}?${params.toString()}`;
    } else {
      url = `${baseUrl}${cleanEndpoint}`;
      if (endpointQuery || queryParams) {
        const params = new URLSearchParams();
        if (endpointQuery) {
          const endpointParams = new URLSearchParams(endpointQuery);
          endpointParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        if (queryParams) {
          queryParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        url += `?${params.toString()}`;
      }
    }
    const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = {
      "X-WP-Nonce": this.resolveNonce(),
      ...options.headers
    };
    if (!isFormDataBody) {
      const hasContentTypeHeader = headers instanceof Headers && headers.has("Content-Type") || !(headers instanceof Headers) && Object.keys(headers).some(
        (k) => k.toLowerCase() === "content-type"
      );
      if (!hasContentTypeHeader) {
        headers["Content-Type"] = "application/json";
      }
    }
    const method = (options.method || "GET").toUpperCase();
    const serializedPayload = serializePayload(options.body);
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    if (!response.ok) {
      const raw = await response.text();
      let data = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }
      const message = typeof data === "object" && (data == null ? void 0 : data.message) || typeof data === "string" && data || response.statusText || `HTTP error! status: ${response.status}`;
      throw new ApiError(
        message,
        {
          status: response.status,
          statusText: response.statusText,
          data
        },
        {
          url: formatRequestUrl(url),
          method,
          payload: serializedPayload
        }
      );
    }
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  async requestBlob(endpoint, options = {}, queryParams) {
    const [endpointPath, endpointQuery] = endpoint.split("?");
    const cleanEndpoint = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let url;
    const baseUrl = this.resolveBaseUrl();
    if (baseUrl.includes("?rest_route=")) {
      const [base, queryString] = baseUrl.split("?");
      const params = new URLSearchParams(queryString);
      const restRoute = params.get("rest_route") || "";
      params.set("rest_route", restRoute + cleanEndpoint);
      if (endpointQuery) {
        const endpointParams = new URLSearchParams(endpointQuery);
        endpointParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      if (queryParams) {
        queryParams.forEach((value, key) => {
          params.append(key, value);
        });
      }
      url = `${base}?${params.toString()}`;
    } else {
      url = `${baseUrl}${cleanEndpoint}`;
      if (endpointQuery || queryParams) {
        const params = new URLSearchParams();
        if (endpointQuery) {
          const endpointParams = new URLSearchParams(endpointQuery);
          endpointParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        if (queryParams) {
          queryParams.forEach((value, key) => {
            params.append(key, value);
          });
        }
        url += `?${params.toString()}`;
      }
    }
    const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
    const headers = {
      "X-WP-Nonce": this.resolveNonce(),
      ...options.headers
    };
    if (!isFormDataBody) {
      const hasContentTypeHeader = headers instanceof Headers && headers.has("Content-Type") || !(headers instanceof Headers) && Object.keys(headers).some(
        (k) => k.toLowerCase() === "content-type"
      );
      if (!hasContentTypeHeader) {
        headers["Content-Type"] = "application/json";
      }
    }
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.blob();
  }
  async get(endpoint, config) {
    let queryParams;
    if (config == null ? void 0 : config.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.request(
      endpoint,
      {
        method: "GET"
      },
      queryParams
    );
  }
  async getBlob(endpoint, config) {
    let queryParams;
    if (config == null ? void 0 : config.params) {
      queryParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return this.requestBlob(endpoint, { method: "GET" }, queryParams);
  }
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }
  async delete(endpoint, config) {
    return this.request(endpoint, {
      method: "DELETE",
      body: (config == null ? void 0 : config.data) ? JSON.stringify(config.data) : void 0
    });
  }
}
const apiClient = new ApiClient();
async function fetchPaymentNormalized(id) {
  const raw = await apiClient.get(API_ENDPOINTS.PAYMENT_GET(id));
  if (raw == null) {
    return null;
  }
  if (typeof raw !== "object") {
    return null;
  }
  const r = raw;
  if (r.success === true && r.data != null && typeof r.data === "object") {
    return { success: true, data: r.data };
  }
  if (r.id !== void 0 && r.id !== null) {
    return { success: true, data: r };
  }
  return {
    success: false,
    message: String(r.message ?? "Payment not found")
  };
}
class WpApiClient {
  constructor() {
    var _a, _b;
    const rawUrl = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.restUrl) || "/wp-json";
    this.baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
    this.nonce = ((_b = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _b.nonce) || "";
  }
  async get(endpoint) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-WP-Nonce": this.nonce
      },
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }
}
const wpClient = new WpApiClient();
const wpService = {
  getMedia: (id) => wpClient.get(`/wp/v2/media/${id}`)
};
const ajaxService = {
  post: async (action, data) => {
    var _a;
    const siteUrl = ((_a = window == null ? void 0 : window.yatraAdmin) == null ? void 0 : _a.siteUrl) || "";
    const url = `${siteUrl}/wp-admin/admin-ajax.php`;
    const body = new URLSearchParams({
      action,
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v == null ? "" : String(v)])
      )
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
      credentials: "include"
    });
    return response.json();
  }
};
const apiService = {
  // Bookings
  getBookings: (params) => apiClient.get(API_ENDPOINTS.BOOKINGS, { params }),
  getBooking: (id) => apiClient.get(API_ENDPOINTS.BOOKING_GET(id)),
  createBooking: (data) => apiClient.post(API_ENDPOINTS.BOOKINGS, data),
  updateBooking: (id, data) => apiClient.put(API_ENDPOINTS.BOOKING_GET(id), data),
  updateBookingStatus: (id, status) => apiClient.put(API_ENDPOINTS.BOOKING_STATUS(id), { status }),
  deleteBooking: (id) => apiClient.delete(API_ENDPOINTS.BOOKING_DELETE(id)),
  getBookingsStats: () => apiClient.get(API_ENDPOINTS.BOOKINGS_STATS),
  // Customers
  getCustomers: (params) => apiClient.get(API_ENDPOINTS.CUSTOMERS, { params }),
  getCustomer: (id) => apiClient.get(API_ENDPOINTS.CUSTOMER_GET(id)),
  deleteCustomer: (id) => apiClient.delete(API_ENDPOINTS.CUSTOMER_DELETE(id)),
  updateCustomer: (id, data) => apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), data),
  updateCustomerStatus: (id, status) => apiClient.put(API_ENDPOINTS.CUSTOMER_GET(id), { status }),
  getCustomerBookings: (id) => apiClient.get(API_ENDPOINTS.CUSTOMER_BOOKINGS(id)),
  getCustomerStats: () => apiClient.get(API_ENDPOINTS.CUSTOMER_STATS),
  // Travelers
  getTravelers: (params) => apiClient.get(API_ENDPOINTS.TRAVELERS, { params }),
  bulkTravelersAction: (action, ids) => apiClient.put(API_ENDPOINTS.TRAVELERS_BULK, { action, ids }),
  // Reviews
  getReviews: (params) => apiClient.get(API_ENDPOINTS.REVIEWS, { params }),
  deleteReview: (id) => apiClient.delete(API_ENDPOINTS.REVIEW_DELETE(id)),
  updateReviewStatus: (id, status) => apiClient.put(API_ENDPOINTS.REVIEW_STATUS(id), { status }),
  bulkReviewsAction: (action, ids) => apiClient.put(API_ENDPOINTS.REVIEWS_BULK, { action, ids }),
  // Trips
  getTrips: (params) => apiClient.get(API_ENDPOINTS.TRIPS, { params }),
  getTrip: (id) => apiClient.get(API_ENDPOINTS.TRIP_GET(id)),
  deleteTrip: (id) => apiClient.delete(API_ENDPOINTS.TRIP_DELETE(id)),
  duplicateTrip: (id) => apiClient.post(API_ENDPOINTS.TRIP_DUPLICATE(id)),
  // Settings
  getSettings: (group) => apiClient.get(
    group ? API_ENDPOINTS.SETTINGS_GROUP(group) : API_ENDPOINTS.SETTINGS
  ),
  // Notices
  getNotices: () => apiClient.get(API_ENDPOINTS.NOTICES),
  dismissNotice: (id) => apiClient.post(API_ENDPOINTS.NOTICE_DISMISS(id), {}),
  // Payments
  getPayment: (id) => fetchPaymentNormalized(id),
  deletePayment: (id) => apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id)),
  getPayments: (params) => apiClient.get(API_ENDPOINTS.PAYMENTS, { params }),
  getPaymentsStats: () => apiClient.get(API_ENDPOINTS.PAYMENTS_STATS),
  createPayment: (data) => apiClient.post(API_ENDPOINTS.PAYMENTS, data),
  updatePayment: (id, data) => apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), data),
  updatePaymentStatus: (id, status) => apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), { status }),
  bulkPaymentsAction: (action, ids) => Promise.all(
    ids.map((id) => {
      if (action === "delete") {
        return apiClient.delete(API_ENDPOINTS.PAYMENT_DELETE(id));
      } else {
        return apiClient.put(API_ENDPOINTS.PAYMENT_GET(id), {
          status: action
        });
      }
    })
  ),
  // Modules
  getModules: () => apiClient.get(API_ENDPOINTS.MODULES),
  // Facebook Pixel
  getFacebookPixelSettings: () => apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_SETTINGS),
  testFacebookPixel: (pixelId) => apiClient.post(API_ENDPOINTS.FACEBOOK_PIXEL_TEST, { pixel_id: pixelId }),
  testFacebookPixelToken: (accessToken) => apiClient.post(API_ENDPOINTS.FACEBOOK_PIXEL_TEST_TOKEN, {
    access_token: accessToken
  }),
  getFacebookPixelEvents: () => apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_EVENTS),
  getFacebookPixelEventLogs: () => apiClient.get(API_ENDPOINTS.FACEBOOK_PIXEL_EVENT_LOGS),
  clearFacebookPixelEventLogs: () => apiClient.delete(API_ENDPOINTS.FACEBOOK_PIXEL_EVENT_LOGS),
  // Google Analytics 4
  getGoogleAnalyticsSettings: () => apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_SETTINGS),
  testGoogleAnalytics: (measurementId) => apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_TEST, {
    measurement_id: measurementId
  }),
  validateGoogleAnalyticsMeasurementId: (measurementId) => apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_VALIDATE_MEASUREMENT_ID, {
    measurement_id: measurementId
  }),
  validateGoogleAnalyticsApiSecret: (measurementId, apiSecret) => apiClient.post(API_ENDPOINTS.GOOGLE_ANALYTICS_VALIDATE_API_SECRET, {
    measurement_id: measurementId,
    api_secret: apiSecret
  }),
  getGoogleAnalyticsEvents: () => apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENTS),
  getGoogleAnalyticsEventLogs: () => apiClient.get(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENT_LOGS),
  clearGoogleAnalyticsEventLogs: () => apiClient.delete(API_ENDPOINTS.GOOGLE_ANALYTICS_EVENT_LOGS),
  // Payment Gateways
  getPaymentGateways: () => apiClient.get(API_ENDPOINTS.PAYMENT_GATEWAYS),
  // Abandoned Bookings
  getAbandonedBookings: (params) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS, { params }),
  getAbandonedBooking: (id) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKING_GET(id)),
  deleteAbandonedBooking: (id) => apiClient.delete(API_ENDPOINTS.ABANDONED_BOOKING_DELETE(id)),
  getAbandonedBookingsSettings: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS),
  saveAbandonedBookingsSettings: (data) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_SETTINGS, data),
  getAbandonedBookingsStatistics: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_STATISTICS),
  sendAbandonedBookingEmail: (id) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKING_SEND_EMAIL(id)),
  getAbandonedBookingCampaigns: () => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS),
  getAbandonedBookingCampaign: (id) => apiClient.get(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id)),
  createAbandonedBookingCampaign: (data) => apiClient.post(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGNS, data),
  updateAbandonedBookingCampaign: (id, data) => apiClient.put(API_ENDPOINTS.ABANDONED_BOOKINGS_CAMPAIGN_GET(id), data),
  // Enquiries
  getEnquiries: (params) => apiClient.get(API_ENDPOINTS.ENQUIRIES, { params }),
  getEnquiry: (id) => apiClient.get(API_ENDPOINTS.ENQUIRY_GET(id)),
  deleteEnquiry: (id) => apiClient.delete(API_ENDPOINTS.ENQUIRY_DELETE(id)),
  createEnquiry: (data) => apiClient.post(API_ENDPOINTS.ENQUIRIES, data),
  updateEnquiry: (id, data) => apiClient.put(API_ENDPOINTS.ENQUIRY_GET(id), data),
  getEnquiriesStats: () => apiClient.get(API_ENDPOINTS.ENQUIRY_STATS),
  bulkEnquiriesAction: (action, ids) => apiClient.put(API_ENDPOINTS.ENQUIRIES_BULK, { action, ids }),
  respondToEnquiry: (id, data) => apiClient.post(API_ENDPOINTS.ENQUIRY_RESPOND(id), data),
  // Google Calendar
  getGoogleCalendarSettings: () => apiClient.get(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS),
  connectGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_CONNECT),
  disconnectGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_DISCONNECT),
  syncAllGoogleCalendar: () => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SYNC_ALL),
  updateGoogleCalendarSettings: (data) => apiClient.post(API_ENDPOINTS.GOOGLE_CALENDAR_SETTINGS, data),
  // Signed Consents
  getSignedConsents: (params) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS, { params }),
  getSignedConsent: (id) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_GET(id)),
  downloadSignedConsentPdf: (id) => apiClient.get(API_ENDPOINTS.SIGNED_CONSENT_PDF(id)),
  previewSignedConsent: () => apiClient.get(API_ENDPOINTS.SIGNED_CONSENTS_PREVIEW),
  // Tools
  getSystemStatus: () => apiClient.get(API_ENDPOINTS.TOOLS_SYSTEM_STATUS),
  getActiveJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ACTIVE_JOBS),
  getLogs: (type, page) => apiClient.get(API_ENDPOINTS.TOOLS_LOGS(type, page)),
  clearLogs: (type) => apiClient.delete(API_ENDPOINTS.TOOLS_LOGS_CLEAR(type)),
  createExportJob: (data) => apiClient.post(API_ENDPOINTS.TOOLS_EXPORT_JOB, data),
  performJobAction: (endpoint, jobId) => apiClient.get(API_ENDPOINTS.TOOLS_JOB_ACTION(endpoint, jobId)),
  downloadExportJob: (jobId) => apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  downloadExportJobBlob: (jobId) => apiClient.getBlob(API_ENDPOINTS.TOOLS_EXPORT_DOWNLOAD(jobId)),
  deleteExportJob: (jobId) => apiClient.delete(API_ENDPOINTS.TOOLS_EXPORT_DELETE(jobId)),
  getExportJobStatus: (jobId) => apiClient.get(API_ENDPOINTS.TOOLS_EXPORT_STATUS(jobId)),
  createImportJob: (data) => apiClient.post(API_ENDPOINTS.TOOLS_IMPORT_JOB, data),
  getImportJob: (jobId) => apiClient.get(API_ENDPOINTS.TOOLS_IMPORT_JOB_GET(jobId)),
  deleteImportJob: (jobId) => apiClient.delete(API_ENDPOINTS.TOOLS_IMPORT_JOB_GET(jobId)),
  getAllJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_ALL_JOBS),
  getCronJobs: () => apiClient.get(API_ENDPOINTS.TOOLS_CRON_JOBS),
  runCronJob: (hook) => apiClient.post(API_ENDPOINTS.TOOLS_CRON_RUN(hook)),
  clearCache: () => apiClient.delete(API_ENDPOINTS.TOOLS_CLEAR_CACHE),
  getCacheView: () => apiClient.get(API_ENDPOINTS.TOOLS_CACHE_VIEW),
  clearCacheItem: (key, type) => apiClient.delete(
    `${API_ENDPOINTS.TOOLS_CACHE_CLEAR_ITEM}?key=${encodeURIComponent(key)}&type=${encodeURIComponent(type)}`
  ),
  // Migration
  getMigrationStatus: () => apiClient.get(API_ENDPOINTS.MIGRATION_STATUS),
  clearMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CLEAR),
  getMigrationProgress: () => apiClient.get(API_ENDPOINTS.MIGRATION_PROGRESS),
  runMigrationAll: (data) => apiClient.post(API_ENDPOINTS.MIGRATION_MIGRATE_ALL, data),
  cancelMigration: () => apiClient.post(API_ENDPOINTS.MIGRATION_CANCEL),
  // Sample Data
  importSampleData: (data) => apiClient.post("/sample-data/import", data),
  getSampleDataStatus: () => apiClient.get("/sample-data/status"),
  cleanupSampleData: () => apiClient.delete("/sample-data/cleanup"),
  // Common bulk operations
  bulkDelete: (endpoint, ids) => Promise.all(ids.map((id) => apiClient.delete(`${endpoint}/${id}`))),
  bulkUpdateStatus: (endpoint, ids, status) => Promise.all(
    ids.map((id) => apiClient.put(`${endpoint}/${id}/status`, { status }))
  )
};
const CURRENCIES = {
  // Major Currencies
  USD: { code: "USD", name: "US Dollar", symbol: "$", decimalDigits: 2 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", decimalDigits: 2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", decimalDigits: 2 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", decimalDigits: 0 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimalDigits: 2 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimalDigits: 2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimalDigits: 2 },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    decimalDigits: 2
  },
  NZD: {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    decimalDigits: 2
  },
  // Asian Currencies
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", decimalDigits: 2 },
  NPR: { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", decimalDigits: 2 },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨", decimalDigits: 2 },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", decimalDigits: 2 },
  LKR: {
    code: "LKR",
    name: "Sri Lankan Rupee",
    symbol: "Rs",
    decimalDigits: 2
  },
  MMK: { code: "MMK", name: "Myanmar Kyat", symbol: "K", decimalDigits: 2 },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", decimalDigits: 2 },
  VND: { code: "VND", name: "Vietnamese Dong", symbol: "₫", decimalDigits: 0 },
  IDR: {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    decimalDigits: 2
  },
  MYR: {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    decimalDigits: 2
  },
  SGD: {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    decimalDigits: 2
  },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", decimalDigits: 2 },
  KRW: { code: "KRW", name: "South Korean Won", symbol: "₩", decimalDigits: 0 },
  TWD: { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", decimalDigits: 2 },
  HKD: {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
    decimalDigits: 2
  },
  MOP: {
    code: "MOP",
    name: "Macanese Pataca",
    symbol: "MOP$",
    decimalDigits: 2
  },
  KHR: { code: "KHR", name: "Cambodian Riel", symbol: "៛", decimalDigits: 2 },
  LAK: { code: "LAK", name: "Lao Kip", symbol: "₭", decimalDigits: 2 },
  BND: { code: "BND", name: "Brunei Dollar", symbol: "B$", decimalDigits: 2 },
  MNT: { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", decimalDigits: 2 },
  KZT: {
    code: "KZT",
    name: "Kazakhstani Tenge",
    symbol: "₸",
    decimalDigits: 2
  },
  UZS: {
    code: "UZS",
    name: "Uzbekistani Som",
    symbol: "сўм",
    decimalDigits: 2
  },
  KGS: {
    code: "KGS",
    name: "Kyrgyzstani Som",
    symbol: "сом",
    decimalDigits: 2
  },
  TJS: {
    code: "TJS",
    name: "Tajikistani Somoni",
    symbol: "ЅМ",
    decimalDigits: 2
  },
  TMT: {
    code: "TMT",
    name: "Turkmenistani Manat",
    symbol: "m",
    decimalDigits: 2
  },
  AFN: { code: "AFN", name: "Afghan Afghani", symbol: "؋", decimalDigits: 2 },
  // Middle Eastern Currencies
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimalDigits: 2 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimalDigits: 2 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "﷼", decimalDigits: 2 },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimalDigits: 3 },
  BHD: {
    code: "BHD",
    name: "Bahraini Dinar",
    symbol: ".د.ب",
    decimalDigits: 3
  },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "﷼", decimalDigits: 3 },
  JOD: {
    code: "JOD",
    name: "Jordanian Dinar",
    symbol: "د.ا",
    decimalDigits: 3
  },
  ILS: { code: "ILS", name: "Israeli Shekel", symbol: "₪", decimalDigits: 2 },
  LBP: { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", decimalDigits: 2 },
  SYP: { code: "SYP", name: "Syrian Pound", symbol: "£S", decimalDigits: 2 },
  IQD: { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", decimalDigits: 3 },
  IRR: { code: "IRR", name: "Iranian Rial", symbol: "﷼", decimalDigits: 2 },
  YER: { code: "YER", name: "Yemeni Rial", symbol: "﷼", decimalDigits: 2 },
  EGP: { code: "EGP", name: "Egyptian Pound", symbol: "E£", decimalDigits: 2 },
  TRY: { code: "TRY", name: "Turkish Lira", symbol: "₺", decimalDigits: 2 },
  // European Currencies
  SEK: { code: "SEK", name: "Swedish Krona", symbol: "kr", decimalDigits: 2 },
  NOK: { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimalDigits: 2 },
  DKK: { code: "DKK", name: "Danish Krone", symbol: "kr", decimalDigits: 2 },
  ISK: { code: "ISK", name: "Icelandic Króna", symbol: "kr", decimalDigits: 0 },
  PLN: { code: "PLN", name: "Polish Zloty", symbol: "zł", decimalDigits: 2 },
  CZK: { code: "CZK", name: "Czech Koruna", symbol: "Kč", decimalDigits: 2 },
  HUF: {
    code: "HUF",
    name: "Hungarian Forint",
    symbol: "Ft",
    decimalDigits: 2
  },
  RON: { code: "RON", name: "Romanian Leu", symbol: "lei", decimalDigits: 2 },
  BGN: { code: "BGN", name: "Bulgarian Lev", symbol: "лв", decimalDigits: 2 },
  HRK: { code: "HRK", name: "Croatian Kuna", symbol: "kn", decimalDigits: 2 },
  RSD: { code: "RSD", name: "Serbian Dinar", symbol: "дин.", decimalDigits: 2 },
  MKD: {
    code: "MKD",
    name: "Macedonian Denar",
    symbol: "ден",
    decimalDigits: 2
  },
  BAM: {
    code: "BAM",
    name: "Bosnia-Herzegovina Mark",
    symbol: "KM",
    decimalDigits: 2
  },
  ALL: { code: "ALL", name: "Albanian Lek", symbol: "L", decimalDigits: 2 },
  MDL: { code: "MDL", name: "Moldovan Leu", symbol: "L", decimalDigits: 2 },
  UAH: {
    code: "UAH",
    name: "Ukrainian Hryvnia",
    symbol: "₴",
    decimalDigits: 2
  },
  BYN: {
    code: "BYN",
    name: "Belarusian Ruble",
    symbol: "Br",
    decimalDigits: 2
  },
  RUB: { code: "RUB", name: "Russian Ruble", symbol: "₽", decimalDigits: 2 },
  GEL: { code: "GEL", name: "Georgian Lari", symbol: "₾", decimalDigits: 2 },
  AMD: { code: "AMD", name: "Armenian Dram", symbol: "֏", decimalDigits: 2 },
  AZN: {
    code: "AZN",
    name: "Azerbaijani Manat",
    symbol: "₼",
    decimalDigits: 2
  },
  // African Currencies
  ZAR: {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    decimalDigits: 2
  },
  NGN: { code: "NGN", name: "Nigerian Naira", symbol: "₦", decimalDigits: 2 },
  KES: {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    decimalDigits: 2
  },
  GHS: { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", decimalDigits: 2 },
  TZS: {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    decimalDigits: 2
  },
  UGX: {
    code: "UGX",
    name: "Ugandan Shilling",
    symbol: "USh",
    decimalDigits: 0
  },
  RWF: { code: "RWF", name: "Rwandan Franc", symbol: "FRw", decimalDigits: 0 },
  ETB: { code: "ETB", name: "Ethiopian Birr", symbol: "Br", decimalDigits: 2 },
  MAD: {
    code: "MAD",
    name: "Moroccan Dirham",
    symbol: "د.م.",
    decimalDigits: 2
  },
  TND: { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", decimalDigits: 3 },
  DZD: { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", decimalDigits: 2 },
  LYD: { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", decimalDigits: 3 },
  SDG: {
    code: "SDG",
    name: "Sudanese Pound",
    symbol: "ج.س.",
    decimalDigits: 2
  },
  XOF: {
    code: "XOF",
    name: "West African CFA Franc",
    symbol: "CFA",
    decimalDigits: 0
  },
  XAF: {
    code: "XAF",
    name: "Central African CFA Franc",
    symbol: "FCFA",
    decimalDigits: 0
  },
  MUR: { code: "MUR", name: "Mauritian Rupee", symbol: "₨", decimalDigits: 2 },
  SCR: {
    code: "SCR",
    name: "Seychellois Rupee",
    symbol: "₨",
    decimalDigits: 2
  },
  MGA: { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", decimalDigits: 2 },
  MZN: {
    code: "MZN",
    name: "Mozambican Metical",
    symbol: "MT",
    decimalDigits: 2
  },
  ZMW: { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", decimalDigits: 2 },
  BWP: { code: "BWP", name: "Botswana Pula", symbol: "P", decimalDigits: 2 },
  NAD: { code: "NAD", name: "Namibian Dollar", symbol: "N$", decimalDigits: 2 },
  AOA: { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", decimalDigits: 2 },
  CDF: { code: "CDF", name: "Congolese Franc", symbol: "FC", decimalDigits: 2 },
  // Americas Currencies
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", decimalDigits: 2 },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "$", decimalDigits: 2 },
  ARS: { code: "ARS", name: "Argentine Peso", symbol: "$", decimalDigits: 2 },
  CLP: { code: "CLP", name: "Chilean Peso", symbol: "$", decimalDigits: 0 },
  COP: { code: "COP", name: "Colombian Peso", symbol: "$", decimalDigits: 2 },
  PEN: { code: "PEN", name: "Peruvian Sol", symbol: "S/", decimalDigits: 2 },
  UYU: { code: "UYU", name: "Uruguayan Peso", symbol: "$U", decimalDigits: 2 },
  PYG: {
    code: "PYG",
    name: "Paraguayan Guarani",
    symbol: "₲",
    decimalDigits: 0
  },
  BOB: {
    code: "BOB",
    name: "Bolivian Boliviano",
    symbol: "Bs.",
    decimalDigits: 2
  },
  VES: {
    code: "VES",
    name: "Venezuelan Bolívar",
    symbol: "Bs.S",
    decimalDigits: 2
  },
  CRC: {
    code: "CRC",
    name: "Costa Rican Colón",
    symbol: "₡",
    decimalDigits: 2
  },
  PAB: {
    code: "PAB",
    name: "Panamanian Balboa",
    symbol: "B/.",
    decimalDigits: 2
  },
  GTQ: {
    code: "GTQ",
    name: "Guatemalan Quetzal",
    symbol: "Q",
    decimalDigits: 2
  },
  HNL: { code: "HNL", name: "Honduran Lempira", symbol: "L", decimalDigits: 2 },
  NIO: {
    code: "NIO",
    name: "Nicaraguan Córdoba",
    symbol: "C$",
    decimalDigits: 2
  },
  SVC: { code: "SVC", name: "Salvadoran Colón", symbol: "₡", decimalDigits: 2 },
  DOP: { code: "DOP", name: "Dominican Peso", symbol: "RD$", decimalDigits: 2 },
  CUP: { code: "CUP", name: "Cuban Peso", symbol: "₱", decimalDigits: 2 },
  HTG: { code: "HTG", name: "Haitian Gourde", symbol: "G", decimalDigits: 2 },
  JMD: { code: "JMD", name: "Jamaican Dollar", symbol: "J$", decimalDigits: 2 },
  TTD: {
    code: "TTD",
    name: "Trinidad & Tobago Dollar",
    symbol: "TT$",
    decimalDigits: 2
  },
  BBD: {
    code: "BBD",
    name: "Barbadian Dollar",
    symbol: "Bds$",
    decimalDigits: 2
  },
  BSD: { code: "BSD", name: "Bahamian Dollar", symbol: "B$", decimalDigits: 2 },
  BZD: { code: "BZD", name: "Belize Dollar", symbol: "BZ$", decimalDigits: 2 },
  GYD: { code: "GYD", name: "Guyanese Dollar", symbol: "G$", decimalDigits: 2 },
  SRD: {
    code: "SRD",
    name: "Surinamese Dollar",
    symbol: "$",
    decimalDigits: 2
  },
  XCD: {
    code: "XCD",
    name: "East Caribbean Dollar",
    symbol: "EC$",
    decimalDigits: 2
  },
  AWG: { code: "AWG", name: "Aruban Florin", symbol: "ƒ", decimalDigits: 2 },
  ANG: {
    code: "ANG",
    name: "Netherlands Antillean Guilder",
    symbol: "ƒ",
    decimalDigits: 2
  },
  KYD: {
    code: "KYD",
    name: "Cayman Islands Dollar",
    symbol: "CI$",
    decimalDigits: 2
  },
  BMD: { code: "BMD", name: "Bermudian Dollar", symbol: "$", decimalDigits: 2 },
  // Oceania Currencies
  FJD: { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", decimalDigits: 2 },
  PGK: {
    code: "PGK",
    name: "Papua New Guinean Kina",
    symbol: "K",
    decimalDigits: 2
  },
  SBD: {
    code: "SBD",
    name: "Solomon Islands Dollar",
    symbol: "SI$",
    decimalDigits: 2
  },
  VUV: { code: "VUV", name: "Vanuatu Vatu", symbol: "VT", decimalDigits: 0 },
  WST: { code: "WST", name: "Samoan Tala", symbol: "WS$", decimalDigits: 2 },
  TOP: { code: "TOP", name: "Tongan Paʻanga", symbol: "T$", decimalDigits: 2 },
  XPF: { code: "XPF", name: "CFP Franc", symbol: "₣", decimalDigits: 0 },
  // Crypto
  BTC: { code: "BTC", name: "Bitcoin", symbol: "₿", decimalDigits: 8 },
  ETH: { code: "ETH", name: "Ethereum", symbol: "Ξ", decimalDigits: 8 }
};
const getCurrencyOptions = () => {
  return Object.values(CURRENCIES).map((currency) => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbol})`
  }));
};
const getCurrency = (code) => {
  return CURRENCIES[code.toUpperCase()];
};
const getCurrencySymbol = (code) => {
  var _a;
  return ((_a = CURRENCIES[code.toUpperCase()]) == null ? void 0 : _a.symbol) || code;
};
function normalizeCurrencyPosition(raw) {
  const p = (raw ?? "before").toString().toLowerCase().trim();
  if (p === "before") {
    return "left_space";
  }
  if (p === "after") {
    return "right_space";
  }
  if (p === "right" || p === "right_space" || p === "left" || p === "left_space") {
    return p;
  }
  return "left_space";
}
function applyCurrencyPosition(formattedAmount, currencySymbol, rawPosition) {
  const mode = normalizeCurrencyPosition(rawPosition);
  switch (mode) {
    case "right":
      return `${formattedAmount}${currencySymbol}`;
    case "right_space":
      return `${formattedAmount} ${currencySymbol}`;
    case "left":
      return `${currencySymbol}${formattedAmount}`;
    case "left_space":
    default:
      return `${currencySymbol} ${formattedAmount}`;
  }
}
function readYatraCurrencyPositionFromWindow() {
  if (typeof window === "undefined") {
    return "before";
  }
  const w = window;
  const pick = (o) => {
    if (!o) {
      return void 0;
    }
    const a = o.currencyPosition;
    const b = o.currency_position;
    if (typeof a === "string" && a !== "") {
      return a;
    }
    if (typeof b === "string" && b !== "") {
      return b;
    }
    return void 0;
  };
  return pick(w.yatraAdmin) ?? pick(w.yatraBookingData) ?? pick(w.yatraTripData) ?? pick(w.yatraAccountPage) ?? "before";
}
function readAdminNumberFormatConfig() {
  if (typeof window === "undefined") {
    return { decimalPlaces: 2, thousandSeparator: ",", decimalSeparator: "." };
  }
  const a = window.yatraAdmin || {};
  const decimals = Number(a.decimalPlaces ?? a.currency_decimals ?? 2) || 2;
  return {
    decimalPlaces: Math.max(0, Math.min(4, decimals)),
    thousandSeparator: typeof a.thousandSeparator === "string" && a.thousandSeparator !== "" ? a.thousandSeparator : ",",
    decimalSeparator: typeof a.decimalSeparator === "string" && a.decimalSeparator !== "" ? a.decimalSeparator : "."
  };
}
function formatYatraMoney(amount, currencyCode, options) {
  const zeroAsUnknown = (options == null ? void 0 : options.zeroAsUnknown) === true;
  const num = Number(amount) || 0;
  if (zeroAsUnknown && num === 0) {
    return __("Contact for pricing", "yatra");
  }
  const { decimalPlaces, thousandSeparator, decimalSeparator } = readAdminNumberFormatConfig();
  const currencyData = getCurrency(currencyCode);
  const decimals = (currencyData == null ? void 0 : currencyData.decimalDigits) !== void 0 ? Math.max(0, Math.min(4, currencyData.decimalDigits)) : decimalPlaces;
  const formattedCore = new Intl.NumberFormat(void 0, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num).replace(/,/g, "TEMP_THOUSAND").replace(/\./g, "TEMP_DECIMAL").replace(/TEMP_THOUSAND/g, thousandSeparator).replace(/TEMP_DECIMAL/g, decimalSeparator);
  const symbol = getCurrencySymbol(currencyCode);
  const position = readYatraCurrencyPositionFromWindow();
  return applyCurrencyPosition(formattedCore, symbol, position);
}
export {
  API_ENDPOINTS as A,
  ToastProvider as T,
  __ as _,
  apiClient as a,
  apiService as b,
  __$1 as c,
  getCurrencyOptions as d,
  ajaxService as e,
  formatYatraMoney as f,
  getCurrencySymbol as g,
  applyCurrencyPosition as h,
  normalizeCurrencyPosition as n,
  readYatraCurrencyPositionFromWindow as r,
  sprintf as s,
  useToast as u,
  wpService as w
};
//# sourceMappingURL=index-eQJQD6Tp.js.map
