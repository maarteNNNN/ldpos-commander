#!/usr/bin/env node

const fs = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));
const ldposClient = require('ldpos-client');

const {
  promptInput,
  exec,
  spawn,
  fork,
  configPath,
  errorLog,
  passphrasePrompt,
  networkSymbolPrompt,
} = require('../lib/index');

const { transfer } = require('../lib/commands');

const configFile = 'ldpos-config.json';
const fullConfigPath = `${configPath}${configFile}`;

let command = argv._[0];

const getConfig = async () => {
  let config;

  if (await fs.pathExists(fullConfigPath)) {
    // If config file exists use config data
    config = require(fullConfigPath);
  } else {
    // If not exists prompt questions
    // prettier-ignore
    hostname = await promptInput('Server IP: (Default: 34.227.22.98)') || '34.227.22.98';
    // prettier-ignore
    port = await promptInput('Port: (Default: 7001)') || 7001;
    // prettier-ignore
    networkSymbol = await networkSymbolPrompt()
    // prettier-ignore
    save = ['Y', 'y'].includes(await promptInput(`Save in your home dir? (Y/n)`));

    config = {
      hostname,
      port,
      networkSymbol,
    };

    if (save)
      await fs.outputFile(fullConfigPath, JSON.stringify(config, null, 2));
  }

  return Promise.resolve(config);
};

const accountBalance = async (client) => {
  const accounts = await client.getAccountsByBalance(0, 100);
  console.log('ACCOUNTS:', accounts);
};

// prettier-ignore
const log = () => {
  console.log('Usage: ldpos (OPTIONAL: ip:port) [options] [command]\n');
  console.log('<ip:port>: Default port is 7001. If not provided it will prompt you in the steps.')
  console.log('Options:');
  console.log('  -v            Get the version of the current LDPoS installation');
  console.log('  --help        Get info on how to use this command');
  console.log();
  console.log('Commands:');
  console.log('  remove            Removes config file with server ip, port and networkSymbol');
  console.log('');
};

(async () => {
  // Switch case for commands
  const sw = {
    remove: async () => await fs.remove(fullConfigPath),
    balance: async (opts) => await accountBalance(opts),
    transfer: async (opts) => await transfer(opts),
    help: async () => log(),
    v: async () =>
      console.log(`Version: ${require('../package.json').version}`),
    default: async () => log(),
  };

  try {
    if (command === 'remove') {
      await sw.remove();
      return;
    }

    if (!command) {
      // 1 because first entry always is _
      for (let i = 1; i < Object.keys(argv).length; i++) {
        const arg = Object.keys(argv)[i];
        if (sw.hasOwnProperty(arg)) {
          sw[arg]();
          return;
        } else {
          errorLog(
            'Command is not found. Run ldpos --help to see all available commands.'
          );
        }
      }
    }

    let config;

    // If command is an ip execute it on another server
    if (command && command.includes('.') && command.split('.').length === 4) {
      const hostname = command.split(':')[0];
      const port = command.split(':')[1] || 7001;
      const networkSymbol = await networkSymbolPrompt();
      command = argv._[1];

      config = { networkSymbol, hostname, port };
    } else {
      // Get config if existent in home dir or create config object
      config = await getConfig();
    }

    // Get passphrase of the wallet
    const passphrase = await passphrasePrompt();

    const client = ldposClient.createClient(config);

    await client.connect({
      passphrase,
    });

    // Execute given command
    await (sw[command] || sw.default)({ client, passphrase });
    process.exit();
  } catch (e) {
    debugger;
    errorLog(e.message);
  }
})();
