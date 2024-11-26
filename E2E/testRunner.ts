import { getMyLocalIP } from "./utils/utils";
import createTestCafe from "testcafe";
import { once } from "events";
import * as qrcode from "qrcode-terminal";
import { processArgs } from "./utils";

(async () => {
  // Get args from the command line. The args will be the browsers to run the tests on
  console.log("Preparing to run the tests");
  const { browsers, testSuites, concurrency, onlineMode } = processArgs();
  console.log("testSuites", testSuites);
  // Create the default runner
  const myLocalIp = getMyLocalIP();
  const testCafe = await createTestCafe(myLocalIp, 12345, 12346);
  const runner = testCafe.createRunner();
  if (onlineMode) {
    console.log("Running online tests");
  } else {
    console.log("Running local tests");
  }
  if ((browsers as string[]).includes("remote")) {
    console.log("Running remote tests. Connect to the URL");

    const browserConnection = await testCafe.createBrowserConnection();
    console.log("Open the following URL on a remote browser to run the tests:");
    const url = browserConnection.url.replace(
      /localhost|127\.0\.0\.1/g,
      myLocalIp
    );
    console.log(url);
    console.log("Or scan the following QR code:");
    qrcode.generate(url);

    //@ts-ignore
    await once(browserConnection, "ready");

    // Run the tests on remote browsers
    console.log("Running remote tests");

    const remoteFailedTests = await runner
      .src(testSuites as string[])
      .browsers(browserConnection)
      .run();
    if (remoteFailedTests) {
      console.log("Some remote automated tests failed");
      await testCafe.close();
      process.exit(1);
    }
    console.log("All remote automated tests passed");
    await testCafe.close();
    process.exit(0);
  }

  // Check if we're running browserstack tests without the online mode
  if ((browsers as string[]).includes("browserstack")) {
    console.error(
      "You need to enable the online mode to run tests on BrowserStack"
    );
    process.exit(2);
  }

  // Run the tests on browsers
  const localFailedTests = await runner
    .src(testSuites as string[])
    .browsers(browsers as string[])
    .concurrency(concurrency as number)
    .run({
      assertionTimeout: 60000,
      testExecutionTimeout: 180000,
    });
  console.log(localFailedTests);

  if (localFailedTests) {
    console.log("Some local automated tests failed");
    await testCafe.close();
    process.exit(1);
  }
  process.exit(0);
})();
