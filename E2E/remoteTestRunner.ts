import { once } from "events";
import { getMyLocalIP } from "./utils/utils";
import createTestCafe from "testcafe";
import * as qrcode from "qrcode-terminal";

(async () => {
  console.log("Preparing to run the tests");
  // Create the default runner
  const myLocalIp = getMyLocalIP();
  console.log("My local IP is", myLocalIp);

  const testCafe = await createTestCafe(myLocalIp, 12345, 12346);
  const runner = testCafe.createRunner();

  // Run the tests on remote browsers
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

  const remoteFailedTests = await runner
    .src([
      "tests/E2E/suites/autoPlay.test.ts",
      "tests/E2E/suites/basicActions.test.ts",
      "tests/E2E/suites/dynamicScenes.test.ts",
      "tests/E2E/suites/windowSize.test.ts",
    ])
    .browsers(browserConnection)
    .run();
  if (remoteFailedTests) {
    console.log("Some remote automated tests failed");
    await testCafe.close();
    process.exit(1);
  }
  process.exit(0);
})();
