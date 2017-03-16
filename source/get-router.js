//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2017 Intel Corporation All Rights Reserved.
//
// The source code contained or described herein and all documents related
// to the source code ("Material") are owned by Intel Corporation or its
// suppliers or licensors. Title to the Material remains with Intel Corporation
// or its suppliers and licensors. The Material contains trade secrets and
// proprietary and confidential information of Intel or its suppliers and
// licensors. The Material is protected by worldwide copyright and trade secret
// laws and treaty provisions. No part of the Material may be used, copied,
// reproduced, modified, published, uploaded, posted, transmitted, distributed,
// or disclosed in any way without Intel's prior express written permission.
//
// No license under any patent, copyright, trade secret or other intellectual
// property right is granted to or conferred upon you by disclosure or delivery
// of the Materials, either expressly, by implication, inducement, estoppel or
// otherwise. Any license under such intellectual property rights must be
// express and approved by Intel in writing.

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
        else
          return false;

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
        return keys.reduce(
          (params, key, index) => {
            params[key.name] = matches[index + 1];

            return params;
          },
          {}
        );
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
    verbs: verbs.reduce(
      function buildVerbObject(verbs, verb) {
        verbs[verb.toUpperCase()] = verb;

        return verbs;
      },
      {}
    )
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
