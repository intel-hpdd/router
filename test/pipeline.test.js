import { describe, beforeEach, jasmine, it, expect } from './jasmine';
import pipeline from '../source/pipeline';

describe('pipeline', () => {
  let pipe, request, response;

  beforeEach(() => {
    pipe = jasmine.createSpy('pipe');
    request = { bar: 'baz' };
    response = { foo: 'bar' };
  });

  it('should be a function', () => {
    expect(pipeline).toEqual(jasmine.any(Function));
  });

  it('should call the pipe with req, resp, and next', () => {
    pipe.and.callFake((req, resp, next) => {
      next(req, resp);
    });

    pipeline([pipe], request, response);

    expect(pipe).toHaveBeenCalledOnceWith(
      request,
      response,
      jasmine.any(Function)
    );
  });

  it('should handle extra args', () => {
    const spy = jasmine.createSpy('spy');

    pipeline(
      [
        (request, response, next) => {
          next(request, response, { c: 'd' });
        },
        spy
      ],
      request,
      response
    );

    expect(spy).toHaveBeenCalledOnceWith(
      request,
      response,
      { c: 'd' },
      jasmine.any(Function)
    );
  });
});
