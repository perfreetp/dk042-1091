import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, PenTool, TestTube, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "任务看板", end: true },
  { to: "/samples", icon: BookOpen, label: "样本库", end: true },
];

const taskNavItems = [
  { to: "/task/:id/prompts", icon: PenTool, label: "提示词编辑" },
  { to: "/task/:id/test", icon: TestTube, label: "批量测试" },
  { to: "/task/:id/results", icon: BarChart3, label: "评分统计" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const match = location.pathname.match(/task\/([^/]+)/);
  const taskId = match?.[1];

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-slate-900 h-screen flex flex-col transition-all duration-300 overflow-hidden`}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          AB
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-sm whitespace-nowrap">
            提示词实验室
          </span>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "text-amber-400 bg-slate-800"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}

        {taskId && (
          <>
            <div className="my-2 border-t border-slate-700" />
            {taskNavItems.map((item) => {
              const to = item.to.replace(":id", taskId);
              return (
                <NavLink
                  key={item.to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "text-amber-400 bg-slate-800"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-4 text-slate-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
