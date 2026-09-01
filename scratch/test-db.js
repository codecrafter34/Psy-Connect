import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/psyconnect')
  .then(async () => {
    const db = mongoose.connection.db;
    const collections = await db.collections();
    const emotionCollection = collections.find(c => c.collectionName === 'emotions');
    if (emotionCollection) {
      const docs = await emotionCollection.find({}).sort({_id: -1}).limit(3).toArray();
      console.log('Recent 3 emotions:', JSON.stringify(docs, null, 2));
    } else {
      console.log('No emotions collection found.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
