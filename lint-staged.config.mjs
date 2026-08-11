/** @type {import("lint-staged").Config} */
export default {
  '*.{ts,html}': ['eslint --fix'],
  '*.{ts,html,scss,json,md}': ['prettier --write'],
};
