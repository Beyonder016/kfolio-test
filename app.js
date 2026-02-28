const desktop = document.getElementById("desktop");
const windows = Array.from(document.querySelectorAll(".window"));
const dockButtons = Array.from(document.querySelectorAll(".dock-icon"));
const desktopIcons = Array.from(document.querySelectorAll(".desktop-icon"));
const iconsContainer = document.querySelector(".desktop-icons");
const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");
const menuRoot = document.querySelector(".menu-root");
const menuOptions = Array.from(document.querySelectorAll(".menu-option"));
const topbar = document.querySelector(".topbar");
const topMenuButtons = Array.from(document.querySelectorAll(".menu-item-button"));
const dock = document.querySelector(".dock");
const appearanceOptions = Array.from(
  document.querySelectorAll(".appearance-option"),
);
const backgroundOptions = Array.from(document.querySelectorAll(".bg-option"));

let zIndexCounter = 10;

if (desktop) {
  desktop.dataset.bg = desktop.dataset.bg || "beach";
}

if (document.body) {
  document.body.dataset.grid = document.body.dataset.grid || "on";
}

const isCompactLayout = () => window.matchMedia("(max-width: 760px)").matches;

const syncLayoutVars = () => {
  if (!desktop) {
    return;
  }
  const topbarHeight = topbar
    ? Math.round(topbar.getBoundingClientRect().height || 40)
    : 40;
  const dockHeight = dock ? Math.round(dock.getBoundingClientRect().height || 70) : 70;
  desktop.style.setProperty("--topbar-actual-height", `${topbarHeight}px`);
  desktop.style.setProperty("--dock-actual-height", `${dockHeight}px`);
};

const bringToFront = (win) => {
  zIndexCounter += 1;
  win.style.zIndex = zIndexCounter;
};

const setDockActive = (id, isActive) => {
  dockButtons.forEach((button) => {
    if (button.dataset.window === id) {
      button.classList.toggle("active", isActive);
    }
  });
};

const openWindow = (id) => {
  const win = document.getElementById(id);
  if (!win) {
    return;
  }
  win.classList.add("is-open");
  win.classList.remove("is-minimized");
  win.setAttribute("aria-hidden", "false");
  bringToFront(win);
  setDockActive(id, true);
};

const closeWindow = (win) => {
  win.classList.remove("is-open", "is-minimized", "is-maximized");
  win.setAttribute("aria-hidden", "true");
  setDockActive(win.id, false);
};

const minimizeWindow = (win) => {
  win.classList.add("is-minimized");
  setDockActive(win.id, true);
};

const toggleMaximize = (win) => {
  win.classList.toggle("is-maximized");
};

const getOpenWindows = () =>
  windows.filter((win) => win.classList.contains("is-open"));

const getActiveWindow = () => {
  let active = null;
  let highestZ = -Infinity;
  getOpenWindows().forEach((win) => {
    if (win.classList.contains("is-minimized")) {
      return;
    }
    const zValue = Number.parseInt(win.style.zIndex || "0", 10);
    if (zValue >= highestZ) {
      highestZ = zValue;
      active = win;
    }
  });
  return active || getOpenWindows()[0] || null;
};

const closeActiveWindow = () => {
  const active = getActiveWindow();
  if (!active) {
    return false;
  }
  closeWindow(active);
  return true;
};

const minimizeActiveWindow = () => {
  const active = getActiveWindow();
  if (!active) {
    return false;
  }
  minimizeWindow(active);
  return true;
};

const maximizeActiveWindow = () => {
  const active = getActiveWindow();
  if (!active) {
    return false;
  }
  toggleMaximize(active);
  return true;
};

const minimizeAllWindows = () => {
  const opened = getOpenWindows();
  opened.forEach((win) => minimizeWindow(win));
  return opened.length;
};

const closeAllWindows = () => {
  const opened = getOpenWindows();
  opened.forEach((win) => closeWindow(win));
  return opened.length;
};

const restoreAllWindows = () => {
  const opened = getOpenWindows();
  opened.forEach((win) => {
    win.classList.remove("is-minimized");
    setDockActive(win.id, true);
    bringToFront(win);
  });
  return opened.length;
};

const cascadeWindows = () => {
  if (!desktop) {
    return 0;
  }
  const opened = getOpenWindows();
  if (opened.length === 0) {
    return 0;
  }
  const deskRect = desktop.getBoundingClientRect();
  const startX = 24;
  const startY = 72;
  const step = 34;
  opened.forEach((win, index) => {
    win.classList.remove("is-minimized", "is-maximized");
    const maxX = Math.max(startX, deskRect.width - win.offsetWidth - 12);
    const maxY = Math.max(startY, deskRect.height - win.offsetHeight - 12);
    const x = Math.min(startX + index * step, maxX);
    const y = Math.min(startY + index * step, maxY);
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
    bringToFront(win);
  });
  return opened.length;
};

windows.forEach((win) => {
  win.addEventListener("mousedown", () => bringToFront(win));
  const titlebar = win.querySelector(".window-titlebar");
  if (titlebar) {
    titlebar.addEventListener("mousedown", (event) => startDrag(event, win));
  }

  win.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = button.dataset.action;
      if (action === "close") {
        closeWindow(win);
      }
      if (action === "minimize") {
        minimizeWindow(win);
      }
      if (action === "maximize") {
        toggleMaximize(win);
      }
    });
  });
});

desktopIcons.forEach((icon) => {
  icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));
  icon.addEventListener("click", () => {
    if (isCompactLayout()) {
      openWindow(icon.dataset.window);
    }
  });
});

const layoutDesktopIcons = () => {
  if (!iconsContainer || desktopIcons.length === 0) {
    return;
  }

  const containerRect = iconsContainer.getBoundingClientRect();
  const gapX = 96;
  const gapY = 96;
  let column = 0;
  let row = 0;

  desktopIcons.forEach((icon) => {
    const existingX = Number(icon.dataset.x);
    const existingY = Number(icon.dataset.y);
    const hasStoredPosition =
      Number.isFinite(existingX) && Number.isFinite(existingY);

    if (hasStoredPosition) {
      icon.style.left = `${existingX}px`;
      icon.style.top = `${existingY}px`;
      return;
    }

    const iconHeight = icon.offsetHeight || 80;
    let nextY = row * gapY;
    if (nextY + iconHeight > containerRect.height && row > 0) {
      row = 0;
      column += 1;
      nextY = 0;
    }
    const nextX = column * gapX;
    icon.style.left = `${nextX}px`;
    icon.style.top = `${nextY}px`;
    icon.dataset.x = `${nextX}`;
    icon.dataset.y = `${nextY}`;
    row += 1;
  });
};

const clampIconToBounds = (icon) => {
  if (!iconsContainer) {
    return;
  }
  const containerRect = iconsContainer.getBoundingClientRect();
  const maxX = Math.max(0, containerRect.width - icon.offsetWidth);
  const maxY = Math.max(0, containerRect.height - icon.offsetHeight);
  let x = Number(icon.dataset.x);
  let y = Number(icon.dataset.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }
  x = Math.max(0, Math.min(x, maxX));
  y = Math.max(0, Math.min(y, maxY));
  icon.dataset.x = `${x}`;
  icon.dataset.y = `${y}`;
  icon.style.left = `${x}px`;
  icon.style.top = `${y}px`;
};

let iconDragState = null;

const startIconDrag = (event, icon) => {
  if (isCompactLayout() || !iconsContainer) {
    return;
  }
  if (typeof event.button === "number" && event.button !== 0) {
    return;
  }
  event.preventDefault();
  const containerRect = iconsContainer.getBoundingClientRect();
  const iconRect = icon.getBoundingClientRect();
  iconDragState = {
    icon,
    containerRect,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - iconRect.left,
    offsetY: event.clientY - iconRect.top,
    hasMoved: false,
  };
  icon.setPointerCapture(event.pointerId);
};

const moveIconDrag = (event) => {
  if (!iconDragState || event.pointerId !== iconDragState.pointerId) {
    return;
  }
  const { icon, containerRect, offsetX, offsetY, startX, startY } =
    iconDragState;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (!iconDragState.hasMoved && Math.hypot(dx, dy) < 4) {
    return;
  }
  if (!iconDragState.hasMoved) {
    iconDragState.hasMoved = true;
    icon.classList.add("is-dragging");
  }
  const maxX = Math.max(0, containerRect.width - icon.offsetWidth);
  const maxY = Math.max(0, containerRect.height - icon.offsetHeight);
  let nextX = event.clientX - containerRect.left - offsetX;
  let nextY = event.clientY - containerRect.top - offsetY;
  nextX = Math.max(0, Math.min(nextX, maxX));
  nextY = Math.max(0, Math.min(nextY, maxY));
  icon.style.left = `${nextX}px`;
  icon.style.top = `${nextY}px`;
  icon.dataset.x = `${Math.round(nextX)}`;
  icon.dataset.y = `${Math.round(nextY)}`;
};

const stopIconDrag = (event) => {
  if (!iconDragState || event.pointerId !== iconDragState.pointerId) {
    return;
  }
  iconDragState.icon.classList.remove("is-dragging");
  iconDragState = null;
};

desktopIcons.forEach((icon) => {
  icon.addEventListener("pointerdown", (event) => startIconDrag(event, icon));
});

window.addEventListener("pointermove", moveIconDrag);
window.addEventListener("pointerup", stopIconDrag);
window.addEventListener("pointercancel", stopIconDrag);

const syncIconBounds = () => {
  desktopIcons.forEach((icon) => clampIconToBounds(icon));
};

const applyIconLayoutMode = () => {
  if (isCompactLayout()) {
    desktopIcons.forEach((icon) => {
      icon.style.left = "";
      icon.style.top = "";
    });
    return;
  }
  layoutDesktopIcons();
  syncIconBounds();
};

requestAnimationFrame(() => {
  syncLayoutVars();
  applyIconLayoutMode();
});

window.addEventListener("resize", () => {
  syncLayoutVars();
  applyIconLayoutMode();
  if (activeTopMenuButton) {
    positionTopMenu(activeTopMenuButton);
  }
});

dockButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.window;
    const win = document.getElementById(id);
    if (!win) {
      return;
    }
    const isOpen = win.classList.contains("is-open");
    const isMinimized = win.classList.contains("is-minimized");
    if (isOpen && !isMinimized) {
      minimizeWindow(win);
      return;
    }
    openWindow(id);
  });
});

const closeMenu = () => {
  if (!menuDropdown || !menuToggle) {
    return;
  }
  menuDropdown.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

if (menuToggle && menuDropdown) {
  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menuDropdown.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (menuRoot && !menuRoot.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

menuOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const action = option.dataset.menuAction;
    if (action === "settings") {
      openWindow("window-settings");
    }
    if (action === "about") {
      openWindow("window-about");
    }
    if (action === "portfolio") {
      openWindow("window-computer");
    }
    closeMenu();
  });
});

let dragState = null;

const startDrag = (event, win) => {
  if (isCompactLayout()) {
    return;
  }
  if (event.button !== 0) {
    return;
  }
  if (win.classList.contains("is-maximized")) {
    return;
  }
  if (event.target.closest(".window-controls")) {
    return;
  }
  event.preventDefault();
  const deskRect = desktop.getBoundingClientRect();
  const winRect = win.getBoundingClientRect();
  dragState = {
    win,
    deskRect,
    offsetX: event.clientX - winRect.left,
    offsetY: event.clientY - winRect.top,
  };
  bringToFront(win);
};

const dragMove = (event) => {
  if (!dragState) {
    return;
  }
  const { win, deskRect, offsetX, offsetY } = dragState;
  const maxX = deskRect.width - win.offsetWidth - 10;
  const maxY = deskRect.height - win.offsetHeight - 10;
  let nextX = event.clientX - deskRect.left - offsetX;
  let nextY = event.clientY - deskRect.top - offsetY;
  nextX = Math.max(10, Math.min(nextX, maxX));
  nextY = Math.max(60, Math.min(nextY, maxY));
  win.style.left = `${nextX}px`;
  win.style.top = `${nextY}px`;
};

const stopDrag = () => {
  dragState = null;
};

window.addEventListener("mousemove", dragMove);
window.addEventListener("mouseup", stopDrag);

const clockEl = document.getElementById("clock");
let showClockSeconds = false;
let clockTimerId = null;

const updateClock = () => {
  if (!clockEl) {
    return;
  }
  const now = new Date();
  const weekday = now
    .toLocaleString("en-US", { weekday: "short" })
    .toUpperCase();
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = now.getDate();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const timeText = showClockSeconds
    ? `${hours}:${minutes}:${seconds} ${ampm}`
    : `${hours}:${minutes} ${ampm}`;
  clockEl.textContent = `${weekday} ${month} ${day} ${timeText}`;
};

const startClockTicker = () => {
  if (clockTimerId) {
    clearInterval(clockTimerId);
  }
  clockTimerId = window.setInterval(updateClock, showClockSeconds ? 1000 : 60000);
};

const setClockSeconds = (enabled) => {
  showClockSeconds = Boolean(enabled);
  updateClock();
  startClockTicker();
};

updateClock();
startClockTicker();

const computerBreadcrumb = document.getElementById("computer-breadcrumb");
const computerList = document.getElementById("computer-list");
const computerPreview = document.getElementById("computer-preview");
const computerBack = document.getElementById("computer-back");
const sidebarButtons = Array.from(document.querySelectorAll(".sidebar-item"));

const computerViews = {
  portfolio: {
    label: "Portfolio",
    items: [
      { title: "Projects", openView: "projects" },
      { title: "Skills", openView: "skills" },
      { title: "Education", openView: "education" },
      { title: "Certifications", openView: "certifications" },
      { title: "Profile Highlights", openView: "references" },
    ],
  },
  projects: {
    label: "Projects",
    items: [
      {
        title: "Snowflake Data Warehouse Project",
        subtitle: "Cloud Data Platform",
        description:
          "Designed and queried structured datasets in Snowflake for analytics and reporting-focused use cases.",
        tags: ["Snowflake", "Data Warehouse", "SQL"],
      },
      {
        title: "ETL Pipeline Automation",
        subtitle: "Python and SQL",
        description:
          "Built data cleaning, transformation, and load workflows to move raw inputs into analysis-ready tables.",
        tags: ["ETL", "Python", "SQL"],
      },
      {
        title: "Sales Analytics Dashboard Dataset",
        subtitle: "Reporting Pipeline",
        description:
          "Prepared KPI-oriented datasets and reporting views for business tracking and performance monitoring.",
        tags: ["Analytics", "Data Modeling", "Dashboard"],
      },
      {
        title: "Data Quality Check Framework",
        subtitle: "Validation and Governance",
        description:
          "Implemented consistency and completeness checks to reduce errors before downstream reporting.",
        tags: ["Data Quality", "Validation", "Governance"],
      },
    ],
  },
  skills: {
    label: "Skills",
    items: [
      {
        title: "Data Platform and Querying",
        subtitle: "Core stack",
        description:
          "Snowflake, SQL, data warehousing concepts, schema design, and query optimization basics.",
        tags: ["Snowflake", "SQL", "Data Warehousing"],
      },
      {
        title: "Programming and Processing",
        subtitle: "Workflow implementation",
        description:
          "Python, Pandas, NumPy, and ETL workflow logic for transformation and structured output generation.",
        tags: ["Python", "Pandas", "ETL"],
      },
      {
        title: "Reporting and Analysis",
        subtitle: "Business insights",
        description:
          "Data analysis, KPI preparation, Excel and dashboard-ready datasets for stakeholder visibility.",
        tags: ["Data Analysis", "Excel", "Dashboarding"],
      },
      {
        title: "Tooling and Collaboration",
        subtitle: "Project delivery",
        description:
          "Git-based version control, documentation, and structured collaboration in team project environments.",
        tags: ["Git", "Documentation", "Teamwork"],
      },
    ],
  },
  education: {
    label: "Education",
    items: [
      {
        title: "B.E./B.TECH",
        subtitle: "[College Name] - [Year]",
        description:
          "Undergraduate program focused on technical fundamentals and project-based learning.",
        tags: ["Undergraduate", "Engineering"],
      },
      {
        title: "Higher Secondary",
        subtitle: "[School Name]",
        description: "Completed higher secondary education.",
        tags: ["Higher Secondary"],
      },
      {
        title: "Secondary School",
        subtitle: "[School Name]",
        description: "Completed secondary school education.",
        tags: ["Secondary School"],
      },
    ],
  },
  certifications: {
    label: "Certifications",
    items: [
      {
        title: "Snowflake Data Engineering Track",
        subtitle: "Hands-on Practice",
        description:
          "Practical implementation of Snowflake fundamentals, querying, and warehouse-oriented data workflows.",
        tags: ["Snowflake", "Data Engineering"],
      },
      {
        title: "SQL and Database Practice",
        subtitle: "Data Querying and Modeling",
        description:
          "Applied SQL for joins, transformations, and table design for reporting-oriented use cases.",
        tags: ["SQL", "Database"],
      },
      {
        title: "Python for Data Workflows",
        subtitle: "Data Processing and Automation",
        description:
          "Used Python tooling for data cleanup, transformation, and reusable analytics scripts.",
        tags: ["Python", "Automation"],
      },
    ],
  },
  references: {
    label: "Profile Highlights",
    items: [
      {
        title: "Data and Snowflake Focus",
        subtitle: "Project-driven learning",
        description:
          "Profile centered on data engineering fundamentals with strong interest in Snowflake-based workflows.",
        tags: ["Data Engineering", "Snowflake"],
      },
      {
        title: "GitHub Portfolio",
        subtitle: "github.com/rkhushii",
        description: "Project code and learning repositories available on GitHub.",
        tags: ["GitHub", "Projects"],
      },
    ],
  },
  about: {
    label: "About",
    items: [
      {
        title: "Khushi R Rajput",
        subtitle: "Snowflake and Data Enthusiast",
        description:
          "Hands-on learner focused on Snowflake, SQL, and Python with practical interest in scalable data and analytics workflows.",
        tags: ["Snowflake", "SQL", "Python"],
      },
      {
        title: "Professional Direction",
        subtitle: "Data Engineering and Analytics",
        description:
          "Interested in ETL, warehousing, and business reporting pipelines that convert raw data into useful insights.",
        tags: ["ETL", "Data Warehousing", "Analytics"],
      },
    ],
  },
  contact: {
    label: "Contact",
    items: [
      {
        title: "Email",
        subtitle: "03rajput.ki@gmail.com",
        description: "Primary email contact.",
        tags: ["Email"],
      },
      {
        title: "Work Email",
        subtitle: "khushi.ranjitsing-rajput@capgemini.com",
        description: "Professional email contact.",
        tags: ["Email"],
      },
      {
        title: "Phone",
        subtitle: "[Phone Number]",
        description: "Direct contact number.",
        tags: ["Phone"],
      },
      {
        title: "Location",
        subtitle: "Mumbai, India",
        description: "Current location.",
        tags: ["Location"],
      },
      {
        title: "GitHub",
        subtitle: "github.com/rkhushii",
        description: "Code repositories and project work.",
        tags: ["GitHub"],
      },
    ],
  },
  experience: {
    label: "Experience",
    items: [
      {
        title: "Data Projects and Practical Work",
        subtitle: "Hands-on Implementation",
        description:
          "Built project-level ETL and analytics workflows using SQL and Python with warehouse-ready output.",
        tags: ["ETL", "SQL", "Python"],
      },
      {
        title: "Snowflake Learning and Delivery",
        subtitle: "Structured Data Workflow Practice",
        description:
          "Worked on Snowflake-centered tasks for data loading, transformations, and reporting support use cases.",
        tags: ["Snowflake", "Data Loading", "Reporting"],
      },
    ],
  },
};

let viewStack = ["portfolio"];

const renderComputerView = () => {
  const viewId = viewStack[viewStack.length - 1];
  const view = computerViews[viewId];
  if (!view) {
    return;
  }

  computerBreadcrumb.textContent = viewStack
    .map((id) => computerViews[id].label.toUpperCase())
    .join(" / ");

  computerBack.disabled = viewStack.length <= 1;

  computerList.innerHTML = "";
  computerPreview.innerHTML =
    '<div class="empty-state">SELECT A FILE TO PREVIEW</div>';

  view.items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-item";
    button.innerHTML = `<svg class="icon small"><use href="#icon-folder"></use></svg><span>${item.title}</span>`;

    button.addEventListener("click", () => {
      const currentItems = Array.from(
        computerList.querySelectorAll(".file-item"),
      );
      currentItems.forEach((node) => node.classList.remove("active"));
      button.classList.add("active");

      if (item.openView) {
        viewStack.push(item.openView);
        renderComputerView();
        return;
      }
      showComputerPreview(viewId, item);
    });

    computerList.appendChild(button);
  });
};

const showComputerPreview = (viewId, item) => {
  const tags = item.tags
    ? `<div class="tags">${item.tags
        .map((tag) => `<span class="tag">${tag.toUpperCase()}</span>`)
        .join("")}</div>`
    : "";

  computerPreview.innerHTML = `
    <h3 class="pixel-title">${item.title.toUpperCase()}</h3>
    <p class="muted">${item.subtitle || ""}</p>
    <p>${item.description || ""}</p>
    ${tags}
  `;

  computerBreadcrumb.textContent = `${viewStack
    .map((id) => computerViews[id].label.toUpperCase())
    .join(" / ")} / ${item.title.toUpperCase()}`;
};

sidebarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.section;
    if (!computerViews[target]) {
      return;
    }
    sidebarButtons.forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    viewStack = [target];
    renderComputerView();
  });
});

computerBack.addEventListener("click", () => {
  if (viewStack.length > 1) {
    viewStack.pop();
    renderComputerView();
  }
});

renderComputerView();

const applyTheme = (theme) => {
  if (!document.body) {
    return;
  }
  document.body.dataset.theme = theme;
};

const setTheme = (theme) => {
  if (!theme) {
    return false;
  }
  const target = appearanceOptions.find((button) => button.dataset.theme === theme);
  if (!target) {
    return false;
  }
  appearanceOptions.forEach((item) => item.classList.remove("active"));
  target.classList.add("active");
  applyTheme(theme);
  return true;
};

const getCurrentTheme = () =>
  (document.body && document.body.dataset.theme) || "light";

const toggleTheme = () => {
  const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  return nextTheme;
};

const setBackground = (bg) => {
  if (!desktop || !bg) {
    return false;
  }
  const target = backgroundOptions.find((button) => button.dataset.bg === bg);
  if (!target) {
    return false;
  }
  backgroundOptions.forEach((item) => item.classList.remove("active"));
  target.classList.add("active");
  desktop.dataset.bg = bg;
  return true;
};

const getCurrentBackground = () => (desktop && desktop.dataset.bg) || "beach";

const cycleBackground = () => {
  if (backgroundOptions.length === 0) {
    return getCurrentBackground();
  }
  const backgrounds = backgroundOptions.map((button) => button.dataset.bg || "beach");
  const current = getCurrentBackground();
  const currentIndex = Math.max(0, backgrounds.indexOf(current));
  const nextBg = backgrounds[(currentIndex + 1) % backgrounds.length];
  setBackground(nextBg);
  return nextBg;
};

const setDesktopGrid = (isVisible) => {
  if (!document.body) {
    return false;
  }
  document.body.dataset.grid = isVisible ? "on" : "off";
  return true;
};

const isDesktopGridVisible = () =>
  !document.body || document.body.dataset.grid !== "off";

const toggleDesktopGrid = () => {
  const nextState = !isDesktopGridVisible();
  setDesktopGrid(nextState);
  return nextState;
};

const initialThemeButton = appearanceOptions.find((button) =>
  button.classList.contains("active"),
);
setTheme((initialThemeButton && initialThemeButton.dataset.theme) || "light");

const initialBackgroundButton = backgroundOptions.find((button) =>
  button.classList.contains("active"),
);
setBackground(
  (initialBackgroundButton && initialBackgroundButton.dataset.bg) ||
    (desktop && desktop.dataset.bg) ||
    "beach",
);

setDesktopGrid(true);

appearanceOptions.forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(button.dataset.theme || "light");
  });
});

backgroundOptions.forEach((button) => {
  button.addEventListener("click", () => {
    setBackground(button.dataset.bg || "beach");
  });
});

const guestbookName = document.getElementById("guestbook-name");
const guestbookMessage = document.getElementById("guestbook-message");
const guestbookSubmit = document.getElementById("guestbook-submit");
const guestbookCount = document.getElementById("guestbook-count");
const guestbookEntries = document.getElementById("guestbook-entries");
const emojiButtons = Array.from(document.querySelectorAll(".emoji-button"));
const activeEmojiButton = emojiButtons.find((button) =>
  button.classList.contains("active"),
);

let selectedEmoji =
  (activeEmojiButton && activeEmojiButton.dataset.emoji) || ":)";

const updateGuestbookCount = () => {
  if (!guestbookMessage || !guestbookCount) {
    return;
  }
  guestbookCount.textContent = `${guestbookMessage.value.length}`;
};

const setSelectedEmoji = (button) => {
  if (!button) {
    return;
  }
  emojiButtons.forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  selectedEmoji = button.dataset.emoji || ":)";
};

emojiButtons.forEach((button) => {
  button.addEventListener("click", () => setSelectedEmoji(button));
});

const formatDate = (date) => {
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
};

const addGuestbookEntry = ({ name, message, emoji }) => {
  if (!guestbookEntries) {
    return;
  }
  const entry = document.createElement("div");
  entry.className = "guestbook-entry";

  const title = document.createElement("div");
  title.className = "entry-title";

  const emojiEl = document.createElement("span");
  emojiEl.className = "entry-emoji";
  emojiEl.textContent = emoji;

  const nameEl = document.createElement("span");
  nameEl.className = "entry-name";
  nameEl.textContent = name || "ANON";

  const dateEl = document.createElement("span");
  dateEl.className = "entry-date";
  dateEl.textContent = formatDate(new Date());

  title.append(emojiEl, nameEl, dateEl);

  const messageEl = document.createElement("div");
  messageEl.className = "entry-message";
  messageEl.textContent = message;

  entry.append(title, messageEl);
  guestbookEntries.prepend(entry);
};

if (guestbookMessage) {
  guestbookMessage.addEventListener("input", updateGuestbookCount);
}

if (guestbookSubmit) {
  guestbookSubmit.addEventListener("click", () => {
    if (!guestbookMessage) {
      return;
    }
    const nameValue = guestbookName && guestbookName.value.trim();
    const messageValue = guestbookMessage.value.trim();
    if (!messageValue) {
      guestbookMessage.focus();
      return;
    }
    addGuestbookEntry({
      name: nameValue ? nameValue.toUpperCase() : "ANON",
      message: messageValue.toUpperCase(),
      emoji: selectedEmoji,
    });
    guestbookMessage.value = "";
    updateGuestbookCount();
  });
}

updateGuestbookCount();

const musicTitle = document.getElementById("music-title");
const musicSubtitle = document.getElementById("music-subtitle");
const musicPlay = document.getElementById("music-play");
const volumeSlider = document.getElementById("music-volume");
const volumePercent = document.getElementById("music-volume-percent");
const stationButtons = Array.from(document.querySelectorAll(".station-item"));
const audioTracks = Array.from(
  document.querySelectorAll("#window-music audio"),
);

let activeStation =
  stationButtons.find((button) => button.classList.contains("active")) ||
  stationButtons[0];
let currentAudio = activeStation
  ? document.getElementById(activeStation.dataset.audio || "")
  : null;
let isPlaying = false;

const setVolume = () => {
  if (!volumeSlider) {
    return;
  }
  const volumeValue = Number(volumeSlider.value) / 100;
  audioTracks.forEach((audio) => {
    audio.volume = volumeValue;
  });
  if (volumePercent) {
    volumePercent.textContent = `${volumeSlider.value}%`;
  }
};

const updateMusicUI = () => {
  if (activeStation && musicTitle && musicSubtitle) {
    musicTitle.textContent = activeStation.dataset.track || "UNKNOWN";
    musicSubtitle.textContent = activeStation.dataset.genre || "RADIO";
  }
  if (musicPlay) {
    musicPlay.textContent = isPlaying ? "||" : ">";
  }
  stationButtons.forEach((button) => {
    button.classList.toggle(
      "is-playing",
      isPlaying && button === activeStation,
    );
  });
  setVolume();
};

const stopAudio = (audio) => {
  if (!audio) {
    return;
  }
  audio.pause();
  audio.currentTime = 0;
};

const playAudio = async (audio) => {
  if (!audio) {
    return;
  }
  try {
    await audio.play();
    isPlaying = true;
  } catch (error) {
    isPlaying = false;
  }
  updateMusicUI();
};

stationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stationButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeStation = button;
    const nextAudio = document.getElementById(button.dataset.audio || "");
    if (currentAudio && currentAudio !== nextAudio) {
      stopAudio(currentAudio);
    }
    currentAudio = nextAudio;
    isPlaying = true;
    playAudio(currentAudio);
  });
});

if (musicPlay) {
  musicPlay.addEventListener("click", () => {
    if (!currentAudio && activeStation) {
      currentAudio = document.getElementById(activeStation.dataset.audio || "");
    }
    if (isPlaying) {
      stopAudio(currentAudio);
      isPlaying = false;
      updateMusicUI();
      return;
    }
    playAudio(currentAudio);
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener("input", setVolume);
}

audioTracks.forEach((audio) => {
  audio.addEventListener("ended", () => {
    if (audio === currentAudio) {
      isPlaying = false;
      updateMusicUI();
    }
  });
});

updateMusicUI();

const openComputerSection = (section) => {
  if (!computerViews[section]) {
    return false;
  }
  openWindow("window-computer");
  viewStack = [section];
  sidebarButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  renderComputerView();
  return true;
};

const resetDesktopIconLayout = () => {
  desktopIcons.forEach((icon) => {
    delete icon.dataset.x;
    delete icon.dataset.y;
    icon.style.left = "";
    icon.style.top = "";
  });
  layoutDesktopIcons();
  syncIconBounds();
};

const clearGuestbookDraft = () => {
  if (guestbookName) {
    guestbookName.value = "";
  }
  if (guestbookMessage) {
    guestbookMessage.value = "";
  }
  updateGuestbookCount();
};

let toastTimerId = null;
const topbarToast = topbar ? document.createElement("div") : null;
if (topbar && topbarToast) {
  topbarToast.className = "topbar-toast";
  topbar.appendChild(topbarToast);
}

const showTopbarToast = (message) => {
  if (!topbarToast || !message) {
    return;
  }
  topbarToast.textContent = message.toUpperCase();
  topbarToast.classList.add("is-visible");
  if (toastTimerId) {
    clearTimeout(toastTimerId);
  }
  toastTimerId = window.setTimeout(() => {
    topbarToast.classList.remove("is-visible");
  }, 1700);
};

const isTypingTarget = (target) => {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  );
};

const shortcutHelpText = [
  "KEYBOARD SHORTCUTS",
  "",
  "CTRL+1 OPEN PORTFOLIO",
  "CTRL+2 OPEN ABOUT",
  "CTRL+3 OPEN GUESTBOOK",
  "CTRL+4 OPEN MUSIC",
  "CTRL+5 OPEN SETTINGS",
  "CTRL+W CLOSE ACTIVE WINDOW",
  "CTRL+B NEXT BACKGROUND",
  "CTRL+SHIFT+M MINIMIZE ALL WINDOWS",
  "F1 SHOW THIS HELP",
];

const toolbarActions = {
  "open-computer": () => {
    openWindow("window-computer");
    return "Portfolio opened";
  },
  "open-about": () => {
    openWindow("window-about");
    return "About window opened";
  },
  "open-guestbook": () => {
    openWindow("window-guestbook");
    return "Guestbook opened";
  },
  "open-music": () => {
    openWindow("window-music");
    return "Music window opened";
  },
  "open-settings": () => {
    openWindow("window-settings");
    return "Settings opened";
  },
  "close-active": () =>
    closeActiveWindow() ? "Closed active window" : "No active window",
  "close-all": () => {
    const count = closeAllWindows();
    return count > 0 ? `Closed ${count} window(s)` : "No open windows";
  },
  "reset-icons": () => {
    resetDesktopIconLayout();
    return "Desktop icons reset";
  },
  "clear-guestbook-draft": () => {
    clearGuestbookDraft();
    return "Guestbook draft cleared";
  },
  "copy-email": async () => {
    const email = "03rajput.ki@gmail.com";
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return "Clipboard unavailable";
    }
    try {
      await navigator.clipboard.writeText(email);
      return "Email copied";
    } catch (error) {
      return "Clipboard blocked by browser";
    }
  },
  "open-contact": () => {
    const opened = openComputerSection("contact");
    return opened ? "Contact folder opened" : "Contact folder unavailable";
  },
  "theme-light": () => {
    setTheme("light");
    return "Light theme enabled";
  },
  "theme-dark": () => {
    setTheme("dark");
    return "Dark theme enabled";
  },
  "theme-toggle": () => {
    const nextTheme = toggleTheme();
    return `${nextTheme.toUpperCase()} theme enabled`;
  },
  "background-next": () => {
    const nextBg = cycleBackground();
    return `${nextBg.toUpperCase()} background`;
  },
  "toggle-grid": () => {
    const visible = toggleDesktopGrid();
    return visible ? "Desktop grid enabled" : "Desktop grid hidden";
  },
  "toggle-seconds": () => {
    setClockSeconds(!showClockSeconds);
    return showClockSeconds ? "Clock shows seconds" : "Clock hides seconds";
  },
  "minimize-active": () =>
    minimizeActiveWindow() ? "Minimized active window" : "No active window",
  "maximize-active": () =>
    maximizeActiveWindow() ? "Toggled maximize" : "No active window",
  "bring-front": () => {
    const active = getActiveWindow();
    if (!active) {
      return "No active window";
    }
    bringToFront(active);
    return "Brought active window to front";
  },
  "minimize-all": () => {
    const count = minimizeAllWindows();
    return count > 0 ? `Minimized ${count} window(s)` : "No open windows";
  },
  "restore-all": () => {
    const count = restoreAllWindows();
    return count > 0 ? `Restored ${count} window(s)` : "No open windows";
  },
  "cascade-windows": () => {
    const count = cascadeWindows();
    return count > 0 ? "Windows cascaded" : "No open windows";
  },
  "show-shortcuts": () => {
    window.alert(shortcutHelpText.join("\n"));
    return "";
  },
  "open-github": () => {
    window.open("https://github.com/rkhushii", "_blank", "noopener");
    return "GitHub opened";
  },
  "send-email": () => {
    window.location.href = "mailto:03rajput.ki@gmail.com";
    return "Opening mail app";
  },
};

const topMenuDefinitions = {
  file: [
    { label: "OPEN PORTFOLIO", action: "open-computer", shortcut: "CTRL+1" },
    { label: "OPEN ABOUT", action: "open-about", shortcut: "CTRL+2" },
    { label: "OPEN GUESTBOOK", action: "open-guestbook", shortcut: "CTRL+3" },
    { label: "OPEN MUSIC", action: "open-music", shortcut: "CTRL+4" },
    { label: "OPEN SETTINGS", action: "open-settings", shortcut: "CTRL+5" },
    { type: "separator" },
    { label: "CLOSE ACTIVE WINDOW", action: "close-active", shortcut: "CTRL+W" },
    { label: "CLOSE ALL WINDOWS", action: "close-all" },
  ],
  edit: [
    { label: "RESET ICON LAYOUT", action: "reset-icons" },
    { label: "CLEAR GUESTBOOK DRAFT", action: "clear-guestbook-draft" },
    { label: "COPY PRIMARY EMAIL", action: "copy-email" },
    { type: "separator" },
    { label: "OPEN CONTACT FOLDER", action: "open-contact" },
  ],
  view: [
    {
      label: "LIGHT THEME",
      action: "theme-light",
      checked: () => getCurrentTheme() === "light",
    },
    {
      label: "DARK THEME",
      action: "theme-dark",
      checked: () => getCurrentTheme() === "dark",
    },
    { label: "TOGGLE THEME", action: "theme-toggle" },
    { type: "separator" },
    { label: "NEXT BACKGROUND", action: "background-next", shortcut: "CTRL+B" },
    {
      label: "SHOW DESKTOP GRID",
      action: "toggle-grid",
      checked: () => isDesktopGridVisible(),
    },
    {
      label: "SHOW CLOCK SECONDS",
      action: "toggle-seconds",
      checked: () => showClockSeconds,
    },
  ],
  window: [
    { label: "MINIMIZE ACTIVE", action: "minimize-active" },
    { label: "MAXIMIZE / RESTORE ACTIVE", action: "maximize-active" },
    { label: "BRING ACTIVE TO FRONT", action: "bring-front" },
    { type: "separator" },
    {
      label: "MINIMIZE ALL",
      action: "minimize-all",
      shortcut: "CTRL+SHIFT+M",
    },
    { label: "RESTORE ALL", action: "restore-all" },
    { label: "CASCADE WINDOWS", action: "cascade-windows" },
  ],
  help: [
    { label: "KEYBOARD SHORTCUTS", action: "show-shortcuts", shortcut: "F1" },
    { label: "ABOUT THIS WEB", action: "open-about" },
    { label: "OPEN CONTACT FOLDER", action: "open-contact" },
    { type: "separator" },
    { label: "OPEN GITHUB", action: "open-github" },
    { label: "EMAIL KHUSHI", action: "send-email" },
  ],
};

const toolbarDropdown = topbar ? document.createElement("div") : null;
if (topbar && toolbarDropdown) {
  toolbarDropdown.className = "toolbar-dropdown";
  toolbarDropdown.setAttribute("role", "menu");
  toolbarDropdown.setAttribute("aria-label", "Toolbar menu");
  topbar.appendChild(toolbarDropdown);
}

let activeTopMenu = "";
let activeTopMenuButton = null;

const setTopMenuButtonState = (activeButton) => {
  topMenuButtons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-expanded", String(isActive));
  });
};

const closeTopMenu = () => {
  if (!toolbarDropdown) {
    return;
  }
  activeTopMenu = "";
  activeTopMenuButton = null;
  toolbarDropdown.classList.remove("is-open");
  toolbarDropdown.innerHTML = "";
  setTopMenuButtonState(null);
};

const renderTopMenu = (menuKey) => {
  if (!toolbarDropdown) {
    return;
  }
  const items = topMenuDefinitions[menuKey] || [];
  toolbarDropdown.innerHTML = "";
  items.forEach((item) => {
    if (item.type === "separator") {
      const separator = document.createElement("div");
      separator.className = "toolbar-separator";
      separator.setAttribute("role", "separator");
      toolbarDropdown.appendChild(separator);
      return;
    }

    const option = document.createElement("button");
    option.type = "button";
    option.className = "toolbar-option";
    option.dataset.topAction = item.action;
    option.setAttribute("role", "menuitem");

    const check = document.createElement("span");
    check.className = "toolbar-check";
    check.textContent = item.checked && item.checked() ? "x" : "";

    const label = document.createElement("span");
    label.className = "toolbar-label";
    label.textContent = item.label;

    const shortcut = document.createElement("span");
    shortcut.className = "toolbar-shortcut";
    shortcut.textContent = item.shortcut || "";

    option.append(check, label, shortcut);
    toolbarDropdown.appendChild(option);
  });
};

const positionTopMenu = (button) => {
  if (!toolbarDropdown || !topbar || !button) {
    return;
  }
  if (isCompactLayout()) {
    toolbarDropdown.style.left = "8px";
    toolbarDropdown.style.right = "8px";
    toolbarDropdown.style.top = `${Math.round(topbar.offsetHeight + 8)}px`;
    return;
  }
  toolbarDropdown.style.right = "auto";
  const topbarRect = topbar.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  let left = buttonRect.left - topbarRect.left;
  toolbarDropdown.style.left = `${Math.round(left)}px`;
  toolbarDropdown.style.top = `${Math.round(topbar.offsetHeight - 2)}px`;

  const maxLeft = Math.max(8, topbarRect.width - toolbarDropdown.offsetWidth - 8);
  left = Math.max(8, Math.min(left, maxLeft));
  toolbarDropdown.style.left = `${Math.round(left)}px`;
};

const moveToNeighborMenu = (offset, focusFirstOption = false) => {
  if (!activeTopMenuButton || topMenuButtons.length === 0) {
    return;
  }
  const currentIndex = topMenuButtons.indexOf(activeTopMenuButton);
  if (currentIndex < 0) {
    return;
  }
  const nextIndex =
    (currentIndex + offset + topMenuButtons.length) % topMenuButtons.length;
  const nextButton = topMenuButtons[nextIndex];
  openTopMenu(nextButton.dataset.topMenu || "", nextButton, focusFirstOption);
  if (!focusFirstOption) {
    nextButton.focus();
  }
};

const openTopMenu = (menuKey, button, focusFirstOption = false) => {
  if (!toolbarDropdown || !topMenuDefinitions[menuKey] || !button) {
    return;
  }
  closeMenu();
  activeTopMenu = menuKey;
  activeTopMenuButton = button;
  renderTopMenu(menuKey);
  toolbarDropdown.classList.add("is-open");
  setTopMenuButtonState(button);
  positionTopMenu(button);
  if (focusFirstOption) {
    const first = toolbarDropdown.querySelector(".toolbar-option");
    if (first) {
      first.focus();
    }
  }
};

const runToolbarAction = async (actionName) => {
  const handler = toolbarActions[actionName];
  if (!handler) {
    return "";
  }
  try {
    const result = await handler();
    return typeof result === "string" ? result : "";
  } catch (error) {
    return "Action failed";
  }
};

topMenuButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const menuKey = button.dataset.topMenu || "";
    if (activeTopMenu === menuKey) {
      closeTopMenu();
      return;
    }
    openTopMenu(menuKey, button);
  });

  button.addEventListener("mouseenter", () => {
    if (!activeTopMenu) {
      return;
    }
    const menuKey = button.dataset.topMenu || "";
    if (menuKey && menuKey !== activeTopMenu) {
      openTopMenu(menuKey, button);
    }
  });

  button.addEventListener("keydown", (event) => {
    const menuKey = button.dataset.topMenu || "";
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTopMenu(menuKey, button, true);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      openTopMenu(menuKey, button);
      moveToNeighborMenu(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      openTopMenu(menuKey, button);
      moveToNeighborMenu(-1);
    }
  });
});

if (toolbarDropdown) {
  toolbarDropdown.addEventListener("click", async (event) => {
    const option = event.target.closest(".toolbar-option");
    if (!option) {
      return;
    }
    const message = await runToolbarAction(option.dataset.topAction || "");
    closeTopMenu();
    if (message) {
      showTopbarToast(message);
    }
  });

  toolbarDropdown.addEventListener("keydown", async (event) => {
    const options = Array.from(toolbarDropdown.querySelectorAll(".toolbar-option"));
    if (options.length === 0) {
      return;
    }
    const currentIndex = options.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
      options[nextIndex].focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex =
        currentIndex < 0
          ? options.length - 1
          : (currentIndex - 1 + options.length) % options.length;
      options[prevIndex].focus();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveToNeighborMenu(1, true);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveToNeighborMenu(-1, true);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const currentButton = activeTopMenuButton;
      closeTopMenu();
      if (currentButton) {
        currentButton.focus();
      }
    }
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => closeTopMenu());
}

document.addEventListener("click", (event) => {
  if (topbar && topbar.contains(event.target)) {
    return;
  }
  closeTopMenu();
});

window.addEventListener("orientationchange", () => {
  syncLayoutVars();
  applyIconLayoutMode();
  if (activeTopMenuButton) {
    positionTopMenu(activeTopMenuButton);
  }
});

document.addEventListener("keydown", async (event) => {
  if (event.key === "Escape") {
    closeTopMenu();
  }

  if (event.key === "F1") {
    event.preventDefault();
    const message = await runToolbarAction("show-shortcuts");
    if (message) {
      showTopbarToast(message);
    }
    return;
  }

  if (isTypingTarget(event.target)) {
    return;
  }

  const key = event.key.toLowerCase();
  if (event.ctrlKey && !event.shiftKey && !event.altKey && key >= "1" && key <= "5") {
    event.preventDefault();
    const actionByKey = {
      "1": "open-computer",
      "2": "open-about",
      "3": "open-guestbook",
      "4": "open-music",
      "5": "open-settings",
    };
    const message = await runToolbarAction(actionByKey[key]);
    if (message) {
      showTopbarToast(message);
    }
    return;
  }

  if (event.ctrlKey && !event.shiftKey && !event.altKey && key === "w") {
    event.preventDefault();
    const message = await runToolbarAction("close-active");
    if (message) {
      showTopbarToast(message);
    }
    return;
  }

  if (event.ctrlKey && !event.shiftKey && !event.altKey && key === "b") {
    event.preventDefault();
    const message = await runToolbarAction("background-next");
    if (message) {
      showTopbarToast(message);
    }
    return;
  }

  if (event.ctrlKey && event.shiftKey && !event.altKey && key === "m") {
    event.preventDefault();
    const message = await runToolbarAction("minimize-all");
    if (message) {
      showTopbarToast(message);
    }
  }
});

openWindow("window-computer");
