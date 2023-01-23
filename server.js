const express = require('express');
// const connectDB = require('./config/db');
const app = express();

//Connect Database
// connectDB();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));

//Init middleware
app.use(express.json({ extended: false}));


app.use(express.static('public'));

// Make A directory Publicly Accessible
app.use('/uploads', express.static('uploads'));

//Define Routes
app.get('/',(req, res)=>res.send('Api Running'));
app.use('/api/crawler',require('./routes/api/crawler'));
// app.use('/api/auth',require('./routes/api/auth'));
// app.use('/api/property',require('./routes/api/property'));
// app.use('/api/slider',require('./routes/api/slider'));
// app.use('/api/loan_type',require('./routes/api/loan'));
// app.use('/api/appraisal_type',require('./routes/api/appraisal'));
// app.use('/api/order',require('./routes/api/order'));
// app.use('/api/client',require('./routes/api/client'));
// app.use('/api/message',require('./routes/api/message'));
// app.use('/api/invoice',require('./routes/api/invoice'));
// app.use('/api/billing',require('./routes/api/billing'));
// app.use('/api/payment',require('./routes/api/payment'));
// app.use('/api/quick_book',require('./routes/api/quickbook'));
// app.use('/api/kb',require('./routes/api/knowledge_base'));
// app.use('/api/kb_category',require('./routes/api/kb_category'));
// app.use('/api/note',require('./routes/api/note_for_client'));
// app.use('/api/page',require('./routes/api/page'));
// app.use('/api/cms',require('./routes/api/cms'));