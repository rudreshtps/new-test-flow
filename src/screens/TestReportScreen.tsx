import { useParams, useSearchParams } from "react-router-dom";
import TestPageShell from "../components/TestPageShell";
import TestReportContent from "../test/TestReportContent";
import { decodeTestNameFromPath } from "../test/testRoutes";

export default function TestReportScreen() {
  const { reportId: testName } = useParams<{ reportId?: string }>();
  const [searchParams] = useSearchParams();
  const isDetailView = !!(
    decodeTestNameFromPath(testName) && searchParams.get("test_id")
  );

  return (
    <TestPageShell
      showCardSearch
      searchPlaceholder={isDetailView ? "Search students..." : "Search tests..."}
      searchAriaLabel={isDetailView ? "Search students" : "Search tests"}
    >
      <TestReportContent />
    </TestPageShell>
  );
}
