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
          opacity: isDark ? 0 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        <Sun 
          size={24} 
          className={cn("text-foreground", isDark ? "opacity-100" : "opacity-100")} 
        />
      </motion.div>
      
      <motion.div
        className="absolute"
        initial={false}
        animate={{
          opacity: isDark ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        <Moon 
          size={20} 
          className={cn("text-foreground", isDark ? "opacity-100" : "opacity-0")} 
        />
      </motion.div>
    </motion.button>
  );
}; 