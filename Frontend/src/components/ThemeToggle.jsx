
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    console.log("Current theme:", theme);
    console.log("Setting theme to:", nextTheme);

    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex h-10 items-center justify-center gap-2 rounded-full
        bg-stone-100 px-3 text-stone-700
        transition hover:bg-stone-200
        dark:bg-neutral-950 dark:text-stone-100
        dark:hover:bg-neutral-800"
      aria-label="Toggle theme"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;
