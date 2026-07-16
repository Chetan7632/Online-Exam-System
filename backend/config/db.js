import mongoose from 'mongoose';
import { createJsonModel } from '../utils/jsonDb.js';

let isMongoConnected = false;

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/online-exam';
    console.log(`Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000 // 3 seconds timeout
    });
    isMongoConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n⚠️  WARNING: MongoDB Connection Failed: ${error.message}`);
    console.warn(`🤖 SWITCHING TO LOCAL JSON DATABASE FALLBACK (Files saved in backend/data/)\n`);
    isMongoConnected = false;
  }
};

export const getModel = (modelName, schema) => {
  const jsonModel = createJsonModel(modelName);
  let compiledMongooseModel;
  
  try {
    compiledMongooseModel = mongoose.model(modelName, schema);
  } catch (err) {
    compiledMongooseModel = mongoose.model(modelName);
  }

  // Create a proxy to dynamically swap operations between Mongoose and JsonModel based on connection state
  const proxy = new Proxy(class {}, {
    construct(target, args) {
      if (isMongoConnected) {
        return new compiledMongooseModel(...args);
      } else {
        return jsonModel(...args);
      }
    },
    get(target, prop) {
      // Direct access to state check
      if (prop === 'isMongoUsed') {
        return isMongoConnected;
      }
      
      const activeModel = isMongoConnected ? compiledMongooseModel : jsonModel;
      const value = activeModel[prop];
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      return value;
    }
  });

  return proxy;
};
