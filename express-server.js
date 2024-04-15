const path = require('path');
const express = require('express');

const app = express();
const BUILD_DIR = path.join(__dirname, '/build');
const HTML_FILE = path.join(BUILD_DIR, 'index.html');

app.use(express.static(BUILD_DIR));
app.get('*', (req, res) => {
    res.sendFile(HTML_FILE);
});

const PORT = process.env.PORT || 4201;

app.listen(PORT, () => {

});
