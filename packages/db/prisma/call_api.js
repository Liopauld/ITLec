const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('http://localhost:4000/tracks/484a9840-2de2-43aa-ab67-46653f29e538');
    console.log(res.status, res.data);
  } catch (err) {
    if (err.response) console.error('STATUS', err.response.status, err.response.data);
    else console.error('ERROR', err.message);
  }
})();
