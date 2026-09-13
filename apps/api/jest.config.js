module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
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
