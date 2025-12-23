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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-2 h-2 rounded-full bg-blue-500"
                animate={{ 
                  scale: activeSection === "home" ? [1, 1.5, 1] : 1,
                  backgroundColor: sections.find(s => s.id === activeSection)?.color.split(' ')[2] || "#3b82f6"
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-lg font-semibold text-gray-900">NavObserver</span>
            </div>

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

            <Badge variant="outline" className="font-normal">
              <span className="flex items-center gap-2">
                {activeSection === "home" && <Home className="h-3 w-3" />}
                {activeSection === "about" && <Info className="h-3 w-3" />}
                {activeSection === "services" && <Briefcase className="h-3 w-3" />}
                {activeSection === "contact" && <CheckCircle className="h-3 w-3" />}
                {sections.find(s => s.id === activeSection)?.title}
              </span>
            </Badge>
          </div>
        </div>
      </nav>

      {/* Боковая навигация */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <Card className="w-64 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Навигация</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <motion.div
                      key={section.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full justify-start gap-3 h-auto py-3 px-4 ${
                          activeSection === section.id
                            ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 border"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className={`p-2 rounded-md ${section.color}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-gray-500">{section.description}</div>
                        </div>
                        {activeSection === section.id && (
                          <ChevronRight className="h-4 w-4 text-blue-500 animate-pulse" />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <div className="container mx-auto px-4 md:pl-80">
        <AnimatePresence mode="wait">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="min-h-screen flex items-center justify-center py-20"
              >
                <Card className={`w-full max-w-4xl transition-all duration-500 ${
                  isActive 
                    ? "shadow-2xl scale-[1.02] border-blue-200" 
                    : "shadow-lg"
                }`}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${section.color}`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-3xl font-bold">{section.title}</CardTitle>
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="relative"
                            >
                              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse">
                                Активно
                              </Badge>
                              <div className="absolute -top-1 -right-1">
                                <div className="relative flex h-3 w-3">
                                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></div>
                                  <div className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <CardDescription className="text-lg mt-2">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isActive ? 1 : 0.7 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Это секция <span className="font-semibold text-gray-900">{section.title.toLowerCase()}</span>. 
                        Здесь отображается контент, соответствующий выбранному разделу.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${
                          isActive ? "bg-blue-50 border-blue-100" : "bg-gray-50"
                        }`}>
                          <h4 className="font-semibold mb-2">Статус секции</h4>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${
                              isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"
                            }`} />
                            <span>{isActive ? "В центре экрана" : "Неактивна"}</span>
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${
                          isActive ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100" : "bg-gray-50"
                        }`}>
                          <h4 className="font-semibold mb-2">Информация</h4>
                          <p className="text-sm text-gray-600">
                            ID: <code className="bg-gray-100 px-2 py-1 rounded">{section.id}</code>
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border-l-4 ${
                            section.id === "home" ? "border-blue-500 bg-blue-50" :
                            section.id === "about" ? "border-purple-500 bg-purple-50" :
                            section.id === "services" ? "border-amber-500 bg-amber-50" :
                            "border-emerald-500 bg-emerald-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-semibold">Секция активна!</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Эта секция в настоящее время находится в центре экрана.
                            Intersection Observer отслеживает её видимость.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.section>
            );
          })}
        </AnimatePresence>

        {/* Индикатор прогресса */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
          <div className="flex flex-col items-center gap-2">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="relative group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeSection === section.id 
                    ? "bg-blue-500 scale-125" 
                    : "bg-gray-300 group-hover:bg-gray-400"
                }`} />
                {activeSection === section.id && (
                  <motion.div
                    layoutId="progressIndicator"
                    className="absolute inset-0 w-3 h-3 rounded-full bg-blue-500/20 -z-10"
                    initial={false}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {section.title}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}