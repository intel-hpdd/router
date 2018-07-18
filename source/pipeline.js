//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

export default function next(...args) {
  const pipeline = args.shift();

  if (pipeline.length > 0) {
    const [pipe, ...rest] = pipeline;

    const nextPipe = (...args) => {
      next(...[rest, ...args]);
    };

    pipe(...[...args, nextPipe]);
  }
}
