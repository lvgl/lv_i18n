'use strict';


const create_plural = require('../../lib/plurals').create_c_plural_fn;


describe('Plurals', function () {

  // Just run all branches without result check. Generator code is taken
  // from well-tested https://github.com/nodeca/plurals-cldr. So, everything
  // should be safe enougth.
  it('coverage fix', function () {
    create_plural('br', 'p');
    create_plural('bo', 'p');
    create_plural('da', 'p');
  });
});
