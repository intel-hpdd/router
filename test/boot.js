'use strict';

require('jasmine-n-matchers');

if (process.env.RUNNER === 'CI') {
  var krustyJasmineReporter = require('krusty-jasmine-reporter');

  var junitReporter = new krustyJasmineReporter.KrustyJasmineJUnitReporter({
    specTimer: new jasmine.Timer(),
    JUnitReportSavePath: process.env.SAVE_PATH || './',
    JUnitReportFilePrefix: process.env.FILE_PREFIX || 'router-results',
    JUnitReportSuiteName: 'Router Reports',
    JUnitReportPackageName: 'Router Reports'
  });

  jasmine.getEnv().addReporter(junitReporter);
}
