import path from "path";
import * as fs from "fs";
import { TestParams } from "./types";

export function processArgs(): TestParams {
  const args = process.argv.slice(2);
  const returnValues: TestParams = {} as TestParams;

  // Pre-processing
  const existingTests = getAllTestSuites();
  const testNames = Object.keys(existingTests);

  // i -> param
  // IF PARAM NEED VALUE: i+1 -> value
  // OTHERWISE IS ANOTHER PARAM
  for (let i = 0; i < args.length; i++) {
    const param = args[i];
    switch (param) {
      case "-b": // Specific Browsers
      case "--browsers":
        console.log("Browsers defined", param);
        if (returnValues.browsers) throw new Error("Browsers already defined");

        i++;
        let browsers: string[] = [];
        try {
          const arg = args[i];

          // Check if the argument is a browserstack formatted string
          const browserstackPattern = /^browserstack:[^@]+@\d+(\.\d+)?(:.+)?$/;
          if (arg === "browserstack:mobile") {
            // Add default browserstack browsers
            browsers = [
              "browserstack:iPhone 15 Pro Max@17",
              "browserstack:Samsung Galaxy S24@14.0",
            ];
          } else if (arg === "browserstack:desktop") {
            // Add default browserstack browsers
            browsers = [
              "browserstack:chrome@130.0:Windows 11",
              "browserstack:safari@18.0:OS X Sequoia",
            ];
          } else if (arg === "browserstack:ios") {
            browsers = ["browserstack:iPhone 15@17"];
          } else if (arg === "browserstack:android") {
            browsers = ["browserstack:Samsung Galaxy S24@14.0"];
          } else if (arg === "lambdatest") {
            browsers = [
              "lambdatest:iPhone 15 Pro@18:ios:isReal",
              "lambdatest:Galaxy S21 5G@11:android:isReal",
            ];
          } else if (browserstackPattern.test(arg)) {
            // Treat as a single entry for BrowserStack
            browsers = [arg];
          } else {
            // Otherwise, split by spaces as usual
            browsers = arg.split(" ");
          }
        } catch (e) {
          console.log("Browsers are not defined");
          process.exit(10);
        }
        if (browsers.length === 0) throw new Error("No browser defined");

        if (browsers.includes("remote") && browsers.length > 1) {
          console.error("Cannot use remote with other browsers");
          process.exit(11);
        }
        returnValues.browsers = browsers;
        break;

      case "-a-b":
      case "--all-browsers":
        if (returnValues.browsers) {
          console.error("Browsers already defined");
          process.exit(12);
        }

        returnValues.browsers = ["all"];
        break;

      case "-t":
      case "--tests":
        if (returnValues.testSuites) {
          console.error("Tests already defined");
          process.exit(20);
        }

        returnValues.testSuites = [];
        i++;
        let testsSuitesToUse: string[] = [];
        try {
          testsSuitesToUse = args[i].split(" ");
        } catch (e) {
          console.error("Tests are not defined");
          process.exit(21);
        }
        if (testsSuitesToUse.length === 0) {
          console.error("No test defined");
          process.exit(22);
        }

        const testsSuitesNotFound: string[] = [];
        for (let i = 0; i < testsSuitesToUse.length; i++) {
          const testName = testsSuitesToUse[i];
          if (testNames.includes(testName))
            returnValues.testSuites.push(existingTests[testName]);
          else testsSuitesNotFound.push(testName);
        }
        if (testsSuitesNotFound.length > 0) {
          console.error("Tests not found: ", testsSuitesNotFound);
          process.exit(23);
        }

        break;

      case "-a-t":
      case "--all-tests":
        if (returnValues.testSuites) {
          console.error("Tests already defined");
          process.exit(24);
        }

        returnValues.testSuites = [];
        for (let i = 0; i < testNames.length; i++) {
          returnValues.testSuites.push(existingTests[testNames[i]]);
        }
        break;

      case "-c":
      case "--concurrency":
        if (returnValues.concurrency) {
          console.error("Concurrency already defined");
          process.exit(30);
        }
        i++;
        const concurrency = parseInt(args[i]);
        if (isNaN(concurrency)) {
          console.error("Concurrency is not a number");
          process.exit(31);
        }
        returnValues.concurrency = concurrency;
        break;

      case "-on":
      case "--onlinemode":
        if (returnValues.onlineMode) {
          console.error("Online mode already defined");
          process.exit(32);
        }
        returnValues.onlineMode = true;
        break;

      case "-h":
      case "--help":
        showHelp();
        process.exit(0);
        break;
      default: {
        console.error(`Option ${param} does not exist`);
        process.exit(40);
      }
    }
  }
  if (!returnValues.browsers) {
    returnValues.browsers = ["all"];
  }

  if (!returnValues.testSuites) {
    returnValues.testSuites = [];
    for (let i = 0; i < testNames.length; i++) {
      returnValues.testSuites.push(existingTests[testNames[i]]);
    }
  }

  if (!returnValues.concurrency) {
    returnValues.concurrency = 1;
  }

  return returnValues;
}

function showHelp() {
  console.log(`
    test command for npm
  
    NAME
      test - Run the automated tests with testCafe
  
    SYNOPSIS
      test [OPTION]...
  
    DESCRIPTION
      Run the automated E2E tests in single or multiple browsers with testCafe. Can be used to run all the tests or just a few of them. Also can be used to run the tests in parallel with concurrency.
  
    OPTIONS
      -b, --browsers
        Define the browsers to run the tests on. If not defined, the tests will run on all the browsers. 
        If multiple browsers are defined, they should be sent inside a string separated by spaces. Example: "chrome firefox". 
        If "remote" is defined, the tests will run on a remote browser. Remote browser does not work with other browsers. Example: "remote chrome" will not work. "remote" will work.
  
      -a-b, --all-browsers
        Run the tests on all the browsers. This is the default option if no browsers are defined.
  
      -t, --tests
        Define the tests suites to run. If not defined, all the tests will run. If multiple tests are defined, they should be sent inside a string separated by spaces. Example: "test1 test2"
  
      -a-t, --all-tests
        Run all the tests. This is the default option if no tests are defined.
  
      -c, --concurrency
        Define the number of tests to run in parallel. If not defined, the tests will run in sequence. Example: 3
  
      -on, --onlinemode
        Define the online mode. This will run the tests on browserstack.
  
      -h, --help
        Show this help message
  
    EXAMPLES
      Run all the tests in all browsers sequence
        npm run test -- -a-b -a-t
  
      Run all the tests in all browsers with parallelism of 3
        npm run test -- -a-b -a-t -c 3
  
      Run the tests "test1" and "test2" in chrome and firefox with parallelism of 3
        npm run test -- -b "chrome firefox" -t "test1 test2" -c 3
  
      Run the tests "test1" and "test2" in chrome and firefox in sequence
        npm run test -- -b "chrome firefox" -t "test1 test2"
  
    EXIT STATUS
      0   if OK,
      1   if there are failed tests,
  
    AUTHOR
      Written by Carlos Gabriel Silva Stedile and Demian Levy Polat.
    `);
}

function getAllTestSuites() {
  const allTests: any = {};
  try {
    fs.readdirSync("tests/E2E/suites").map((fileName) => {
      if (!fileName.includes(".test.ts") || fileName.includes(".bak")) return;
      const testName = fileName.replace(".test.ts", "");
      const testDirectory = path.join(__dirname, "suites", fileName);
      allTests[testName] = testDirectory;
    });
  } catch (e) {
    fs.readdirSync("E2E/suites").map((fileName) => {
      if (!fileName.includes(".test.ts") || fileName.includes(".bak")) return;
      const testName = fileName.replace(".test.ts", "");
      const testDirectory = path.join(__dirname, "suites", fileName);
      allTests[testName] = testDirectory;
    });
  }
  return allTests;
}
