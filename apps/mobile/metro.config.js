const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const defaultConfig = getDefaultConfig(projectRoot);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    blockList: [
      /.*[/\\]android[/\\].*/,
      /.*[/\\]ios[/\\].*/,
    ],
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
    ],
    // Metro (RN 0.76) doesn't honor package.json "exports" subpaths by
    // default, so map @chainwork/* deep imports onto their TS sources.
    // Scoped to our workspace packages to avoid the blast radius of
    // unstable_enablePackageExports.
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith("@chainwork/core/")) {
        const sub = moduleName.slice("@chainwork/core/".length);
        return context.resolveRequest(
          context,
          path.resolve(workspaceRoot, "packages/core/src", sub),
          platform
        );
      }
      if (moduleName === "@chainwork/firebase-client/web") {
        return context.resolveRequest(
          context,
          path.resolve(workspaceRoot, "packages/firebase-client/src/web.ts"),
          platform
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
