// Parse input arguments and execute commands
'use strict';


const ArgumentParser = require('argparse').ArgumentParser;
const debug          = require('debug')('cli');
const _ = require('lodash');

const commands = [
  require('./cmd_extract'),
  require('./cmd_compile'),
  require('./cmd_rename')
];


module.exports.run = function (test_cli_params) {

  // Main parser instance
  let argparser = new ArgumentParser({
    version: require('../package.json').version,
    addHelp:  true,
    epilog:   "See '%(prog)s <command> -h' for more information on specific command."
  });

  // Sub-parser for commands
  let cmd_argparsers = argparser.addSubparsers({
    title:    'Known commands',
    dest:     'command'
  });

  // Configure commands & arguments
  commands.forEach(c => {
    let subparser = cmd_argparsers.addParser(
      c.subparserInfo.command,
      c.subparserInfo.options
    );

    c.subparserArgsList.forEach(item => subparser.addArgument(item.args, _.cloneDeep(item.options)));
  });

  // Finally, parse args
  let cli_args = test_cli_params || process.argv.slice(2);
  let args = argparser.parseArgs(cli_args.length ? cli_args : [ '-h' ]);

  // Let's rock begin!
  debug(`Arguments: ${args}`);
  commands.find(c => c.subparserInfo.command === args.command).execute(args);
};
