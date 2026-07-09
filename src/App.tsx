import { Routes, Route } from "react-router-dom";
import MockLayout from "./components/MockLayout";
import OverviewScreen from "./screens/OverviewScreen";
import CreateTestScreen from "./screens/CreateTestScreen";
import AssignTestListScreen from "./screens/AssignTestListScreen";
import AssignTestScreen from "./screens/AssignTestScreen";
import LevelRulesScreen from "./screens/LevelRulesScreen";
import TimeQuestionSetsScreen from "./screens/TimeQuestionSetsScreen";
import LiveMonitorScreen from "./screens/LiveMonitorScreen";
import QuestionSwapScreen from "./screens/QuestionSwapScreen";
import ChangeDurationScreen from "./screens/ChangeDurationScreen";
import AttendanceScreen from "./screens/AttendanceScreen";
import TriggeredTestsScreen from "./screens/TriggeredTestsScreen";
import CompletedTestsScreen from "./screens/CompletedTestsScreen";
import TestReportsScreen from "./screens/TestReportsScreen";
import TrainerPerformanceScreen from "./screens/TrainerPerformanceScreen";
import CourseConfigScreen from "./screens/CourseConfigScreen";

export default function App() {
  return (
    <Routes>
      <Route element={<MockLayout />}>
        <Route index element={<OverviewScreen />} />
        <Route path="create-test" element={<CreateTestScreen />} />
        <Route path="assign-test" element={<AssignTestListScreen />} />
        <Route path="assign-test/:testId" element={<AssignTestScreen />} />
        <Route path="level-rules" element={<LevelRulesScreen />} />
        <Route path="time-question-sets" element={<TimeQuestionSetsScreen />} />
        <Route path="live-monitor" element={<LiveMonitorScreen />} />
        <Route path="question-swap" element={<QuestionSwapScreen />} />
        <Route path="change-duration" element={<ChangeDurationScreen />} />
        <Route path="attendance" element={<AttendanceScreen />} />
        <Route path="triggered-tests" element={<TriggeredTestsScreen />} />
        <Route path="completed-tests" element={<CompletedTestsScreen />} />
        <Route path="test-reports" element={<TestReportsScreen />} />
        <Route path="trainer-performance" element={<TrainerPerformanceScreen />} />
        <Route path="course-config" element={<CourseConfigScreen />} />
      </Route>
    </Routes>
  );
}
