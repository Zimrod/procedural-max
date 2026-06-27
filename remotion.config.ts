// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";

// 🚀 Explicitly tell Remotion where your root orchestration bundle lives
Config.setEntryPoint("./src/remotion/index.ts");

Config.setVideoImageFormat("jpeg");

Config.overrideWebpackConfig((config) => {
  const rules = (config.module?.rules ?? []).filter((rule) => {
    // Remove any existing SVG rule
    if (rule && typeof rule === 'object' && 'test' in rule) {
      return !(rule.test instanceof RegExp && rule.test.test('.svg'));
    }
    return true;
  });

  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...rules,
        {
          test: /\.svg$/,
          type: 'asset/source', // raw string import
        },
      ],
    },
  };
});

// Cloud Architecture Flow