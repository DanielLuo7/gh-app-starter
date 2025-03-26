import express from 'express';
import dotenv from 'dotenv';
import { handleWebhook } from './handlers.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy' });
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    await handleWebhook(req.body);
    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
