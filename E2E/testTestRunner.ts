import { once } from "events";
import createTestCafe from "testcafe";
import * as qrcode from "qrcode-terminal";

(async () => {
  console.log(` 
 ____________________________
< Preparing to run the tests >
 ----------------------------
    \\   ^__^
     \\  (oo)\\_______
        (__)\\       )\\/\\
            ||----w |
            ||     ||`);
  // Create the default runner
  const testCafe = await createTestCafe("192.168.15.2", 12345, 12346);
  const runner = testCafe.createRunner();

  // Run the tests
  console.log(` 
 _____________________ 
< Running local tests >
 --------------------- 
   \\   ^__^
    \\  (oo)\\_______
       (__)\\       )\\/\\
           ||----w |
           ||     ||`);
  const localFailedTests = await runner
    .src(["tests/E2E/test.test.ts"])
    .browsers(["firefox:headless"])
    .run();
  console.log(localFailedTests);

  if (localFailedTests) {
    console.log(` 
 _____________________________
< Some automated tests failed >
 -----------------------------
    \\   ^__^
     \\  (oo)\\_______
        (__)\\       )\\/\\
            ||----w |
            ||     ||`);
    process.exit(1);
  }

  // Run the tests on remote browsers
  console.log(` 
 __________________________________________
< Running remote tests. Connect to the URL >
 ------------------------------------------
    \\   ^__^
     \\  (oo)\\_______
        (__)\\       )\\/\\
            ||----w |
            ||     ||`);

  const browserConnection = await testCafe.createBrowserConnection();
  console.log("Open the following URL on a remote browser to run the tests:");
  console.log(browserConnection.url);
  console.log("Or scan the following QR code:");
  // @ts-ignore
  qrcode.generate(browserConnection.url);
  //@ts-ignore
  await once(browserConnection, "ready");
  const remoteFailedTests = await runner
    .src(["tests/E2E/test.test.ts"])
    .browsers(browserConnection)
    .run();

  console.log("remote", remoteFailedTests);
  await testCafe.close();
  process.exit(0);
})();
