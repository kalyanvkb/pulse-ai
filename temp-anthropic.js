const axios = require("axios");
const urls = ["https://www.anthropic.com/news", "https://www.anthropic.com/blog"];
const headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"};
(async () => {
  for (const u of urls) {
    try {
      const res = await axios.get(u, { timeout: 20000, maxRedirects: 5, headers });
      const txt = res.data.toString();
      console.log('URL', u, 'STATUS', res.status, 'NEXT_DATA', txt.indexOf('<script id="__NEXT_DATA__"'), 'window_NEXT', txt.indexOf('window.__NEXT_DATA__'), 'application_json', txt.indexOf('type="application/json"'));
    } catch (e) {
      console.error('ERR', u, e.response ? e.response.status : e.message);
    }
  }
})();
