const blankState = () => {
  return {
    loading: false,
    loadingTimestamp: new Date()
  };
};

export default {
  namespaced: true,
  state: blankState(),
  mutations: {
    setLoadingSpinner(state, loading) {
      state.loading = loading;
      if (loading) state.loadingTimestamp = new Date();
    }
  },
  getters: {
    isLoading(state) {
      return state.loading;
    },
    loadingTime(state) {
      return state.loadingTimestamp.getTime() - new Date().getTime();
    }
  },
  actions: {}
};
