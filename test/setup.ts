import "@maxmilton/test-utils/extend";

function setupMocks(): void {
  // normally this is set by Bun.build
  // process.env.APP_RELEASE = '1.0.0';

  // @ts-expect-error - noop stub
  global.performance.mark = () => {};
  // @ts-expect-error - noop stub
  global.performance.measure = () => {};
}

setupMocks();
