const debug = process.env.NODE_ENV !== 'production';

module.exports = {
  debug,
  backendServer: process.env.VUE_APP_BACKEND_SERVER || "http://localhost:1337",
  vueServer: process.env.VUE_APP_VUE_SERVER || "http://localhost:8080"
};
