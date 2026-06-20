export const GROUPS = [
  "All",
  "My Watchlist",
  "Models",
  "Platforms",
  "Hardware",
  "Enterprise",
  "Developers",
  "Robotics"
];

export const GROUP_COLORS = {
  Models: "#5b8af0",
  Platforms: "#3dd68c",
  Hardware: "#ff9f43",
  Enterprise: "#f0a04b",
  Developers: "#7a5cff",
  Robotics: "#ff6b6b",
};

export function normalizeGroup(group) {
  if (!group) return "";
  const cleaned = group.trim();
  const mapping = {
    "Model Builders": "Models",
    "Infra & Platforms": "Platforms",
    "Infra & platforms": "Platforms",
    "Semiconductor & Hardware": "Hardware",
    "Enterprise AI": "Enterprise",
    "Coding and Developer Assistants": "Developers",
    "Robotics": "Robotics",
  };
  return mapping[cleaned] || cleaned;
}

export function formatWeek(isoWeek) {
  if (!isoWeek) return "";
  const [year, week] = isoWeek.split("-W");
  const firstDay = new Date(Number(year), 0, 1 + (Number(week) - 1) * 7);
  const start = new Date(firstDay);
  const end = new Date(firstDay);
  end.setDate(end.getDate() + 6);

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

export function getSourcesForGroup(articles, group) {
  const filtered =
    group === "All"
      ? articles
      : articles.filter((a) => normalizeGroup(a.group) === group);

  const seen = new Set();

  return filtered
    .map((a) => ({ name: a.source, color: a.color, group: a.group }))
    .filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function formatRefreshed(iso) {
  if (!iso) return "Not loaded";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function normalizeRoute(path) {
  return path.replace(/\/+$/, "").toLowerCase();
}

export function getDateFilterFromPath(path) {
  const normalized = normalizeRoute(path);
  if (normalized === "/yesterday") return "yesterday";
  if (normalized === "/today") return "today";
  return null;
}

export function getDateFilterValue(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "today";
  if (date >= yesterday && date < today) return "yesterday";
  return null;
}