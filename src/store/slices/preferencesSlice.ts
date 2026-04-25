import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DateFormat = 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';
export type DateSeparator = '-' | '/';
export type HoverDuration = number;

interface PreferencesState {
  dateFormat: DateFormat;
  dateSeparator: DateSeparator;
  reactionHoverDuration: HoverDuration;
}

const initialState: PreferencesState = {
  dateFormat: 'DD-MM-YYYY',
  dateSeparator: '-',
  reactionHoverDuration: 1000,
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
    setReactionHoverDuration: (state, action: PayloadAction<HoverDuration>) => {
      state.reactionHoverDuration = action.payload;
    },
    resetPreferences: (state) => {
      state.dateFormat = initialState.dateFormat;
      state.dateSeparator = initialState.dateSeparator;
      state.reactionHoverDuration = initialState.reactionHoverDuration;
    },
  },
  extraReducers: (builder) => {
    builder.addCase('user/logout', () => initialState);
  },
});

export const { 
  setDateFormat, 
  setDateSeparator, 
  setReactionHoverDuration, 
  resetPreferences 
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
