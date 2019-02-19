'use strict';


const assert            = require('assert');
const { join }          = require('path');
const { execFileSync }  = require('child_process');


const bad_yaml_path = join(__dirname, 'fixtures/broken.yml');
const script_path = join(__dirname, '../../lv_i18n.js');


describe('Script', function () {

  it('Should run', function () {
    let out = execFileSync(script_path, [], { stdio: 'pipe' });
    assert.equal(out.toString().substring(0, 5), 'usage');
  });

  it('Should display crash dump', function () {
    assert.throws(
      () => execFileSync(
        script_path,
        [ 'rename', '-t', `${bad_yaml_path}`, '--from', 'foo',  '--to', 'bar' ],
        { stdio: 'pipe' }
      ),
      /YAMLException/
    );
  });

  it('Should display normal errors', function () {
    assert.throws(
      () => execFileSync(
        script_path,
        [ 'rename', '-t', 'bad_path', '--from', 'foo',  '--to', 'bar' ],
        { stdio: 'pipe' }
      ),
      /Failed to find any translation file/
    );
  });
});
