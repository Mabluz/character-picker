module.exports = {
  filenameHashing: true,
  devServer: {
    proxy: {
      "/sitemap.xml": {
        target: "http://localhost:1337",
        changeOrigin: true
      }
    }
  }
};
