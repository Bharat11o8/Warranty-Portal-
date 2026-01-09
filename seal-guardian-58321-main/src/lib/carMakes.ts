/**
 * List of car brands/makes available in India
 * Used in warranty registration forms for Car Make dropdown
 */

export const CAR_MAKES = [
    // Mass Market - Indian
    { value: "maruti_suzuki", label: "Maruti Suzuki" },
    { value: "tata", label: "Tata" },
    { value: "mahindra", label: "Mahindra" },
    { value: "force", label: "Force Motors" },

    // Mass Market - Korean
    { value: "hyundai", label: "Hyundai" },
    { value: "kia", label: "Kia" },

    // Mass Market - Japanese
    { value: "honda", label: "Honda" },
    { value: "toyota", label: "Toyota" },
    { value: "nissan", label: "Nissan" },
    { value: "isuzu", label: "Isuzu" },

    // Mass Market - European
    { value: "volkswagen", label: "Volkswagen" },
    { value: "skoda", label: "Škoda" },
    { value: "renault", label: "Renault" },
    { value: "citroen", label: "Citroën" },

    // Mass Market - American
    { value: "jeep", label: "Jeep" },

    // Mass Market - Chinese
    { value: "mg", label: "MG (Morris Garages)" },
    { value: "byd", label: "BYD" },

    // Luxury - German
    { value: "mercedes", label: "Mercedes-Benz" },
    { value: "bmw", label: "BMW" },
    { value: "audi", label: "Audi" },
    { value: "porsche", label: "Porsche" },
    { value: "mini", label: "MINI" },

    // Luxury - British
    { value: "jaguar", label: "Jaguar" },
    { value: "land_rover", label: "Land Rover" },
    { value: "rolls_royce", label: "Rolls-Royce" },
    { value: "bentley", label: "Bentley" },

    // Luxury - Other
    { value: "volvo", label: "Volvo" },
    { value: "lexus", label: "Lexus" },
    { value: "maserati", label: "Maserati" },
    { value: "lamborghini", label: "Lamborghini" },
    { value: "ferrari", label: "Ferrari" },

    // Electric-focused
    { value: "ola", label: "Ola Electric" },
    { value: "ather", label: "Ather" },

    // Other
    { value: "other", label: "Other" },
] as const;

// Type for car make values
export type CarMakeValue = typeof CAR_MAKES[number]["value"];

// Helper to get label from value
export const getCarMakeLabel = (value: string): string => {
    const found = CAR_MAKES.find(make => make.value === value);
    return found ? found.label : value;
};
