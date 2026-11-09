const express = require('express');
const cors = require('cors');
require('dotenv').config();

const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/document', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});