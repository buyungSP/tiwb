 /*!
 * Copyright (c) 2021 Momo Bassit.
 * Licensed under the MIT License (MIT)
 * https://github.com/mdbassit/Coloris
 */

(function (window, document, Math) {
  var ctx = document.createElement('canvas').getContext('2d');
  var currentColor = { r: 0, g: 0, b: 0, h: 0, s: 0, v: 0, a: 1 };
  var picker, colorArea, colorAreaDims, colorMarker, colorPreview, colorValue, clearButton,
  hueSlider, hueMarker, alphaSlider, alphaMarker, currentEl, currentFormat, oldColor;

  // Default settings
  var settings = {
    el: '[data-coloris]',
    parent: null,
    wrap: true,
    alpha: true,
  };



  /**
   * Configure the color picker.
   * @param {object} options Configuration options.
   */
  function configure(options) {
    if (typeof options !== 'object') {
      return;
    }

    for (var key in options) {
      switch (key) {
        case 'el':
          bindFields('.coloris');
          if (options.wrap !== false) {
            wrapFields(options.el);
          }
          break;
        case 'parent':
          settings.parent = document.querySelector(options.parent);
          if (settings.parent) {
            settings.parent.appendChild(picker);
          }
          break;
        case 'wrap':
          if (options.el && options.wrap) {
            wrapFields(options.el);
          }
          break;
        case 'alpha':
          settings.alpha = !!options.alpha;
          picker.setAttribute('data-alpha', settings.alpha);
          break;
        default:
          settings[key] = options[key];}

    }
  }

  /**
   * Bind the color picker to input fields that match the selector.
   * @param {string} selector One or more selectors pointing to input fields.
   */
  function bindFields(selector) {
    // Show the color picker on click on the input fields that match the selector
    addListener(document, 'click', selector, function (event) {
      var parent = settings.parent;
      var coords = event.target.getBoundingClientRect();
      var scrollY = window.scrollY;
      var reposition = { left: false, top: false };
      var offset = { x: 0, y: 0 };
      var left = coords.x;
      var top = scrollY + coords.y + coords.height + settings.margin;

      currentEl = event.target;
      oldColor = currentEl.value;
      currentFormat = 'hex'
      picker.classList.add('clr-open');

      var pickerWidth = picker.offsetWidth;
      var pickerHeight = picker.offsetHeight;

      // If the color picker is inside a custom container
      // set the position relative to it
      if (parent) {
        var style = window.getComputedStyle(parent);
        var marginTop = parseFloat(style.marginTop);
        var borderTop = parseFloat(style.borderTopWidth);

        offset = parent.getBoundingClientRect();
        offset.y += borderTop + scrollY;
        left -= offset.x;
        top -= offset.y;

        if (left + pickerWidth > parent.clientWidth) {
          left += coords.width - pickerWidth;
          reposition.left = true;
        }

        if (top + pickerHeight > parent.clientHeight - marginTop) {
          top -= coords.height + pickerHeight + settings.margin * 2;
          reposition.top = true;
        }

        top += parent.scrollTop;

        // Otherwise set the position relative to the whole document
      } else {
        if (left + pickerWidth > document.documentElement.clientWidth) {
          left += coords.width - pickerWidth;
          reposition.left = true;
        }

        if (top + pickerHeight - scrollY > document.documentElement.clientHeight) {
          top = scrollY + coords.y - pickerHeight - settings.margin;
          reposition.top = true;
        }
      }

      picker.classList.toggle('clr-left', reposition.left);
      picker.classList.toggle('clr-top', reposition.top);
      picker.style.left = left + "px";
      picker.style.top = top + "px";
      colorAreaDims = {
        width: colorArea.offsetWidth,
        height: colorArea.offsetHeight,
        x: picker.offsetLeft + colorArea.offsetLeft + offset.x,
        y: picker.offsetTop + colorArea.offsetTop + offset.y };


      setColorFromStr(oldColor);

    });
  }

  /**
   * Wrap the linked input fields in a div that adds a color preview.
   * @param {string} selector One or more selectors pointing to input fields.
   */
  function wrapFields(selector) {
    document.querySelectorAll(selector).forEach(function (field) {
      var parentNode = field.parentNode;
      if (!parentNode.classList.contains('clr-field')) {
        var wrapper = document.createElement('div');
        parentNode.insertBefore(wrapper, field);
        wrapper.className = 'clr-field'
        wrapper.appendChild(field);
      }
    });
  }

  /**
   * Close the color picker.
   * @param {boolean} [revert] If true, revert the color to the original value.
   */
  function closePicker(revert) {
    if (currentEl) {
      // Revert the color to the original value if needed
      if (revert && oldColor !== currentEl.value) {
        currentEl.value = oldColor;

        // Trigger an "input" event to force update the thumbnail next to the input field
        currentEl.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (oldColor !== currentEl.value) {
        currentEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      picker.classList.remove('clr-open');

      if (settings.focusInput) {
        currentEl.focus({ preventScroll: true });
      }

      currentEl = null;
    }
  }

  /**
   * Set the active color from a string.
   * @param {string} str String representing a color.
   */
  function setColorFromStr(str) {
    var rgba = strToRGBA(str);
    var hsva = RGBAtoHSVA(rgba);

    updateColor(rgba, hsva);

    // Update the UI
    hueSlider.value = hsva.h;
    picker.style.color = "hsl(" + hsva.h + ", 100%, 50%)";
    hueMarker.style.left = hsva.h / 360 * 100 + "%";

    colorMarker.style.left = colorAreaDims.width * hsva.s / 100 + "px";
    colorMarker.style.top = colorAreaDims.height - colorAreaDims.height * hsva.v / 100 + "px";

    alphaSlider.value = hsva.a * 100;
    alphaMarker.style.left = hsva.a * 100 + "%";
  }

  /**
   * Copy the active color to the linked input field.
   * @param {number} [color] Color value to override the active color.
   */
  function pickColor(color) {
    if (currentEl) {
      currentEl.value = color
      currentEl.style.backgroundColor = color
    }
  }

  /**
   * Set the active color based on a specific point in the color gradient.
   * @param {number} x Left position.
   * @param {number} y Top position.
   */
  function setColorAtPosition(x, y) {
    var hsva = {
      h: hueSlider.value * 1,
      s: x / colorAreaDims.width * 100,
      v: 100 - y / colorAreaDims.height * 100,
      a: alphaSlider.value / 100 };

    var rgba = HSVAtoRGBA(hsva);

    updateColor(rgba, hsva);
  }
  /**
   * Move the color marker when dragged.
   * @param {object} event The MouseEvent object.
   */
  function moveMarker(event) {
    var pointer = {
      pageX: event.changedTouches ? event.changedTouches[0].pageX : event.pageX,
      pageY: event.changedTouches ? event.changedTouches[0].pageY : event.pageY 
    };
    var x = pointer.pageX - colorAreaDims.x;
    var y = pointer.pageY - colorAreaDims.y;

    if (settings.parent) {
      y += settings.parent.scrollTop;
    }

    x = x < 0 ? 0 : x > colorAreaDims.width ? colorAreaDims.width : x;
    y = y < 0 ? 0 : y > colorAreaDims.height ? colorAreaDims.height : y;

    colorMarker.style.left = x + "px";
    colorMarker.style.top = y + "px";

    setColorAtPosition(x, y);

    // Prevent scrolling while dragging the marker
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Update the color picker's input field and preview thumb.
   * @param {Object} rgba Red, green, blue and alpha values.
   * @param {Object} [hsva] Hue, saturation, value and alpha values.
   */
  function updateColor(rgba, hsva) {if (rgba === void 0) {rgba = {};}if (hsva === void 0) {hsva = {};}

    for (var key in rgba) {
      currentColor[key] = rgba[key];
    }

    for (var _key in hsva) {
      currentColor[_key] = hsva[_key];
    }

    var hex = RGBAToHex(currentColor);
    var opaqueHex = hex.substring(0, 7);

    colorMarker.style.color = opaqueHex;
    alphaMarker.parentNode.style.color = opaqueHex;
    alphaMarker.style.color = hex;
    colorPreview.style.backgroundColor = hex;

    // Force repaint the color and alpha gradients as a workaround for a Google Chrome bug
    colorArea.style.display = 'none';
    colorArea.offsetHeight;
    colorArea.style.display = '';
    alphaMarker.nextElementSibling.style.display = 'none';
    alphaMarker.nextElementSibling.offsetHeight;
    alphaMarker.nextElementSibling.style.display = '';
    pickColor(hex)
    // Select the current format in the format switcher
  }

  /**
   * Set the hue when its slider is moved.
   */
  function setHue() {
    var hue = hueSlider.value * 1;
    var x = colorMarker.style.left.replace('px', '') * 1;
    var y = colorMarker.style.top.replace('px', '') * 1;

    picker.style.color = "hsl(" + hue + ", 100%, 50%)";
    hueMarker.style.left = hue / 360 * 100 + "%";

    setColorAtPosition(x, y);
  }

  /**
   * Set the alpha when its slider is moved.
   */
  function setAlpha() {
    var alpha = alphaSlider.value / 100;

    alphaMarker.style.left = alpha * 100 + "%";
    updateColor({ a: alpha });
  }

  /**
   * Convert HSVA to RGBA.
   * @param {object} hsva Hue, saturation, value and alpha values.
   * @return {object} Red, green, blue and alpha values.
   */
  function HSVAtoRGBA(hsva) {
    var saturation = hsva.s / 100;
    var value = hsva.v / 100;
    var chroma = saturation * value;
    var hueBy60 = hsva.h / 60;
    var x = chroma * (1 - Math.abs(hueBy60 % 2 - 1));
    var m = value - chroma;

    chroma = chroma + m;
    x = x + m;

    var index = Math.floor(hueBy60) % 6;
    var red = [chroma, x, m, m, x, chroma][index];
    var green = [x, chroma, chroma, x, m, m][index];
    var blue = [m, m, x, chroma, chroma, x][index];

    return {
      r: Math.round(red * 255),
      g: Math.round(green * 255),
      b: Math.round(blue * 255),
      a: hsva.a };

  }

  /**
   * Convert HSVA to HSLA.
   * @param {object} hsva Hue, saturation, value and alpha values.
   * @return {object} Hue, saturation, lightness and alpha values.
   */
  function HSVAtoHSLA(hsva) {
    var value = hsva.v / 100;
    var lightness = value * (1 - hsva.s / 100 / 2);
    var saturation;

    if (lightness > 0 && lightness < 1) {
      saturation = Math.round((value - lightness) / Math.min(lightness, 1 - lightness) * 100);
    }

    return {
      h: hsva.h,
      s: saturation || 0,
      l: Math.round(lightness * 100),
      a: hsva.a };

  }

  /**
   * Convert RGBA to HSVA.
   * @param {object} rgba Red, green, blue and alpha values.
   * @return {object} Hue, saturation, value and alpha values.
   */
  function RGBAtoHSVA(rgba) {
    var red = rgba.r / 255;
    var green = rgba.g / 255;
    var blue = rgba.b / 255;
    var xmax = Math.max(red, green, blue);
    var xmin = Math.min(red, green, blue);
    var chroma = xmax - xmin;
    var value = xmax;
    var hue = 0;
    var saturation = 0;

    if (chroma) {
      if (xmax === red) {hue = (green - blue) / chroma;}
      if (xmax === green) {hue = 2 + (blue - red) / chroma;}
      if (xmax === blue) {hue = 4 + (red - green) / chroma;}
      if (xmax) {saturation = chroma / xmax;}
    }

    hue = Math.floor(hue * 60);

    return {
      h: hue < 0 ? hue + 360 : hue,
      s: Math.round(saturation * 100),
      v: Math.round(value * 100),
      a: rgba.a };

  }

  /**
   * Parse a string to RGBA.
   * @param {string} str String representing a color.
   * @return {object} Red, green, blue and alpha values.
   */
  function strToRGBA(str) {
    var regex = /^((rgba)|rgb)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i;
    var match, rgba;

    // Default to black for invalid color strings
    ctx.fillStyle = '#000';

    // Use canvas to convert the string to a valid color string
    ctx.fillStyle = str;
    match = regex.exec(ctx.fillStyle);

    if (match) {
      rgba = {
        r: match[3] * 1,
        g: match[4] * 1,
        b: match[5] * 1,
        a: match[6] * 1 };


    } else {
      match = ctx.fillStyle.replace('#', '').match(/.{2}/g).map(function (h) {return parseInt(h, 16);});
      rgba = {
        r: match[0],
        g: match[1],
        b: match[2],
        a: 1 };

    }

    return rgba;
  }

  /**
   * Convert RGBA to Hex.
   * @param {object} rgba Red, green, blue and alpha values.
   * @return {string} Hex color string.
   */
  function RGBAToHex(rgba) {
    var R = rgba.r.toString(16);
    var G = rgba.g.toString(16);
    var B = rgba.b.toString(16);
    var A = '';

    if (rgba.r < 16) {
      R = '0' + R;
    }

    if (rgba.g < 16) {
      G = '0' + G;
    }

    if (rgba.b < 16) {
      B = '0' + B;
    }

    if (settings.alpha && rgba.a < 1) {
      var alpha = rgba.a * 255 | 0;
      A = alpha.toString(16);

      if (alpha < 16) {
        A = '0' + A;
      }
    }

    return '#' + R + G + B + A;
  }

  /**
   * Init the color picker.
   */
  function init() {
    // Render the UI
    picker = document.createElement('div');
    picker.id = 'clr-picker';
    picker.className = 'clr-picker';
    picker.innerHTML =
    ("<div id='colorArea' class='clr-gradient' role='application'>") +
    '<div id="colorMarker" class="clr-marker" tabindex="0"></div>' +
    '</div>' +
    '<div class="clr-hue">' + ("<input id='hueSlider' type='range' min='0' max='360' step='1'>") +
    '<div id="hueMarker"></div>' +
    '</div>' +
    '<div class="clr-alpha">' + ("<input id='alphaSlider' type='range' min='0' max='100' step='1'>") +
    '<div id="alphaMarker"></div>' +
    '<span></span>' +
    '</div>' + ("<button id='colorPreview' class='clr-preview'></button>")

    // Append the color picker to the DOM
    document.body.appendChild(picker);

    // Reference the UI elements
    colorArea = document.getElementById('colorArea')
    colorMarker =document.getElementById('colorMarker')
    colorPreview = document.getElementById('colorPreview')
    hueSlider = document.getElementById('hueSlider')
    hueMarker = document.getElementById('hueMarker')
    alphaSlider = document.getElementById('alphaSlider')
    alphaMarker = document.getElementById('alphaMarker')

    // Bind the picker to the default selector
    bindFields(settings.el);
    wrapFields(settings.el);

    addListener(picker, 'mousedown', function (event) {
      picker.classList.remove('clr-keyboard-nav');
      event.stopPropagation();
    });

    addListener(colorArea, 'mousedown', function (event) {
      addListener(document, 'mousemove', moveMarker);
    });

    addListener(colorArea, 'touchstart', function (event) {
      document.addEventListener('touchmove', moveMarker, { passive: false });
    });

    addListener(colorMarker, 'mousedown', function (event) {
      addListener(document, 'mousemove', moveMarker);
    });

    addListener(colorMarker, 'touchstart', function (event) {
      document.addEventListener('touchmove', moveMarker, { passive: false });
    });


    addListener(colorPreview, 'click', function (event) {
      closePicker();
    });

    addListener(picker, 'click', '.clr-swatches button', function (event) {
      setColorFromStr(event.target.textContent);
    });

    addListener(document, 'mouseup', function (event) {
      document.removeEventListener('mousemove', moveMarker);
    });

    addListener(document, 'touchend', function (event) {
      document.removeEventListener('touchmove', moveMarker);
    });

    addListener(document, 'mousedown', function (event) {
      picker.classList.remove('clr-keyboard-nav');
      closePicker();
    });
    addListener(document, 'click', '.clr-field button', function (event) {
      event.target.nextElementSibling.dispatchEvent(new Event('click', { bubbles: true }));
    });

    addListener(colorArea, 'click', moveMarker);
    addListener(hueSlider, 'input', setHue);
    addListener(alphaSlider, 'input', setAlpha);
  }

  /**
   * Shortcut for addEventListener to optimize the minified JS.
   * @param {object} context The context to which the listener is attached.
   * @param {string} type Event type.
   * @param {(string|function)} selector Event target if delegation is used, event handler if not.
   * @param {function} [fn] Event handler if delegation is used.
   */
  function addListener(context, type, selector, fn) {
    var matches = Element.prototype.matches || Element.prototype.msMatchesSelector;

    // Delegate event to the target of the selector
    if (typeof selector === 'string') {
      context.addEventListener(type, function (event) {
        if (matches.call(event.target, selector)) {
          fn.call(event.target, event);
        }
      });

      // If the selector is not a string then it's a function
      // in which case we need regular event listener
    } else {
      fn = selector;
      context.addEventListener(type, fn);
    }
  }

  /**
   * Call a function only when the DOM is ready.
   * @param {function} fn The function to call.
   * @param {array} [args] Arguments to pass to the function.
   */
  function DOMReady(fn, args) {
    args = args !== undefined ? args : [];

    if (document.readyState !== 'loading') {
      fn.apply(void 0, args);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        fn.apply(void 0, args);
      });
    }
  }

  // Polyfill for Nodelist.forEach
  if (NodeList !== undefined && NodeList.prototype && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  // Expose the color picker to the global scope
  window.Coloris = function () {
    var methods = {
      set: configure,
      wrap: wrapFields,
      close: closePicker };


    function Coloris(options) {
      DOMReady(function () {
        if (options) {
          if (typeof options === 'string') {
            bindFields(options);
          } else {
            configure(options);
          }
        }
      });
    }var _loop = function _loop(

    key) {
      Coloris[key] = function () {for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {args[_key2] = arguments[_key2];}
        DOMReady(methods[key], args);
      };};for (var key in methods) {_loop(key);
    }

    return Coloris;
  }();

  // Init the color picker when the DOM is ready
  DOMReady(init);

})(window, document, Math);