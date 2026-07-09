import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { MdOutlineQuiz } from "react-icons/md";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", path: "/" },
  {
    label: "Tests",
    subMenu: [
      { label: "Create", path: "/create-test" },
      { label: "Assign", path: "/assign-test" },
      { label: "Triggered", path: "/triggered-tests" },
      { label: "Completed", path: "/completed-tests" },
      { label: "Level Rules", path: "/level-rules" },
      { label: "Question Sets", path: "/time-question-sets" },
      { label: "Live Monitor", path: "/live-monitor" },
    ],
  },
];

export default function MockLayout() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState("Tests");
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const formattedTitle = pathSegments.length
    ? pathSegments.map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" > ")
    : "Overview";

  return (
    <div style={{ backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
      <div
        className="d-flex flex-column bg-light shadow"
        style={{
          width: showSidebar ? "180px" : "60px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          overflow: "auto",
          borderRight: "1px solid #ccc",
        }}
      >
        <header
          className="d-flex"
          style={{ cursor: "pointer" }}
          onClick={() => setShowSidebar((p) => !p)}
        >
          <span className="mb-0 fs-2 ps-2 fw-bolder text-start">EU</span>
        </header>

        <div className="mt-3" style={{ fontSize: "14px" }}>
          {SIDEBAR_ITEMS.map((item) => (
            <div key={item.label}>
              {item.subMenu ? (
                <>
                  <div
                    className="d-flex align-items-center p-2 px-3 mb-1 hover-bg-primary"
                    style={{ cursor: "pointer" }}
                    onClick={() => setOpenSubMenu(openSubMenu === item.label ? "" : item.label)}
                  >
                    <MdOutlineQuiz size={22} className="me-2 flex-shrink-0" />
                    {showSidebar && <span>{item.label}</span>}
                  </div>
                  {showSidebar && openSubMenu === item.label && (
                    <div className="ps-4">
                      {item.subMenu.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive }) =>
                            `d-block py-1 px-2 mb-1 text-decoration-none${isActive ? " text-primary fw-semibold" : " text-dark"}`
                          }
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `d-flex align-items-center p-2 px-3 mb-1 text-decoration-none hover-bg-primary${isActive ? " text-primary fw-semibold" : " text-dark"}`
                  }
                >
                  {showSidebar && <span>{item.label}</span>}
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginLeft: showSidebar ? "190px" : "70px", backgroundColor: "#f0f0f0" }}>
        <div className="pe-2">
          <div className="container-fluid bg-white border rounded-2 p-3 d-flex justify-content-between me-5">
            <span className="text-center fs-6">{formattedTitle}</span>
            <span className="text-secondary small">admin@lms.com</span>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
