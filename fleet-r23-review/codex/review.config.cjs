module.exports = {
 testDir: __dirname,
 testMatch: /review\.spec\.cjs/,
 outputDir: __dirname + '/test-results',
 timeout: 180000, workers: 1, reporter: [['list']],
 use: {viewport:{width:1440,height:900}, launchOptions:{args:['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']}}
};
