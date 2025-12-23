"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Home, Info, Briefcase, CheckCircle } from "lucide-react";

const sections = [
  { 
    id: "home", 
    title: "Главная", 
    icon: Home,
    color: "bg-gradient-to-br from-blue-500 to-cyan-400",
    description: "Добро пожаловать на наш сайт"
  },
  { 
    id: "about", 
    title: "О нас", 
    icon: Info,
    color: "bg-gradient-to-br from-purple-500 to-pink-400",
    description: "Узнайте больше о нашей компании"
  },
  { 
    id: "services", 
    title: "Услуги", 
    icon: Briefcase,
    color: "bg-gradient-to-br from-amber-500 to-orange-400",
    description: "Наши профессиональные услуги"
  },
  { 
    id: "contact", 
    title: "Контакты", 
    icon: CheckCircle,
    color: "bg-gradient-to-br from-emerald-500 to-green-400",
    description: "Свяжитесь с нами"
  },
];

export default function IntersectionPage() {
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolling, setIsScrolling] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0
      }
    );

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.current?.observe(element);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    setIsScrolling(true);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }
    setTimeout(() => setIsScrolling(false), 1000);
  };

  const getSectionIcon = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section ? section.icon : Home;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b supports-backdrop-blur:bg-white/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">

            <NavigationMenu>
              <NavigationMenuList>
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <NavigationMenuItem key={section.id}>
                      <Button
                        variant="ghost"
                        onClick={() => scrollToSection(section.id)}
                        className={`relative gap-2 transition-all duration-300 ${
                          activeSection === section.id 
                            ? "text-gray-900 bg-gray-100" 
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.title}
                        {activeSection === section.id && (
                          <motion.div
                            layoutId="activeSection"
                            className="absolute inset-0 bg-gray-100 rounded-md -z-10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Button>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>

          </div>
        </div>
      </nav>



      {/* Основной контент */}
      <div className="container mx-auto px-4 md:pl-80">
        <div>
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <div
                key={section.id}
                id={section.id}
                className="min-h-screen flex items-center justify-center py-20"
              >
                <div>секция</div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}