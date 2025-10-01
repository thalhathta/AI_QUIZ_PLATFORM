export default {
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: ["src/**/*.js"],
  setupFiles: ["dotenv/config"],
  coveragePathIgnorePatterns: ["/node_modules/", "src/server.js"],
};
