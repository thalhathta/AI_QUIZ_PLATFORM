export default {
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: ["src/**/*.js"],
  setupFiles: ["dotenv/config"],
  coveragePathIgnorePatterns: ["/node_modules/", "src/server.js"],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 55,
      functions: 60,
      lines: 70,
    },
  },
};
