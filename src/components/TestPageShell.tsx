import React, { createContext, useContext, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import TestCardSearch from "./TestCardSearch";
import { useCardSearch } from "../hooks/useCardSearch";
import {
  isTestConfigurePath,
  isTestCreatePath,
  isTestReportsPath,
} from "../test/testRoutes";
import "../styles/Test.css";

const TestCardSearchQueryContext = createContext("");

export const useTestCardSearchQuery = () =>
  useContext(TestCardSearchQueryContext);

type TestPageShellProps = {
  children: React.ReactNode;
  showCardSearch?: boolean;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  headerExtra?: React.ReactNode;
};

const navTabClass = (active: boolean) =>
  `me-2 pt-2 px-5 bg-white border-0${active ? " text-primary fw-semibold" : " text-dark"}`;

const TestPageShell: React.FC<TestPageShellProps> = ({
  children,
  showCardSearch = true,
  searchPlaceholder = "Search tests...",
  searchAriaLabel = "Search tests",
  headerExtra,
}) => {
  const { pathname } = useLocation();
  const {
    cardSearchOpen,
    setCardSearchOpen,
    cardSearchInput,
    cardSearchQuery,
    cardSearchInputRef,
    handleCardSearchInputChange,
  } = useCardSearch();

  useEffect(() => {
    setCardSearchOpen(false);
    handleCardSearchInputChange("");
  }, [pathname, setCardSearchOpen, handleCardSearchInputChange]);

  const createActive = isTestCreatePath(pathname);
  const configureActive = isTestConfigurePath(pathname);
  const reportsActive = isTestReportsPath(pathname);

  return (
    <TestCardSearchQueryContext.Provider
      value={showCardSearch ? cardSearchQuery : ""}
    >
      <div
        className="border rounded-2 bg-white my-2 me-2 d-flex flex-column test-page-shell"
        style={{ height: "calc(100vh - 88px)", overflow: "hidden" }}
      >
        <div className="flex-shrink-0 px-2 pt-2">
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center flex-wrap">
              <span className={navTabClass(createActive)}>
                <NavLink
                  to="/create-test"
                  className="text-decoration-none text-reset"
                >
                  Create
                </NavLink>
              </span>
              <span className={navTabClass(configureActive)}>
                <NavLink
                  to="/assign-test"
                  className="text-decoration-none text-reset"
                >
                  Configure
                </NavLink>
              </span>
              <span className={navTabClass(reportsActive)}>
                <NavLink
                  to="/test-reports"
                  className="text-decoration-none text-reset"
                >
                  Reports
                </NavLink>
              </span>
              {headerExtra}
            </div>
            {showCardSearch && (
              <div className="flex-shrink-0 ms-auto">
                <TestCardSearch
                  cardSearchOpen={cardSearchOpen}
                  setCardSearchOpen={setCardSearchOpen}
                  cardSearchInput={cardSearchInput}
                  cardSearchInputRef={cardSearchInputRef}
                  onInputChange={handleCardSearchInputChange}
                  placeholder={searchPlaceholder}
                  ariaLabel={searchAriaLabel}
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
