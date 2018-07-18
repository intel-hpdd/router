//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import pathRegexp from 'path-to-regexp';
import pipeline from './pipeline';

const verbs = ['get', 'post', 'put', 'patch', 'delete'];
const verbsPlusAll = verbs.concat('all');

export default function getRouter() {
  const routes = [];
  const start = [];
  const end = [];

  const router = {
    route(path) {
      let route = routes.filter(x => x.path === path)[0];

      if (route) return route.pathRouter;

      const keys = [];
      const pathRouter = getAPathRouter();

      route = {
        path: path,
        keys: keys,
        regexp: pathRegexp(path, keys),
        pathRouter: pathRouter
      };

      routes.push(route);

      return pathRouter;
    },
    go(path, req, resp, cb) {
      const matched = routes.some(route => {
        let routeActions;

        const matches = route.regexp.exec(path);

        if (!matches) return false;

        const verb = req.verb.toLowerCase();

        if (route.pathRouter.verbs[verb] != null)
          routeActions = route.pathRouter.verbs[verb];
        else if (route.pathRouter.verbs.all != null)
          routeActions = route.pathRouter.verbs.all;
        else return false;

        req = Object.assign({}, req, {
          params: keysToParams(route.keys, matches),
          matches: matches
        });

        let pipes = start.concat(routeActions).concat(end);

        if (typeof cb === 'function') pipes = pipes.concat(cb);

        pipeline(pipes, req, resp);

        return true;
      });

      if (!matched)
        throw new Error(`Route: ${path} does not match provided routes.`);

      function keysToParams(keys, matches) {
        return keys.reduce((params, key, index) => {
          params[key.name] = matches[index + 1];

          return params;
        }, {});
      }
    },

    reset() {
      routes.length = 0;
      start.length = 0;
      end.length = 0;
    },
    addStart(action) {
      start.push(action);

      return this;
    },
    addEnd(action) {
      end.push(action);

      return this;
    },
    verbs: verbs.reduce(function buildVerbObject(verbs, verb) {
      verbs[verb.toUpperCase()] = verb;

      return verbs;
    }, {})
  };

  verbsPlusAll.forEach(function addVerbToRouter(verb) {
    router[verb] = function addVerbToRouterInner(path, action) {
      router.route(path)[verb](action);

      return this;
    };
  });

  return router;
}

function getAPathRouter() {
  return verbsPlusAll.reduce(
    (pathRouter, verb) => {
      pathRouter[verb] = function verbMapper(action) {
        pathRouter.verbs[verb] = pathRouter.verbs[verb] || [];
        pathRouter.verbs[verb].push(action);

        return pathRouter;
      };

      return pathRouter;
    },
    { verbs: {} }
  );
}
