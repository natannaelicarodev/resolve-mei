const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Enables low-overhead shell profiling only for builds created with
 * TAVI_PROFILEABLE_BUILD=1. Distribution releases never load this plugin.
 */
module.exports = function withAndroidShellProfiling(config) {
  return withAndroidManifest(config, (configWithManifest) => {
    const application =
      configWithManifest.modResults.manifest.application?.[0];

    if (!application) {
      throw new Error('Android manifest has no <application> element');
    }

    application.profileable = [
      {
        $: {
          'android:enabled': 'true',
          'android:shell': 'true',
        },
      },
    ];

    return configWithManifest;
  });
};
