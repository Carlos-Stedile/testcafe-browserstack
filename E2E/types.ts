export enum OS {
  Windows = "win32",
  Linux = "linux",
  MacOS = "darwin",
}

export type TestParams = {
  browsers?: string[];
  testSuites?: string[];
  concurrency?: number;
  onlineMode?: boolean;
};
