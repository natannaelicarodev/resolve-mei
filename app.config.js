const appJson = require('./app.json');

const profiling = process.env.TAVI_PROFILEABLE_BUILD === '1';

module.exports = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins ?? []),
    ...(profiling ? ['./plugins/withAndroidShellProfiling'] : []),
  ],
};
