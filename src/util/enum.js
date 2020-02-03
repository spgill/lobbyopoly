/**
 * Return an object as a frozen enum.
 * May provide further functionality in the future.
 */
export function createEnum(obj) {
  return Object.freeze(obj);
}

let autoIndex = 0;

/**
 * Return an automatically increasing numeric ID.
 */
export function auto() {
  return autoIndex++;
}
