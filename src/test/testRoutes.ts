import { useMemo } from "react";

export function decodeTestNameFromPath(
  testNameParam: string | undefined
): string | undefined {
  if (!testNameParam) return undefined;
  try {
    return decodeURIComponent(testNameParam);
  } catch {
    return testNameParam;
  }
}

export function useTestRoutes() {
  return useMemo(
    () => ({
      create: "/create-test",
      configure: "/assign-test",
      reports: "/test-reports",
      reportDetail: (title: string, testId: string) =>
        `/test-reports/${encodeURIComponent(title)}?test_id=${encodeURIComponent(testId)}`,
    }),
    []
  );
}

export function isTestCreatePath(pathname: string): boolean {
  return pathname.includes("/create-test");
}

export function isTestConfigurePath(pathname: string): boolean {
  return (
    pathname.includes("/assign-test") ||
    pathname.includes("/triggered-tests") ||
    pathname.includes("/completed-tests")
  );
}

export function isTestReportsPath(pathname: string): boolean {
  return pathname.includes("/test-reports");
}
