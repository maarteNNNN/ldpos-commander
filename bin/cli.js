#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const { CmdInterface } = require('../lib');

const config = {};

// i = 1 to skip _
for (let i = 1; i < Object.keys(argv).length; i++) {
  const arg = Object.keys(argv)[i];
  config[arg.replace(/-./g, (x) => x.toUpperCase()[1])] = argv[arg];
}

(async () => {
  config.interactive = !argv._.length || Object.keys(argv).length > 1;

  const cmd = await new CmdInterface().init(config, argv._.includes('clean'));

  if (config.interactive) {
    cmd.interactive();
  } else {
    cmd.command(argv);
  }
})();
