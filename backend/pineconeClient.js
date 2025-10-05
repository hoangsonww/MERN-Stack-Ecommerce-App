const axios = require('axios');

const defaultNamespace = process.env.PINECONE_NAMESPACE || '';

let httpClient;

const getHttpClient = () => {
  const { PINECONE_API_KEY, PINECONE_HOST } = process.env;
  if (!PINECONE_API_KEY || !PINECONE_HOST) {
    throw new Error('PINECONE_API_KEY and PINECONE_HOST must be set to use Pinecone');
  }

  if (!httpClient) {
    const baseURL = PINECONE_HOST.replace(/\/$/, '');
    httpClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': PINECONE_API_KEY,
      },
      timeout: Number(process.env.PINECONE_TIMEOUT_MS || 20000),
    });
  }
  return httpClient;
};

const upsertVectors = async (vectors, namespace = defaultNamespace) => {
  if (!Array.isArray(vectors) || !vectors.length) return;
  await getHttpClient().post('/vectors/upsert', {
    vectors,
    namespace,
  });
};

const describeIndexStats = async () => {
  const { data } = await getHttpClient().post('/describe_index_stats', {});
  return data;
};

const getNamespaceVectorCount = async (namespace = defaultNamespace) => {
  try {
    const stats = await describeIndexStats();
    return stats?.namespaces?.[namespace]?.vectorCount || 0;
  } catch (error) {
    if (error?.response?.status === 404) {
      return 0;
    }
    console.warn('⚠️  Unable to load Pinecone index stats:', error.message || error);
    return 0;
  }
};

const fetchVectors = async (ids, namespace = defaultNamespace) => {
  if (!Array.isArray(ids) || !ids.length) return {};
  const { data } = await getHttpClient().post('/vectors/fetch', {
    ids,
    namespace,
    includeMetadata: true,
    includeValues: true,
  });
  return data?.vectors || {};
};

const queryById = async (id, topK = 5, namespace = defaultNamespace) => {
  const { data } = await getHttpClient().post('/query', {
    id,
    topK,
    includeMetadata: true,
    namespace,
  });
  return data;
};

const queryByVector = async (vector, topK = 5, namespace = defaultNamespace) => {
  const { data } = await getHttpClient().post('/query', {
    vector,
    topK,
    includeMetadata: true,
    namespace,
  });
  return data;
};

const deleteVectors = async (ids, namespace = defaultNamespace) => {
  if (!Array.isArray(ids) || !ids.length) return;
  await getHttpClient().post('/vectors/delete', {
    ids,
    namespace,
  });
};

const purgeNamespace = async (namespace = defaultNamespace) => {
  await getHttpClient().post('/vectors/delete', {
    deleteAll: true,
    namespace,
  });
};

module.exports = {
  upsertVectors,
  fetchVectors,
  queryById,
  queryByVector,
  deleteVectors,
  purgeNamespace,
  getNamespaceVectorCount,
};
