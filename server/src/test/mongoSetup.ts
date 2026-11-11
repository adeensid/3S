import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

mongoose.set('bufferTimeoutMS', 120_000);

let mongo: MongoMemoryServer | undefined;

function resolveTestMongoUri(): string {
  if (process.env.JEST_MONGODB_URI) {
    return process.env.JEST_MONGODB_URI;
  }
  const worker = process.env.JEST_WORKER_ID ?? '0';
  return `mongodb://127.0.0.1:27017/sid-jest-w${worker}`;
}

export async function connectTestDatabase(): Promise<void> {
  const externalUri = resolveTestMongoUri();

  if (process.env.MONGOMS_DISABLED === '1') {
    await mongoose.connect(externalUri);
    return;
  }

  try {
    await mongoose.connect(externalUri, { serverSelectionTimeoutMS: 2500 });
    return;
  } catch {
    mongo = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
    await mongoose.connect(mongo.getUri());
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
}

export async function disconnectTestDatabase(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo?.stop();
  mongo = undefined;
}
