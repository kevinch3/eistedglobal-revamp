// Process entry point: the only place that binds a port.
import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`\nEistedGlobal API running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop\n');
});
