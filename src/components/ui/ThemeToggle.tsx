import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-transparent",
        "bg-background text-primary focus:outline-none",
        "transition-colors duration-200"
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      initial={{ rotate: isDark ? 45 : 0 }}
      animate={{ 
        rotate: isDark ? 45 : 0,
        backgroundColor: isDark ? 'transparent' : 'transparent'
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: isDark ? 0.75 : 1,
          opacity: isDark ? 0 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        <Sun 
          size={20} 
          className={cn("text-black", isDark ? "opacity-100" : "opacity-100")} 
        />
      </motion.div>
      
      <motion.div
        className="absolute"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0.75,
          opacity: isDark ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        <Moon 
          size={20} 
          className={cn("text-indigo-400", isDark ? "opacity-100" : "opacity-0")} 
        />
      </motion.div>
    </motion.button>
  );
}; 