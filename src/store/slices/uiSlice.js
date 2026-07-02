export const createUiSlice = (set) => ({
  selectedIssueId: null,
  activeFilter: 'all', // 'all' | 'nearby' | 'trending' | 'new'
  searchQuery: '',
  loading: false,
  error: null,
  userLocation: null, // User's dynamic client-side geolocation coordinates

  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUserLocation: (userLocation) => set({ userLocation }),
});
