const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());

// Basic server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 