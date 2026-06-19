/** @type {import('vitest/config').UserConfig} */
export default {
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{js,ts}']
  }
};
