// lint-staged.config.js
const config = {
  "src/**/*.{ts,tsx}": [() => "tsc -p tsconfig.json --noEmit", "eslint --fix --quiet"],
  "src/**/*.{js,jsx}": "eslint --fix --quiet",
  "src/**/*.{css,json}": "prettier --write",
}

export default config
