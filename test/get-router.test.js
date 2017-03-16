'use strict';

import getRouter from '../source/get-router';
import {
  describe,
  beforeEach,
  afterEach,
  jasmine,
  it,
  expect
} from './jasmine';

describe('Router', () => {
  let router;

  beforeEach(() => {
    router = getRouter();
  });

  afterEach(() => {
    router.reset();
  });

  it('should have a method to add a route', () => {
    expect(router.route).toEqual(jasmine.any(Function));
  });

  it('should have a method to go to an action', () => {
    expect(router.go).toEqual(jasmine.any(Function));
  });

  it('should go to a matched route', () => {
    const action = jasmine.createSpy('action');

    router.route('/foo/').get(action);
    router.go('/foo/', { verb: 'get' }, {});

    expect(action).toHaveBeenCalledOnce();
  });

  describe('calling a matched route with request response and next', () => {
    let action, matches, cb;
    beforeEach(() => {
      action = jasmine.createSpy('action').and.callFake((req, resp, next) => {
        next(req, resp, { foo: 'bar' });
      });
      cb = jasmine.createSpy('cb');

      router.route('/foo/').get(action);
      router.go(
        '/foo/',
        {
          verb: 'get',
          data: { bar: 'baz' }
        },
        {},
        cb
      );

      matches = ['/foo/'];
      matches.index = 0;
      matches.input = '/foo/';
    });

    it('should invoke the action', () => {
      expect(action).toHaveBeenCalledOnceWith(
        {
          params: {},
          matches: matches,
          verb: 'get',
          data: { bar: 'baz' }
        },
        {},
        jasmine.any(Function)
      );
    });

    it('should invoke the callback', () => {
      expect(cb).toHaveBeenCalledOnceWith(
        {
          verb: 'get',
          data: { bar: 'baz' },
          params: {},
          matches: matches
        },
        {},
        { foo: 'bar' },
        jasmine.any(Function)
      );
    });
  });

  it('should handle named parameters', () => {
    const action = jasmine.createSpy('action');

    router.route('/host/:id').get(action);
    router.go('/host/1/', { verb: 'get' }, {});

    const matches = ['/host/1/', '1'];
    matches.index = 0;
    matches.input = '/host/1/';

    expect(action).toHaveBeenCalledOnceWith(
      {
        params: { id: '1' },
        matches: matches,
        verb: 'get'
      },
      {},
      jasmine.any(Function)
    );
  });

  it('should handle regexp parameters', () => {
    const action = jasmine.createSpy('action');

    router.route(/^\/host\/(\d+)$/).get(action);
    router.go('/host/1', { verb: 'get' }, {});

    const matches = ['/host/1', '1'];
    matches.index = 0;
    matches.input = '/host/1';

    expect(action).toHaveBeenCalledOnceWith(
      {
        params: { 0: '1' },
        matches: matches,
        verb: 'get'
      },
      {},
      jasmine.any(Function)
    );
  });

  it('should have an all method', () => {
    const action = jasmine.createSpy('action');

    router.route('/foo/bar').all(action);
    router.go('/foo/bar', { verb: 'post' }, {});

    expect(action).toHaveBeenCalledOnce();
  });

  it('should match a route with a trailing slash', () => {
    const action = jasmine.createSpy('action');

    router.route('/foo/bar').get(action);
    router.go('/foo/bar/', { verb: 'get' }, {});

    expect(action).toHaveBeenCalledOnce();
  });

  it('should match a wildcard route', () => {
    const action = jasmine.createSpy('action');

    router.route('/(.*)').get(action);
    router.go('/foo/bar/', { verb: 'get' }, {});

    expect(action).toHaveBeenCalledOnce();
  });

  it('should throw if route does not match', () => {
    expect(shouldThrow).toThrow(
      new Error('Route: /foo/bar/ does not match provided routes.')
    );

    function shouldThrow() {
      router.go('/foo/bar/', { verb: 'get' }, {});
    }
  });

  it('should throw if verb is not set', () => {
    router.route('/foo/bar/').get(() => {});

    expect(shouldThrow).toThrow(
      new Error('Route: /foo/bar/ does not match provided routes.')
    );

    function shouldThrow() {
      router.go('/foo/bar/', { verb: 'post' }, {});
    }
  });

  describe('using a catch all when the same path is defined using a different method', () => {
    let action, wildcardAction;
    beforeEach(() => {
      action = jasmine.createSpy('action');
      wildcardAction = jasmine.createSpy('wildcardAction');

      router.route('/api/mock').post(action);
      router.route('(.*)').all(wildcardAction);

      router.go(
        '/api/mock',
        {
          verb: 'get',
          clientReq: { bar: 'baz' }
        },
        {}
      );
    });

    it('should not catch the post route', () => {
      expect(action).not.toHaveBeenCalled();
    });

    it('should route using the wildcard', () => {
      expect(wildcardAction).toHaveBeenCalledOnce();
    });
  });

  const allVerbs = Object.keys(getRouter().verbs)
    .map(function getVerbs(key) {
      return getRouter().verbs[key];
    })
    .concat('all');
  allVerbs.forEach(function testVerb(verb) {
    it('should have a convenience for ' + verb, () => {
      const action = jasmine.createSpy('action');

      router[verb]('/foo/bar/', action);

      router.go(
        '/foo/bar/',
        {
          verb: verb
        },
        {}
      );

      expect(action).toHaveBeenCalledOnce();
    });
  });

  it('should return router from get', () => {
    const r = router.get('/foo/bar/', () => {});

    expect(r).toBe(router);
  });

  it('should place an ack on the response if one is provided', () => {
    const action = jasmine.createSpy('action');

    router.route('/host/:id').get(action);
    router.go('/host/1/', { verb: 'get' }, { ack: () => {} });

    const matches = ['/host/1/', '1'];
    matches.index = 0;
    matches.input = '/host/1/';

    expect(action).toHaveBeenCalledOnceWith(
      {
        params: { id: '1' },
        matches: matches,
        verb: 'get'
      },
      {
        ack: jasmine.any(Function)
      },
      jasmine.any(Function)
    );
  });

  describe('the all method', () => {
    let action, getAction;

    beforeEach(() => {
      action = jasmine.createSpy('action');
      getAction = jasmine.createSpy('getAction');

      router.route('/foo/bar').get(getAction).all(action);
      router.go('/foo/bar', { verb: 'post' }, {});
    });

    it('should not call the get method with post', () => {
      expect(getAction).not.toHaveBeenCalledOnce();
    });

    it('should call the all method with post', () => {
      expect(action).toHaveBeenCalledOnce();
    });
  });

  describe('routing in order', () => {
    let fooAction, wildcardAction;

    beforeEach(() => {
      fooAction = jasmine.createSpy('fooAction');
      wildcardAction = jasmine.createSpy('wildcardAction');

      router.route('/foo/bar/').get(fooAction);
      router.route('/(.*)').get(wildcardAction);

      router.go('/foo/bar/', { verb: 'get' }, {});
    });

    it('should call the first match', () => {
      expect(fooAction).toHaveBeenCalledOnce();
    });

    it('should not call the other match', () => {
      expect(wildcardAction).not.toHaveBeenCalled();
    });
  });

  describe('adding routes', () => {
    let fooAction1, fooAction2;

    beforeEach(() => {
      fooAction1 = jasmine
        .createSpy('fooAction1')
        .and.callFake((req, resp, next) => {
          next(req, resp);
        });
      fooAction2 = jasmine.createSpy('fooAction2');

      router.route('/foo/bar/').get(fooAction1);
      router.route('/foo/bar/').get(fooAction2);
      router.go('/foo/bar/', { verb: 'get' }, {});
    });

    it('should call the old route', () => {
      expect(fooAction1).toHaveBeenCalled();
    });

    it('should call the new route', () => {
      expect(fooAction2).toHaveBeenCalledOnce();
    });
  });

  describe('route middleware', () => {
    let beforeAction, middleAction, afterAction, callNext;

    beforeEach(() => {
      beforeAction = jasmine.createSpy('beforeAction');
      middleAction = jasmine.createSpy('middleAction');
      afterAction = jasmine.createSpy('afterAction');

      callNext = function callNext(spy) {
        const args = spy.calls.mostRecent().args;
        args[2](args[0], args[1]);
      };

      router
        .addStart(beforeAction)
        .addEnd(afterAction)
        .route('/foo/bar/')
        .get(middleAction);
      router.go('/foo/bar/', { verb: 'get' }, {});
    });

    it('should call before', () => {
      expect(beforeAction).toHaveBeenCalledOnce();
    });

    it('should not call middle', () => {
      expect(middleAction).not.toHaveBeenCalled();
    });

    it('should not call end', () => {
      expect(afterAction).not.toHaveBeenCalled();
    });

    it('should call middle after before', () => {
      callNext(beforeAction);
      expect(middleAction).toHaveBeenCalledOnce();
    });

    it('should call after after before and middle', () => {
      callNext(beforeAction);
      callNext(middleAction);
      expect(afterAction).toHaveBeenCalledOnce();
    });
  });
});
