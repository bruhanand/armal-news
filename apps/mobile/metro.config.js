// Metro config wired for the pnpm monorepo — workspace packages are hoisted to
// the repo-root `node_modules/.pnpm/...` store, and Metro needs both watchFolders
// (so it sees source changes in @armal/shared) and nodeModulesPaths (so it
// resolves hoisted deps) to behave.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
