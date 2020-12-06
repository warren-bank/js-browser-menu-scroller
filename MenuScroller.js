{
  // --------------------------------------------------------------------------- data structures

  const defaults = {
    bind: {
      options: {
        container:       null,  // Element or Window
        performScroll:   true,
        smoothScroll:    true
      }
    },
    affix: {
      position: 0,
      options: {
        container:       null,  // Element or Window
      }
    }
  }

  const states = {
    bind:  [],
    affix: []
  }

  const scroll_timers = {}  // container (Element or Window) => timeout timer

  let scroll_timers_debounce_ms = 500

  // --------------------------------------------------------------------------- data views

  const filter_states_by_container = (unfiltered_states, container) => {
    if (!(container instanceof Element))
      container = window

    return unfiltered_states.filter(state => (state && (state.options.container === container)))
  }

  const get_bound_states = (container) => filter_states_by_container(states.bind, container)

  const get_affix_states = (container) => filter_states_by_container(states.affix, container)

  // --------------------------------------------------------------------------- helper methods to detect the position of an element relative to its container

  const get_element_style_int = (style, name, default_value=0) => {
    const value = parseInt(style[name], 10)

    return isNaN(value)
      ? default_value
      : value
  }

  // returns a calculated "rect" object
  // when input is a pre-calculated "rect" object, unmodified value is immediately returned
  const get_element_bounding_rect = (element) => {
    if   (element instanceof Window)   return null
    if   (element instanceof Document) return null
    if (!(element instanceof Element)) return element

    const style = getComputedStyle(element)
    const $rect = element.getBoundingClientRect()
    const  rect = {
      top:    $rect.top,
      left:   $rect.left,
      bottom: $rect.bottom,
      right:  $rect.right
    }

    rect.top    += get_element_style_int(style, 'paddingTop',    0)
    rect.left   += get_element_style_int(style, 'paddingLeft',   0)
    rect.bottom -= get_element_style_int(style, 'paddingBottom', 0)
    rect.right  -= get_element_style_int(style, 'paddingRight',  0)

    return rect
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const is_element_fully_visible_in_viewport = (element, container) => {
    const rect_element   = get_element_bounding_rect(element)
    const rect_container = get_element_bounding_rect(container)

    if (!rect_element) return false

    let ok = (
         (rect_element.top    >= 0)
      && (rect_element.bottom <= (window.innerHeight || document.documentElement.clientHeight))
    )

    if (ok && rect_container) {
      ok = (
           (rect_element.top    >= rect_container.top)
        && (rect_element.bottom <= rect_container.bottom)
      )
    }

    return ok
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const is_element_partly_visible_in_viewport = (element, container) => {
    const rect_element   = get_element_bounding_rect(element)
    const rect_container = get_element_bounding_rect(container)

    if (!rect_element) return false

    let ok = (
         (rect_element.top    < 0)
      && (rect_element.bottom > 0)
    ) || (
         (rect_element.top    < (window.innerHeight || document.documentElement.clientHeight))
      && (rect_element.bottom > (window.innerHeight || document.documentElement.clientHeight))
    )

    if (rect_container) {
      ok = ok || (
           (rect_element.top    >= 0)
        && (rect_element.bottom <= (window.innerHeight || document.documentElement.clientHeight))
      )

      ok = ok && (
           (rect_element.top    < rect_container.top)
        && (rect_element.bottom > rect_container.top)
      ) || (
           (rect_element.top    < rect_container.bottom)
        && (rect_element.bottom > rect_container.bottom)
      )
    }

    return ok
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const is_element_above_viewport = (element) => {
    const rect_element = get_element_bounding_rect(element)

    if (!rect_element) return false

    return (
         (rect_element.top    < 0)
      && (rect_element.bottom < 0)
    )
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const is_element_below_viewport = (element) => {
    const rect_element = get_element_bounding_rect(element)

    if (!rect_element) return false

    return (
         (rect_element.top    > (window.innerHeight || document.documentElement.clientHeight))
      && (rect_element.bottom > (window.innerHeight || document.documentElement.clientHeight))
    )
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const is_element_above_container = (element, container) => {
    const rect_element   = get_element_bounding_rect(element)
    const rect_container = get_element_bounding_rect(container)

    if (!rect_element || !rect_container) return false

    return (
         (rect_element.top    < rect_container.top)
      && (rect_element.bottom < rect_container.top)
    )
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const is_element_below_container = (element, container) => {
    const rect_element   = get_element_bounding_rect(element)
    const rect_container = get_element_bounding_rect(container)

    if (!rect_element || !rect_container) return false

    return (
         (rect_element.top    > rect_container.bottom)
      && (rect_element.bottom > rect_container.bottom)
    )
  }

  // input can either be DOM elements, or pre-calculated "rect" objects
  const get_element_position_relative_to_container = (element, container) => {
    const rect_element   = get_element_bounding_rect(element)
    const rect_container = get_element_bounding_rect(container)

    const result = {
      fully_visible:   false,
      partly_visible:  false,
      above_viewport:  false,
      below_viewport:  false,
      above_container: false,
      below_container: false
    }

    if (is_element_fully_visible_in_viewport(rect_element, rect_container)) {
      result.fully_visible = true
      return result
    }

    if (is_element_partly_visible_in_viewport(rect_element, rect_container)) {
      result.partly_visible = true
      return result
    }

    if (is_element_above_viewport(rect_element)) {
      result.above_viewport = true
      return result
    }

    if (is_element_below_viewport(rect_element)) {
      result.below_viewport = true
      return result
    }

    if (is_element_above_container(rect_element, rect_container)) {
      result.above_container = true
      return result
    }

    if (is_element_below_container(rect_element, rect_container)) {
      result.below_container = true
      return result
    }

    return result
  }

  // --------------------------------------------------------------------------- scroll event handler (reused by all containers)

  const process_bound_scrollEvent = (state) => {
    const {menuElements, markerElements, cssClass, options} = state

    let active_marker = 0

    for (let i=0; i < markerElements.length; i++) {
      const marker = markerElements[i]

      const {
        above_viewport,
        above_container,
        partly_visible,
        fully_visible
      } = get_element_position_relative_to_container(marker, options.container)

      const active = (above_viewport || above_container || partly_visible || fully_visible)

      if (active)
        active_marker = i
    }

    for (let i=0; i < menuElements.length; i++) {
      const menuitem = menuElements[i]
      const hasClass = menuitem.classList.contains(cssClass)

      if (hasClass && (i !== active_marker))
        menuitem.classList.remove(cssClass)
      else if (!hasClass && (i === active_marker))
        menuitem.classList.add(cssClass)
    }
  }

  const process_affix_scrollEvent = (state) => {
    const {menu, position, options} = state

    let scrollTop = (options.container === window)
      ? (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop)
      : (options.container.scrollTop)

    if ((typeof scrollTop !== 'number') || isNaN(scrollTop))
      return

    scrollTop += position

    menu.style.position = 'relative'
    menu.style.top      = `${scrollTop}px`
  }

  const scrollEventHandler = (container) => {
    if (!(container instanceof Element))
      container = window

    const bound_states = get_bound_states(container)
    bound_states.forEach(process_bound_scrollEvent)

    const affix_states = get_affix_states(container)
    affix_states.forEach(process_affix_scrollEvent)
  }

  const scrollEventDebouncer = (event) => {
    let container = event.target

    if (!(container instanceof Element))
      container = window

    if (scroll_timers[container]) return

    scroll_timers[container] = setTimeout(() => {
      scrollEventHandler(container)

      scroll_timers[container] = null
    }, scroll_timers_debounce_ms)
  }

  const countScrollEventListeners = (container) => {
    return get_bound_states(container).length + get_affix_states(container).length
  }

  // important: call BEFORE adding to global state
  const addScrollEventListener = (container) => {
    if (countScrollEventListeners(container) > 0)
      return

    if (!(container instanceof Element))
      container = document

    container.addEventListener('scroll', scrollEventDebouncer)
  }

  // important: call AFTER adding to global state
  const removeScrollEventListener = (container) => {
    if (countScrollEventListeners(container) > 0)
      return

    if (!(container instanceof Element))
      container = document

    container.removeEventListener('scroll', scrollEventDebouncer)
  }

  // --------------------------------------------------------------------------- click event handler (reused by all menuElements)

  const find_menuitem_match = (menuitem) => {
    let match

    for (let i=0; i < states.bind.length; i++) {
      const state = states.bind[i]

      if (!state)
        continue

      if (!state.options.performScroll)
        continue

      const index = state.menuElements.indexOf(menuitem)

      if (index === -1)
        continue

      match = {state, index}
      break
    }

    return match
  }

  const find_menuitem_marker = (match) => {
    return (match)
      ? match.state.markerElements[match.index]
      : null
  }

  const clickEventHandler = (event) => {
    const menuitem = event.target

    if (!(menuitem instanceof Element))
      return

    const match  = find_menuitem_match(menuitem)
    const marker = find_menuitem_marker(match)

    if (!marker)
      return

    marker.scrollIntoView({
      block:    'start',
      behavior: (match.state.options.smoothScroll) ? 'smooth' : 'auto'
    })
  }

  const addClickEventListener = (menuElements, options) => {
    if (!options.performScroll)
      return

    menuElements.forEach(menuitem => {
      menuitem.addEventListener('click', clickEventHandler)
    })
  }

  const removeClickEventListener = (menuElements, options) => {
    if (!options.performScroll)
      return

    menuElements.forEach(menuitem => {
      menuitem.removeEventListener('click', clickEventHandler)
    })
  }

  // --------------------------------------------------------------------------- public API (private)

  // return id
  const bind = (menuElements, markerElements, cssClass, options={}) => {
    // resolve CSS selectors
    if (typeof menuElements === 'string')
      menuElements = [...document.querySelectorAll(menuElements)]
    if (typeof markerElements === 'string')
      markerElements = [...document.querySelectorAll(markerElements)]

    // validate array lengths
    if (!Array.isArray(menuElements) || !menuElements.length)
      throw new Error('invalid input: menuElements')
    if (!Array.isArray(markerElements) || !markerElements.length)
      throw new Error('invalid input: markerElements')
    if (menuElements.length !== markerElements.length)
      throw new Error('invalid input: menuElements and markerElements array lengths differ')

    // validate css class
    if (!cssClass || (typeof cssClass !== 'string'))
      throw new Error('invalid input: cssClass')

    const state = {
      menuElements,
      markerElements,
      cssClass,
      options: {...defaults.bind.options, ...options}
    }

    if (!(state.options.container instanceof Element))
      state.options.container = window

    addScrollEventListener(state.options.container)
    addClickEventListener(state.menuElements, state.options)

    const id = states.bind.length
    states.bind.push(state)

    return id
  }

  const unbind = (id) => {
    if (states.bind.length > id) {
      const state = states.bind[id]

      if (state) {
        states.bind[id] = null

        removeScrollEventListener(state.options.container)
        removeClickEventListener(state.menuElements, state.options)
      }
    }

    return null
  }

  // return id
  const affix = (menu, position, options={}) => {
    // resolve CSS selectors
    if (typeof menu === 'string')
      menu = document.querySelector(menu)

    // validate menu
    if (!(menu instanceof Element))
      throw new Error('invalid input: menu')

    const state = {
      menu,
      position: ((typeof position === 'number') && (position >= 0)) ? position : defaults.affix.position,
      options:  {...defaults.affix.options, ...options}
    }

    if (!(state.options.container instanceof Element))
      state.options.container = window

    addScrollEventListener(state.options.container)

    const id = states.affix.length
    states.affix.push(state)

    return id
  }

  const unaffix = (id) => {
    if (states.affix.length > id) {
      const state = states.affix[id]

      if (state) {
        states.affix[id] = null

        removeScrollEventListener(state.options.container)
      }
    }

    return null
  }

  const debounce = (debounce_ms) => {
    if ((typeof debounce_ms === 'number') && (debounce_ms >= 0))
      scroll_timers_debounce_ms = debounce_ms
  }

  // --------------------------------------------------------------------------- public API (public)

  window.MenuScroller = {
    bind,
    unbind,
    affix,
    unaffix,
    debounce
  }

  // ---------------------------------------------------------------------------
}
