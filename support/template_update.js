#!/usr/bin/env node

'use strict';


const shell = require('shelljs');
const fs = require('fs');
const { join } = require('path');
const { run } = require('../lib/cli');


const tmp_file = join(__dirname, 'raw.tmp');
const template_c = join(__dirname, '../src/lv_i18n.template.c');
const template_yaml = join(__dirname, 'template_data.yml');

run([ 'compile', '-t', template_yaml, '--raw', tmp_file ]);

let txt_raw = fs.readFileSync(tmp_file, 'utf-8');
let txt = fs.readFileSync(template_c, 'utf-8');

txt = txt.replace(/\/\*SAMPLE_START\*\/([\s\S]+)\/\*SAMPLE_END\*\//,
  `/*SAMPLE_START*/
${txt_raw}
/*SAMPLE_END*/`);

//fs.writeFileSync(tmp_file + '.c', txt);
fs.writeFileSync(template_c, txt);

shell.rm('-rf', tmp_file);
