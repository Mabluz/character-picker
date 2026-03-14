module.exports = {
  filenameHashing: false,
  devServer: {
    proxy: {
      "/sitemap.xml": {
        target: "http://localhost:1337",
        changeOrigin: true
      }
    }
  }
};
