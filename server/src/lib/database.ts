import mongoose from 'mongoose';

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
