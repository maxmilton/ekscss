/**
 * CSS TRIANGLE MAKER
 *
 * Generates a triangle using the border technique. By default it will output
 * styles for use inline inside a rule targeting an existing element.
 *
 * Alternatively it can output styles for a pseudo element for easy use without
 * interfering with the document flow.
 *
 * USAGE:
 *   @include triangle(<size>, <color>, [side], [isPseudo]);
 *
 *   <side>     = one of: top, right, bottom, left
 *   <size>     = any CSS size with unit, e.g. 0.5rem or 8px
 *   [color]    = any CSS color, e.g. red, #f00, rgba(255, 0, 0, 0.5)
 *   [pseudo] = if true will output as a pseudo element (optional)
 */

/**
 * XCSS mixin to draw a triangle.
 *
 * Generates a triangle using the border technique. By default it will output
 * styles for use inline inside a rule targeting an existing element.
 *
 * Alternatively it can output styles for a pseudo element for easy use without
 * interfering with the document flow.
 *
 * @param {string} size - Size including unit, e.g. `0.5rem` or `8px`.
 * @param {string} color - A CSS color, e.g. `red`, `#f00`, `rgba(255, 0, 0, 0.5)`.
 * @param {'top' | 'right' | 'bottom' | 'left'} [side]
 * @param {boolean} [pseudo]
 * @return {string}
 */
function triangle(size, color = 'inherit', side = 'bottom', pseudo = false) {
  let output = `
    width: 0;
    height: 0;
  `;

  if (pseudo) {
    output += `
      ${side}: -${size};

      position: absolute;
      display: block;
      content: '';
    `;

    switch (side) {
      case 'top':
        output += `left: calc(50% - ${size});`;
        break;
      case 'right':
        output += `top: calc(50% - ${size});`;
        break;
      case 'bottom':
        output += `left: calc(50% - ${size});`;
        break;
      case 'left':
        output += `top: calc(50% - ${size});`;
        break;
      default:
        break;
    }
  }

  switch (side) {
    case 'top':
      output += `
        border-right: ${size} solid transparent;
        border-bottom: ${size} solid ${color};
        border-left: ${size} solid transparent;
      `;
      break;
    case 'right':
      output += `
        border-top: ${size} solid transparent;
        border-bottom: ${size} solid transparent;
        border-left: ${size} solid ${color};
    `;
      break;
    case 'bottom':
      output += `
        border-top: ${size} solid ${color};
        border-right: ${size} solid transparent;
        border-left: ${size} solid transparent;
    `;
      break;
    case 'left':
      output += `
        border-top: ${size} solid transparent;
        border-right: ${size} solid ${color};
        border-bottom: ${size} solid transparent;
    `;
      break;
    default:
      break;
  }

  return output;
}

exports.triangle = triangle;
