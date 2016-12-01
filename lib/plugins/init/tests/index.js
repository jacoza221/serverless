'use strict';

const expect = require('chai').expect;
const Init = require('../index.js');
const Serverless = require('../../../Serverless');

describe('Init', () => {
  let init;
  let serverless;

  beforeEach(() => {
    serverless = new Serverless();
    init = new Init(serverless);
  });

  describe('#constructor()', () => {
    it('should have commands', () => expect(init.commands).to.be.not.empty);
  });
});
