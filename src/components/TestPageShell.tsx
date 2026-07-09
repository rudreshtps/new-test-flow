import React, { createContext, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./TestPageShell.css";

const TestCardSearchQueryContext = createContext("");

export const useTestCardSearchQuery = () =>
  useContext(TestCardSearchQueryContext);

type TestPageShellProps = {
  children: React.ReactNode;
  showCardSearch?: boolean;
  headerExtra?: React.ReactNode;
};

const navTabClass = (active: boolean) =>
  `me-2 pt-2 px-5 bg-white border-0${active ? " text-primary fw-semibold" : " text-dark"}`;

const TestPageShell: React.FC<TestPageShellProps> = ({
  children,
  showCardSearch = false,
  headerExtra,
}) => {
  const { pathname } = useLocation();

  const createActive =
    pathname === "/" ||
    pathname.includes("/create-test");
  const assignActive =
    pathname.includes("/assign-test") ||
    pathname.includes("/level-rules") ||
    pathname.includes("/time-question-sets");
  const liveActive =
    pathname.includes("/live-monitor") ||
    pathname.includes("/question-swap") ||
    pathname.includes("/change-duration") ||
    pathname.includes("/attendance");

  return (
    <TestCardSearchQueryContext.Provider value="">
      <div
        className="border rounded-2 bg-white my-2 me-2 d-flex flex-column test-page-shell"
        style={{ height: "calc(100vh - 88px)", overflow: "hidden" }}
      >
        <div className="flex-shrink-0 px-2 pt-2">
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center flex-wrap">
              <span className={navTabClass(createActive)}>
                <NavLink to="/create-test" className="text-decoration-none text-reset">
                  Create
                </NavLink>
              </span>
              <span className={navTabClass(assignActive)}>
                <NavLink to="/assign-test" className="text-decoration-none text-reset">
                  Assign
                </NavLink>
              </span>
              <span className={navTabClass(liveActive)}>
                <NavLink to="/live-monitor" className="text-decoration-none text-reset">
                  Live
                </NavLink>
              </span>
              {headerExtra}
            </div>
            {showCardSearch && (
              <div className="flex-shrink-0 ms-auto">
                <input
                  className="form-control form-control-sm"
                  placeholder="Search tests..."
                  style={{ width: 200 }}
                />
              </div>
            )}
          </div>
          <hr className="m-0 mt-2 p-0" />
        </div>
        <div
          className="flex-grow-1 overflow-auto px-2 position-relative"
          style={{ minHeight: 0 }}
        >
          {children}
        </div>
      </div>
    </TestCardSearchQueryContext.Provider>
  );
};

export default TestPageShell;
