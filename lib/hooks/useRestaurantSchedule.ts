// lib/hooks/useRestaurantSchedule.ts
import { useCallback } from 'react';

interface RestaurantSchedule {
  id: string;
  title: string;
  // Часы работы
  mondayOpen?: string;
  mondayClose?: string;
  mondayIsWorking?: boolean;
  tuesdayOpen?: string;
  tuesdayClose?: string;
  tuesdayIsWorking?: boolean;
  wednesdayOpen?: string;
  wednesdayClose?: string;
  wednesdayIsWorking?: boolean;
  thursdayOpen?: string;
  thursdayClose?: string;
  thursdayIsWorking?: boolean;
  fridayOpen?: string;
  fridayClose?: string;
  fridayIsWorking?: boolean;
  saturdayOpen?: string;
  saturdayClose?: string;
  saturdayIsWorking?: boolean;
  sundayOpen?: string;
  sundayClose?: string;
  sundayIsWorking?: boolean;
}

export const useRestaurantSchedule = () => {
  // Функция для получения текущего дня недели
  const getCurrentDay = useCallback(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }, []);

  // Функция для форматирования времени
  const formatTime = useCallback((timeString: string, lang: 'ru' | 'ka' = 'ru') => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'ka-GE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Функция для проверки, открыт ли ресторан сейчас
  const isRestaurantOpen = useCallback((restaurant: RestaurantSchedule, language: 'ru' | 'ka' = 'ru'): { 
    isOpen: boolean; 
    message: string;
    nextOpenTime?: string;
  } => {
    if (!restaurant) {
      return {
        isOpen: false,
        message: language === 'ru' ? 'Данные ресторана не загружены' : 'რესტორნის მონაცემები არ ჩაწერილი'
      };
    }

    const today = getCurrentDay();
    const isWorking = restaurant[`${today}IsWorking` as keyof RestaurantSchedule] as boolean;
    
    // Если сегодня выходной
    if (!isWorking) {
      const dayNames = {
        ru: ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'],
        ka: ['კვირას', 'ორშაბათს', 'სამშაბათს', 'ოთხშაბათს', 'ხუთშაბათს', 'პარასკევს', 'შაბათს']
      };
      
      const todayName = dayNames[language][new Date().getDay()];
      
      // Найдем следующий рабочий день
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayIndex = new Date().getDay();
      
      let nextWorkingDay = null;
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (todayIndex + i) % 7;
        const nextDay = days[nextDayIndex];
        const isNextDayWorking = restaurant[`${nextDay}IsWorking` as keyof RestaurantSchedule] as boolean;
        
        if (isNextDayWorking) {
          nextWorkingDay = {
            day: nextDay,
            openTime: restaurant[`${nextDay}Open` as keyof RestaurantSchedule] as string
          };
          break;
        }
      }
      
      const message = nextWorkingDay 
        ? language === 'ru' 
          ? `Ресторан закрыт по ${todayName}. Откроется в ${formatTime(nextWorkingDay.openTime, language)}`
          : `რესტორანი დახურულია ${todayName}. გაიხსნება ${formatTime(nextWorkingDay.openTime, language)}-ზე`
        : language === 'ru'
          ? `Ресторан закрыт по ${todayName}`
          : `რესტორანი დახურულია ${todayName}`;

      return {
        isOpen: false,
        message,
        nextOpenTime: nextWorkingDay?.openTime
      };
    }

    const openTime = restaurant[`${today}Open` as keyof RestaurantSchedule] as string;
    const closeTime = restaurant[`${today}Close` as keyof RestaurantSchedule] as string;
    
    if (!openTime || !closeTime) {
      return {
        isOpen: false,
        message: language === 'ru' 
          ? 'Часы работы не установлены' 
          : 'სამუშაო საათები არ არის დაყენებული'
      };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const openDate = new Date(openTime);
    const openMinutes = openDate.getHours() * 60 + openDate.getMinutes();
    
    const closeDate = new Date(closeTime);
    const closeMinutes = closeDate.getHours() * 60 + closeDate.getMinutes();

    const isOpen = currentTime >= openMinutes && currentTime <= closeMinutes;
    
    if (!isOpen) {
      // Если еще не открылся
      if (currentTime < openMinutes) {
        return {
          isOpen: false,
          message: language === 'ru'
            ? `Ресторан открывается в ${formatTime(openTime, language)}`
            : `რესტორანი გაიხსნება ${formatTime(openTime, language)}-ზე`
        };
      }
      
      // Если уже закрылся
      return {
        isOpen: false,
        message: language === 'ru'
          ? `Ресторан закрылся в ${formatTime(closeTime, language)}`
          : `რესტორანი დაიხურა ${formatTime(closeTime, language)}-ზე`
      };
    }

    return {
      isOpen: true,
      message: language === 'ru'
        ? `Ресторан открыт до ${formatTime(closeTime, language)}`
        : `რესტორანი ღიაა ${formatTime(closeTime, language)}-მდე`
    };
  }, [getCurrentDay, formatTime]);

  return {
    isRestaurantOpen,
    getCurrentDay,
    formatTime
  };
};