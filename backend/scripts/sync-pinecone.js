#!/usr/bin/env node

/* eslint-disable no-console */
const syncPinecone = require('../sync/syncPinecone');

syncPinecone()
  .then(() => {
    console.log('🎉 Pinecone sync complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Pinecone sync failed:', err);
    process.exit(1);
  });
