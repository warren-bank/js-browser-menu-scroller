### [MenuScroller](https://github.com/warren-bank/js-browser-menu-scroller)

Small javascript library to perform two-way binding between vertical scrolling in a web browser and navigation menus.

#### Demos:

1. Basic Demo
   * [ES6](http://warren-bank.github.io/js-browser-menu-scroller/demos/1-basic/index.html)
     * [source](https://github.com/warren-bank/js-browser-menu-scroller/blob/gh-pages/demos/1-basic/index.html)
   * [ES5](http://warren-bank.github.io/js-browser-menu-scroller/demos/1-basic/index.es5.html)

#### Usage:

_CDNs:_

* Github Pages
  * [ES6](http://warren-bank.github.io/js-browser-menu-scroller/MenuScroller.js)
  * [ES5 w/ sourcemap](http://warren-bank.github.io/js-browser-menu-scroller/MenuScroller.es5.js)
* jsDelivr
  * [ES6](https://cdn.jsdelivr.net/gh/warren-bank/js-browser-menu-scroller/MenuScroller.js)
  * [ES6 minified w/ sourcemap](https://cdn.jsdelivr.net/gh/warren-bank/js-browser-menu-scroller/MenuScroller.min.js)
  * [ES5 w/ sourcemap](https://cdn.jsdelivr.net/gh/warren-bank/js-browser-menu-scroller/MenuScroller.es5.js)
  * [ES5 minified w/ sourcemap](https://cdn.jsdelivr.net/gh/warren-bank/js-browser-menu-scroller/MenuScroller.es5.min.js)

_API:_

* `window.MenuScroller.bind(menuElements, markerElements, cssClass, options)`
  * description:
    * bind vertical scrolling (past DOM markers) to menu item CSS classes
    * bind clicking on menu items to automatically scroll to the corresponding DOM marker
  * input parameters:
    * `menuElements`
      * [required]
      * type is either:
        * array of [_HTMLElement_](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
        * string CSS selector
    * `markerElements`
      * [required]
      * type is either:
        * array of [_HTMLElement_](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
        * string CSS selector
    * `cssClass`
      * [required] string
      * CSS class for the active _menuElement_
    * `options`
      * [optional] object
      * [optional] keys:
        * `container`
          * [_Element_](https://developer.mozilla.org/en-US/docs/Web/API/Element)
          * scrollable DOM block element
          * contains all `markerElements`
          * default:
            * event listener added to: `document`
            * scrolling performed on: `window`
        * `performScroll`
          * boolean
          * if true:
            * adds _click_ handler to each _menuElement_
            * click causes container to scroll to the corresponding _markerElement_
          * if false:
            * no _click_ handler is added
          * default: true
        * `smoothScroll`
          * boolean
          * modifies behavior of `performScroll`
          * if true:
            * click causes container to scroll with a smooth animation
          * if false:
            * click causes container to scroll with a single jump
          * default: true
  * pre-conditions:
    * `menuElements` and `markerElements` must resolve to arrays having the same length
  * return value:
    * integer `id`
      * used to subsequently `unbind` this call

* `window.MenuScroller.unbind(id)`
  * description:
    * remove a previous call to `bind`
  * input parameters:
    * `id`
      * [required] integer
  * return value:
    * null

* `window.MenuScroller.affix(menu, position, options)`
  * description:
    * bind vertical scrolling to emulate fixed position of `menu` DOM element
  * input parameters:
    * `menu`
      * [required]
      * type is either:
        * [_HTMLElement_](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
        * string CSS selector
    * `position`
      * [optional] non-negative integer
      * number of pixels at which to affix `menu` from the visible top of its `container`
      * default: 0
    * `options`
      * [optional] object
      * [optional] keys:
        * `container`
          * [_Element_](https://developer.mozilla.org/en-US/docs/Web/API/Element)
          * scrollable DOM block element w/ relative or absolute position and initializes a new [stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)
          * default:
            * event listener added to: `document`
            * position of `menu` is calculated relative to: `document`
  * return value:
    * integer `id`
      * used to subsequently `unaffix` this call

* `window.MenuScroller.unaffix(id)`
  * description:
    * remove a previous call to `affix`
  * input parameters:
    * `id`
      * [required] integer
  * return value:
    * null

* `window.MenuScroller.debounce(debounce_ms)`
  * description:
    * changes the minimum period of time between processing _scroll_ events
      * trade-off between a more responsive webpage and the amount of processing performed
      * larger value:
        * less responsive to user interaction
        * less processing performed
      * smaller value:
        * more responsive to user interaction
        * more processing performed
  * input parameters:
    * `debounce_ms`
      * [required] non-negative integer
      * measured in milliseconds
      * default: 500
        * half of a second

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
