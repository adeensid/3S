import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: 'sid-software-solutions',
  },
});

process.stdout.write(`MongoDB ready: ${mongo.getUri()}\n`);

const shutdown = async () => {
  await mongo.stop();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
