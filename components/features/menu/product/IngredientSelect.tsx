import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";

interface IngredientSelectProps {
  value: { inventoryItemId: string; quantity: number };
  onChange: (value: { inventoryItemId: string; quantity: number }) => void;
  onRemove: () => void;
  inventoryItems: { id: string; name: string; unit: string }[];
  language: 'ru' | 'ka';
}

const IngredientSelect = ({
  value,
  onChange,
  onRemove,
  inventoryItems,
  language,
}: IngredientSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedItem = inventoryItems.find(i => i.id === value.inventoryItemId);

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-5">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {selectedItem 
            ? `${selectedItem.name} (${selectedItem.unit})`
            : language === 'ru' ? 'Выберите ингредиент' : 'აირჩიეთ ინგრედიენტი'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {open && (
          <div 
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
            }}
          >
            <div 
              className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Command className="h-full">
                <CommandInput 
                  placeholder={language === 'ru' ? 'Поиск ингредиентов...' : 'ინგრედიენტების ძებნა...'} 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty className="text-sm px-2 py-1.5">
                    {language === 'ru' ? 'Ингредиенты не найдены' : 'ინგრედიენტები ვერ მოიძებნა'}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {inventoryItems
                      .filter(item => 
                        item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                        item.unit.toLowerCase().includes(searchValue.toLowerCase())
                      )
                      .map(item => (
                        <CommandItem
                          key={item.id}
                          value={`${item.name} ${item.unit}`}
                          onSelect={() => {
                            onChange({ ...value, inventoryItemId: item.id });
                            setOpen(false);
                            setSearchValue('');
                          }}
                          className="text-sm"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value.inventoryItemId === item.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {item.name} ({item.unit})
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        )}
      </div>
      
      <div className="col-span-5">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value.quantity}
          onChange={e => onChange({
            ...value,
            quantity: parseFloat(e.target.value) || 0
          })}
          className="text-sm"
          placeholder={language === 'ru' ? 'Количество' : 'რაოდენობა'}
        />
      </div>
      
      <div className="col-span-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default IngredientSelect;