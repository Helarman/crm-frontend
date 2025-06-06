import { Language } from '@/lib/stores/language-store';
import React from 'react';
import { AddressSuggestions, DaDataAddress, DaDataSuggestion } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface AddressInputProps {
  value: any;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  language: Language
}

const AddressInput: React.FC<AddressInputProps> = ({ value, onChange, language }) => {
  return (
    <AddressSuggestions
      token="e7a8d3897b07bb4631312ee1e8b376424c6667ea"
      value={value} 
      onChange={(suggestion) => {
        if (suggestion) {
          onChange({
            target: {
              value: suggestion.value,
            },
          } as React.ChangeEvent<HTMLInputElement>); // Casting to the correct event type
        }
      }}
      inputProps={{
        placeholder: language === 'ka' ? 'ქუჩა, სახლი, ბინა' : 'Улица, дом, квартира',
      }}
      defaultQuery={value}
    />
  );
};

export default AddressInput;
