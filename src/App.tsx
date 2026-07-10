import { Routes, Route, Navigate } from "react-router-dom";
import MockLayout from "./components/MockLayout";
import CreateTestScreen from "./screens/CreateTestScreen";
import AssignTestListScreen from "./screens/AssignTestListScreen";
import AssignTestScreen from "./screens/AssignTestScreen";
import TriggeredTestsScreen from "./screens/TriggeredTestsScreen";
import CompletedTestsScreen from "./screens/CompletedTestsScreen";
import TestReportScreen from "./screens/TestReportScreen";

export default function App() {
  return (
    <Routes>
      <Route element={<MockLayout />}>
        <Route index element={<Navigate to="/create-test" replace />} />
        <Route path="create-test" element={<CreateTestScreen />} />
        <Route path="assign-test" element={<AssignTestListScreen />} />
        <Route path="assign-test/:testId" element={<AssignTestScreen />} />
        <Route path="triggered-tests" element={<TriggeredTestsScreen />} />
        <Route path="completed-tests" element={<CompletedTestsScreen />} />
        <Route path="test-reports" element={<TestReportScreen />} />
        <Route path="test-reports/:reportId" element={<TestReportScreen />} />
      </Route>
    </Routes>
  );
}
