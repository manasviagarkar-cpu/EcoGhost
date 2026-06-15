/** @type {import('vitest/config').UserConfig} */
module.exports = {
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{js,ts}']
  }
};
