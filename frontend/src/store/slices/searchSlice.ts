import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  keyword: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

const initialState: SearchState = {
  keyword: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchFilters: (state, action: PayloadAction<Partial<SearchState>>) => {
      return { ...state, ...action.payload };
    },
    clearFilters: () => initialState,
  },
});

export const { setSearchFilters, clearFilters } = searchSlice.actions;
export default searchSlice.reducer;
