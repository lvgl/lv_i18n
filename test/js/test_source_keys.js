'use strict';


const assert      = require('assert');
const { join }    = require('path');

const SourceKeys  = require('../../lib/source_keys');


describe('SourceKeys', function () {

  it('Should find source files', function () {
    let sk = new SourceKeys();

    sk.loadFiles([ join(__dirname, 'fixtures/file_load/*.+(c|h)') ]);
    assert.equal(sk.filesCount, 2);
  });

  it('Should accept duplicated keys', function () {
    let sk = new SourceKeys();

    sk.loadText(`
const char* singular = _("the same text");
const char* duplicated_singular = _("the same text");
`, 'test.c');
    assert.equal(sk.keys.length, 2);
  });

  it('Should fail on singulars/plurals collision', function () {
    let sk = new SourceKeys();

    assert.throws(
      () => {
        sk.loadText(`
const char* singular = _("the same text");
const char* plural = _p("the same text", 5);
`, 'test.c');
      },
      /Conflicting key/
    );
  });

});
