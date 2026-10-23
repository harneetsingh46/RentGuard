import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    console.log("Initial saved theme:", savedTheme);

    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    console.log("Theme changed to:", theme);

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    localStorage.setItem("theme", theme);
    console.log("Theme saved:", localStorage.getItem("theme"));
  }, [theme]);

  const toggleTheme = () => {
    console.log("Toggle clicked");

    setTheme((currentTheme) => {
      const newTheme = currentTheme === "light" ? "dark" : "light";
      console.log("Changing theme from", currentTheme, "to", newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
