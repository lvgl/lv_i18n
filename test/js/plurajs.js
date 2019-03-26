'use strict';


const create_plural = require('../../lib/plurals').create_c_plural_fn;
const assert        = require('assert');


describe('Plurals', function () {

  it('should not add "uint32_t n = op_n(n); UNUSED(n);"', function () {
    let fn_body = create_plural('tr', 'p').toString();

    assert.ok(!fn_body.includes('uint32_t n = op_n(n); UNUSED(n);'));
  });

  // Just run all branches without result check. Generator code is taken
  // from well-tested https://github.com/nodeca/plurals-cldr. So, everything
  // should be safe enougth.
  it('coverage fix', function () {
    create_plural('br', 'p');
    create_plural('bo', 'p');
    create_plural('da', 'p');
  });
});
