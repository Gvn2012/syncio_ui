import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DateFormat = 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';
export type DateSeparator = '-' | '/';

interface PreferencesState {
  dateFormat: DateFormat;
  dateSeparator: DateSeparator;
}

const initialState: PreferencesState = {
  dateFormat: 'DD-MM-YYYY',
  dateSeparator: '-',
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setDateFormat: (state, action: PayloadAction<DateFormat>) => {
      state.dateFormat = action.payload;
    },
    setDateSeparator: (state, action: PayloadAction<DateSeparator>) => {
      state.dateSeparator = action.payload;
    },
    resetPreferences: (state) => {
      state.dateFormat = initialState.dateFormat;
      state.dateSeparator = initialState.dateSeparator;
    },
  },
});

export const { setDateFormat, setDateSeparator, resetPreferences } = preferencesSlice.actions;
export default preferencesSlice.reducer;
