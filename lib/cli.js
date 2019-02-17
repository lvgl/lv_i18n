// Parse input arguments and execute commands
'use strict';


const ArgumentParser = require('argparse').ArgumentParser;


const commands = [
  require('./cmd_extract'),
  require('./cmd_compile'),
  require('./cmd_rename')
];


module.exports.run = function () {

  // Main parser instance
  let argparser = new ArgumentParser({
    version: require('../package.json').version,
    addHelp:  true,
    epilog:   "See '%(prog)s <command> --help' for more information on specific command."
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

    c.subparserArgsList.forEach(item => subparser.addArgument(item.args, item.options));
  });

  // Finally, parse args
  let cli_args = process.argv.slice(2);
  let args = argparser.parseArgs(cli_args.length ? cli_args : [ '-h' ]);

  // Let's rock begin!
  commands.find(c => c.subparserInfo.command === args.command).execute(args);
};
