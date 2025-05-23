"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-screen w-full flex-col items-center justify-center bg-background"
    >
      <div className="max-w-md space-y-4 text-center">
        <motion.h1
        animate={{ 
                x: [0, -10, 10, -10, 10, 0],
            }}
            transition={{ 
                repeat: Infinity,
                duration: 1,
                repeatDelay: 1 
            }}
            className="text-9xl font-bold text-primary"
        >
            404
        </motion.h1>
        <h2 className="text-2xl font-semibold">Страница не найдена</h2>
        <p className="text-muted-foreground">
          Извините, мы не смогли найти страницу, которую вы ищете.
        </p>
        <Button asChild variant="default" className="mt-4">
          <Link href="/">Вернуться на главную</Link>
        </Button>
      </div>
    </motion.div>
  );
}