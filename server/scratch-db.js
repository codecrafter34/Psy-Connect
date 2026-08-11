import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/psy-connect')
  .then(async () => {
    const db = mongoose.connection.db;
    const collections = await db.collections();
    const emotionCollection = collections.find(c => c.collectionName === 'emotions');
    if (emotionCollection) {
      const docs = await emotionCollection.find({}).sort({_id: -1}).limit(3).toArray();
      console.log('Recent 3 emotions from MongoDB directly:');
      console.log(JSON.stringify(docs, null, 2));
    } else {
      console.log('No emotions collection found.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Mongo Error:', err);
    process.exit(1);
  });
