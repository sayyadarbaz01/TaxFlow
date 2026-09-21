module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "\\.vitest\\.test\\.ts$", "e2e-http"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          target: "ES2022",
          module: "CommonJS",
          types: ["node", "jest"],
          esModuleInterop: true,
          skipLibCheck: true
        }
      }
    ]
  }
};
