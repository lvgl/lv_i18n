#!/usr/bin/env node

'use strict';


const shell = require('shelljs');
const fs = require('fs');
const { join, dirname, basename, extname } = require('path');
const { run } = require('../lib/cli');


const tmp_file = join(__dirname, 'raw.tmp');
const tmp_file_h = join(dirname(tmp_file), basename(tmp_file, extname(tmp_file)) + '.h');
const template_c = join(__dirname, '../src/lv_i18n.template.c');
const template_h = join(__dirname, '../src/lv_i18n.template.h');
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

txt_raw = fs.readFileSync(tmp_file_h, 'utf-8');
txt = fs.readFileSync(template_h, 'utf-8');

txt = txt.replace(/\/\*SAMPLE_START\*\/([\s\S]+)\/\*SAMPLE_END\*\//,
  `/*SAMPLE_START*/
${txt_raw}
/*SAMPLE_END*/`);

fs.writeFileSync(template_h, txt);

shell.rm('-rf', tmp_file, tmp_file_h);
