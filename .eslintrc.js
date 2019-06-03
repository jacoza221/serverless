module.exports = {
  "root": true,
  "extends": "airbnb",
  "plugins": [],
  "rules": {
    "arrow-body-style": "off",
    "func-names": "off",
    "global-require": "off", // Interfers with optional and eventual circular references
    "import/no-extraneous-dependencies": ["error", {"devDependencies": ["**/*.test.js",  "**/scripts/**", "**/tests/**"]}],
    "no-use-before-define": "off",
    "react/require-extension": "off", // Forced by airbnb, not applicable (also deprecated)
    "strict": ["error", "safe"], // airbnb implies we're transpiling with babel, we're not
  },
  "parserOptions": {
    "sourceType": "script", // airbnb assumes ESM, while we're CJS
  },
  "env": {
    "mocha": true,
    "jest": true
  }
};
