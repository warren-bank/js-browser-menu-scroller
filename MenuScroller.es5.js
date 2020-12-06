;

(function () {
  "use strict";

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
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
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  {
    // --------------------------------------------------------------------------- data structures
    var defaults = {
      bind: {
        options: {
          container: null,
          // Element or Window
          performScroll: true,
          smoothScroll: true
        }
      },
      affix: {
        position: 0,
        options: {
          container: null // Element or Window

        }
      }
    };
    var states = {
      bind: [],
      affix: []
    };
    var scroll_timers = {}; // container (Element or Window) => timeout timer

    var scroll_timers_debounce_ms = 500; // --------------------------------------------------------------------------- data views

    var filter_states_by_container = function filter_states_by_container(unfiltered_states, container) {
      if (!(container instanceof Element)) container = window;
      return unfiltered_states.filter(function (state) {
        return state && state.options.container === container;
      });
    };

    var get_bound_states = function get_bound_states(container) {
      return filter_states_by_container(states.bind, container);
    };

    var get_affix_states = function get_affix_states(container) {
      return filter_states_by_container(states.affix, container);
    }; // --------------------------------------------------------------------------- helper methods to detect the position of an element relative to its container


    var get_element_style_int = function get_element_style_int(style, name) {
      var default_value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var value = parseInt(style[name], 10);
      return isNaN(value) ? default_value : value;
    }; // returns a calculated "rect" object
    // when input is a pre-calculated "rect" object, unmodified value is immediately returned


    var get_element_bounding_rect = function get_element_bounding_rect(element) {
      if (element instanceof Window) return null;
      if (element instanceof Document) return null;
      if (!(element instanceof Element)) return element;
      var style = getComputedStyle(element);
      var $rect = element.getBoundingClientRect();
      var rect = {
        top: $rect.top,
        left: $rect.left,
        bottom: $rect.bottom,
        right: $rect.right
      };
      rect.top += get_element_style_int(style, 'paddingTop', 0);
      rect.left += get_element_style_int(style, 'paddingLeft', 0);
      rect.bottom -= get_element_style_int(style, 'paddingBottom', 0);
      rect.right -= get_element_style_int(style, 'paddingRight', 0);
      return rect;
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var is_element_fully_visible_in_viewport = function is_element_fully_visible_in_viewport(element, container) {
      var rect_element = get_element_bounding_rect(element);
      var rect_container = get_element_bounding_rect(container);
      if (!rect_element) return false;
      var ok = rect_element.top >= 0 && rect_element.bottom <= (window.innerHeight || document.documentElement.clientHeight);

      if (ok && rect_container) {
        ok = rect_element.top >= rect_container.top && rect_element.bottom <= rect_container.bottom;
      }

      return ok;
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var is_element_partly_visible_in_viewport = function is_element_partly_visible_in_viewport(element, container) {
      var rect_element = get_element_bounding_rect(element);
      var rect_container = get_element_bounding_rect(container);
      if (!rect_element) return false;
      var ok = rect_element.top < 0 && rect_element.bottom > 0 || rect_element.top < (window.innerHeight || document.documentElement.clientHeight) && rect_element.bottom > (window.innerHeight || document.documentElement.clientHeight);

      if (rect_container) {
        ok = ok || rect_element.top >= 0 && rect_element.bottom <= (window.innerHeight || document.documentElement.clientHeight);
        ok = ok && rect_element.top < rect_container.top && rect_element.bottom > rect_container.top || rect_element.top < rect_container.bottom && rect_element.bottom > rect_container.bottom;
      }

      return ok;
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var is_element_above_viewport = function is_element_above_viewport(element) {
      var rect_element = get_element_bounding_rect(element);
      if (!rect_element) return false;
      return rect_element.top < 0 && rect_element.bottom < 0;
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var is_element_below_viewport = function is_element_below_viewport(element) {
      var rect_element = get_element_bounding_rect(element);
      if (!rect_element) return false;
      return rect_element.top > (window.innerHeight || document.documentElement.clientHeight) && rect_element.bottom > (window.innerHeight || document.documentElement.clientHeight);
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var is_element_above_container = function is_element_above_container(element, container) {
      var rect_element = get_element_bounding_rect(element);
      var rect_container = get_element_bounding_rect(container);
      if (!rect_element || !rect_container) return false;
      return rect_element.top < rect_container.top && rect_element.bottom < rect_container.top;
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var is_element_below_container = function is_element_below_container(element, container) {
      var rect_element = get_element_bounding_rect(element);
      var rect_container = get_element_bounding_rect(container);
      if (!rect_element || !rect_container) return false;
      return rect_element.top > rect_container.bottom && rect_element.bottom > rect_container.bottom;
    }; // input can either be DOM elements, or pre-calculated "rect" objects


    var get_element_position_relative_to_container = function get_element_position_relative_to_container(element, container) {
      var rect_element = get_element_bounding_rect(element);
      var rect_container = get_element_bounding_rect(container);
      var result = {
        fully_visible: false,
        partly_visible: false,
        above_viewport: false,
        below_viewport: false,
        above_container: false,
        below_container: false
      };

      if (is_element_fully_visible_in_viewport(rect_element, rect_container)) {
        result.fully_visible = true;
        return result;
      }

      if (is_element_partly_visible_in_viewport(rect_element, rect_container)) {
        result.partly_visible = true;
        return result;
      }

      if (is_element_above_viewport(rect_element)) {
        result.above_viewport = true;
        return result;
      }

      if (is_element_below_viewport(rect_element)) {
        result.below_viewport = true;
        return result;
      }

      if (is_element_above_container(rect_element, rect_container)) {
        result.above_container = true;
        return result;
      }

      if (is_element_below_container(rect_element, rect_container)) {
        result.below_container = true;
        return result;
      }

      return result;
    }; // --------------------------------------------------------------------------- scroll event handler (reused by all containers)


    var process_bound_scrollEvent = function process_bound_scrollEvent(state) {
      var menuElements = state.menuElements,
          markerElements = state.markerElements,
          cssClass = state.cssClass,
          options = state.options;
      var active_marker = 0;

      for (var i = 0; i < markerElements.length; i++) {
        var marker = markerElements[i];

        var _get_element_position = get_element_position_relative_to_container(marker, options.container),
            above_viewport = _get_element_position.above_viewport,
            above_container = _get_element_position.above_container,
            partly_visible = _get_element_position.partly_visible,
            fully_visible = _get_element_position.fully_visible;

        var active = above_viewport || above_container || partly_visible || fully_visible;
        if (active) active_marker = i;
      }

      for (var _i = 0; _i < menuElements.length; _i++) {
        var menuitem = menuElements[_i];
        var hasClass = menuitem.classList.contains(cssClass);
        if (hasClass && _i !== active_marker) menuitem.classList.remove(cssClass);else if (!hasClass && _i === active_marker) menuitem.classList.add(cssClass);
      }
    };

    var process_affix_scrollEvent = function process_affix_scrollEvent(state) {
      var menu = state.menu,
          position = state.position,
          options = state.options;
      var scrollTop = options.container === window ? window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop : options.container.scrollTop;
      if (typeof scrollTop !== 'number' || isNaN(scrollTop)) return;
      scrollTop += position;
      menu.style.position = 'relative';
      menu.style.top = "".concat(scrollTop, "px");
    };

    var scrollEventHandler = function scrollEventHandler(container) {
      if (!(container instanceof Element)) container = window;
      var bound_states = get_bound_states(container);
      bound_states.forEach(process_bound_scrollEvent);
      var affix_states = get_affix_states(container);
      affix_states.forEach(process_affix_scrollEvent);
    };

    var scrollEventDebouncer = function scrollEventDebouncer(event) {
      var container = event.target;
      if (!(container instanceof Element)) container = window;
      if (scroll_timers[container]) return;
      scroll_timers[container] = setTimeout(function () {
        scrollEventHandler(container);
        scroll_timers[container] = null;
      }, scroll_timers_debounce_ms);
    };

    var countScrollEventListeners = function countScrollEventListeners(container) {
      return get_bound_states(container).length + get_affix_states(container).length;
    }; // important: call BEFORE adding to global state


    var addScrollEventListener = function addScrollEventListener(container) {
      if (countScrollEventListeners(container) > 0) return;
      if (!(container instanceof Element)) container = document;
      container.addEventListener('scroll', scrollEventDebouncer);
    }; // important: call AFTER adding to global state


    var removeScrollEventListener = function removeScrollEventListener(container) {
      if (countScrollEventListeners(container) > 0) return;
      if (!(container instanceof Element)) container = document;
      container.removeEventListener('scroll', scrollEventDebouncer);
    }; // --------------------------------------------------------------------------- click event handler (reused by all menuElements)


    var find_menuitem_match = function find_menuitem_match(menuitem) {
      var match;

      for (var i = 0; i < states.bind.length; i++) {
        var state = states.bind[i];
        if (!state) continue;
        if (!state.options.performScroll) continue;
        var index = state.menuElements.indexOf(menuitem);
        if (index === -1) continue;
        match = {
          state: state,
          index: index
        };
        break;
      }

      return match;
    };

    var find_menuitem_marker = function find_menuitem_marker(match) {
      return match ? match.state.markerElements[match.index] : null;
    };

    var clickEventHandler = function clickEventHandler(event) {
      var menuitem = event.target;
      if (!(menuitem instanceof Element)) return;
      var match = find_menuitem_match(menuitem);
      var marker = find_menuitem_marker(match);
      if (!marker) return;
      marker.scrollIntoView({
        block: 'start',
        behavior: match.state.options.smoothScroll ? 'smooth' : 'auto'
      });
    };

    var addClickEventListener = function addClickEventListener(menuElements, options) {
      if (!options.performScroll) return;
      menuElements.forEach(function (menuitem) {
        menuitem.addEventListener('click', clickEventHandler);
      });
    };

    var removeClickEventListener = function removeClickEventListener(menuElements, options) {
      if (!options.performScroll) return;
      menuElements.forEach(function (menuitem) {
        menuitem.removeEventListener('click', clickEventHandler);
      });
    }; // --------------------------------------------------------------------------- public API (private)
    // return id


    var bind = function bind(menuElements, markerElements, cssClass) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      // resolve CSS selectors
      if (typeof menuElements === 'string') menuElements = _toConsumableArray(document.querySelectorAll(menuElements));
      if (typeof markerElements === 'string') markerElements = _toConsumableArray(document.querySelectorAll(markerElements)); // validate array lengths

      if (!Array.isArray(menuElements) || !menuElements.length) throw new Error('invalid input: menuElements');
      if (!Array.isArray(markerElements) || !markerElements.length) throw new Error('invalid input: markerElements');
      if (menuElements.length !== markerElements.length) throw new Error('invalid input: menuElements and markerElements array lengths differ'); // validate css class

      if (!cssClass || typeof cssClass !== 'string') throw new Error('invalid input: cssClass');
      var state = {
        menuElements: menuElements,
        markerElements: markerElements,
        cssClass: cssClass,
        options: _objectSpread(_objectSpread({}, defaults.bind.options), options)
      };
      if (!(state.options.container instanceof Element)) state.options.container = window;
      addScrollEventListener(state.options.container);
      addClickEventListener(state.menuElements, state.options);
      var id = states.bind.length;
      states.bind.push(state);
      return id;
    };

    var unbind = function unbind(id) {
      if (states.bind.length > id) {
        var state = states.bind[id];

        if (state) {
          states.bind[id] = null;
          removeScrollEventListener(state.options.container);
          removeClickEventListener(state.menuElements, state.options);
        }
      }

      return null;
    }; // return id


    var affix = function affix(menu, position) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      // resolve CSS selectors
      if (typeof menu === 'string') menu = document.querySelector(menu); // validate menu

      if (!(menu instanceof Element)) throw new Error('invalid input: menu');
      var state = {
        menu: menu,
        position: typeof position === 'number' && position >= 0 ? position : defaults.affix.position,
        options: _objectSpread(_objectSpread({}, defaults.affix.options), options)
      };
      if (!(state.options.container instanceof Element)) state.options.container = window;
      addScrollEventListener(state.options.container);
      var id = states.affix.length;
      states.affix.push(state);
      return id;
    };

    var unaffix = function unaffix(id) {
      if (states.affix.length > id) {
        var state = states.affix[id];

        if (state) {
          states.affix[id] = null;
          removeScrollEventListener(state.options.container);
        }
      }

      return null;
    };

    var debounce = function debounce(debounce_ms) {
      if (typeof debounce_ms === 'number' && debounce_ms >= 0) scroll_timers_debounce_ms = debounce_ms;
    }; // --------------------------------------------------------------------------- public API (public)


    window.MenuScroller = {
      bind: bind,
      unbind: unbind,
      affix: affix,
      unaffix: unaffix,
      debounce: debounce
    }; // ---------------------------------------------------------------------------
  }
})();

//# sourceMappingURL=MenuScroller.es5.js.map