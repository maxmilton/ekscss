import "@maxmilton/test-utils/extend";

const noop = () => {};

function setupMocks(): void {
  // normally this is set by Bun.build
  // process.env.APP_RELEASE = '1.0.0';

  // @ts-expect-error - noop stub
  global.performance.mark = noop;
  // @ts-expect-error - noop stub
  global.performance.measure = noop;
}

setupMocks();
