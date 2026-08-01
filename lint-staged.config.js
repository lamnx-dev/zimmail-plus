// lint-staged.config.js
const config = {
  "src/**/*.{ts,tsx}": [
    () => "tsc -p tsconfig.json --noEmit",
    "eslint --fix --quiet",
    "prettier --write",
  ],
  "src/**/*.{js,jsx}": ["eslint --fix --quiet", "prettier --write"],
  "src/**/*.{css,json}": "prettier --write",
}

export default config
