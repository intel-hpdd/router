/*global jasmine:true*/

// eslint-disable-next-line import/no-commonjs
require('intel-jasmine-n-matchers');

if (process.env.RUNNER === 'CI') {
  const jasmineReporters = require('jasmine-reporters');

  jasmine.VERBOSE = true;
  jasmine.getEnv().addReporter(
    new jasmineReporters.JUnitXmlReporter({
      consolidateAll: true,
      savePath: process.env.SAVE_PATH || './',
      filePrefix: process.env.FILE_PREFIX || 'router-results-' + process.version
    })
  );
}
