const express = require('express');
import { serverAdapter } from './bull-board';

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

const PORT = process.env.BULL_BOARD_PORT || 4201;
app.listen(PORT, () => {
  console.log(`Bull Board running on http://localhost:${PORT}/admin/queues`);
});