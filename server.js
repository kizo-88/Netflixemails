const express = require('express');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const config = {
  imap: {
    user: 'mmmm.muaz03@gmail.com',
    password: 'aovg aeex chbm wikw',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
    tlsOptions: { rejectUnauthorized: false }, // Note: Not recommended for production
  },
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/emails', async (req, res) => {
  let connection;
  try {
    console.log('Attempting to connect to IMAP server...');
    connection = await imaps.connect(config);
    console.log('Connected to IMAP server');

    console.log('Opening INBOX...');
    await connection.openBox('INBOX');
    console.log('INBOX opened');

    const searchCriteria = ['ALL', ['FROM', 'info@account.netflix.com']];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false,
    };

    console.log('Searching for emails...');
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} messages`);

    if (messages.length === 0) {
      return res.json([]);
    }

    const emailData = await Promise.all(messages.map(async (message) => {
      const header = message.parts.find((part) => part.which === 'HEADER').body;
      const bodyPart = message.parts.find((part) => part.which === 'TEXT');
      const parsed = await simpleParser(bodyPart.body);

      return {
        subject: header.subject[0],
        from: header.from[0],
        date: header.date[0],
        body: parsed.text,
      };
    }));

    console.log('Sending email data...');
    res.json(emailData);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: 'Error fetching emails.', details: error.message, stack: error.stack });
  } finally {
    if (connection) {
      connection.end();
      console.log('IMAP connection closed');
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});