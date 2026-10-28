export type ThemeName =
    | 'theme1'
    | 'theme2'
    | 'theme3'
    | 'theme4'
    | 'theme5'
    | 'theme6'
    | 'theme7'
    | 'theme8';

export type ThemeOption = {
    value: ThemeName;
    label: string;
    swatch: string; // a representative color for the switcher UI
};

export const themes: ThemeOption[] = [
    { value: 'theme1', label: 'default', swatch: '#171717' },
    { value: 'theme2', label: 'theme2', swatch: '#f59e0b' },
    { value: 'theme3', label: 'theme3', swatch: '#8a79ab' },
    { value: 'theme4', label: 'theme4', swatch: '#8b5cf6' },
    { value: 'theme5', label: 'theme5', swatch: '#d04f99' },
    { value: 'theme6', label: 'theme6', swatch: '#644a40' },
    { value: 'theme7', label: 'theme7', swatch: '#ffc0cb' },
    { value: 'theme8', label: 'theme8', swatch: '#8839ef' },
];

export const DEFAULT_THEME: ThemeName = 'theme1';