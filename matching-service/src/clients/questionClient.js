import axios from 'axios';

const QUESTIONS_SVC_BASE =
  process.env.QUESTIONS_SVC_BASE || 'http://question-service:3001';

// 5-minute in-memory cache to avoid hitting questions service too often
let cache = { topics: null, diffs: null, fetchedAt: 0 };
const CACHE_TTL_MS = Number(process.env.QS_CACHE_TTL_MS || 5 * 60 * 1000);

function isFresh(ts) {
  return ts && (Date.now() - ts) < CACHE_TTL_MS;
}

/**
 * Fetch { difficulties, topics } from Question Service.
 * It uses GET /api/questions/statistics which returns:
 * { success: true, data: { byDifficulty: [{_id:"Easy",count:...},...],
 *                          byCategory:   [{_id:"Graphs",count:...},...] } }
 */
export async function getQuestionMeta(bearer) {
  if (isFresh(cache.fetchedAt) && cache.diffs?.length && cache.topics?.length) {
    return { difficulties: cache.diffs, topics: cache.topics };
  }

  const url = `${QUESTIONS_SVC_BASE}/api/questions/statistics`;
  const headers = {};
  if (bearer) headers.Authorization = bearer; // only if QS requires auth (usually not)

  const { data } = await axios.get(url, { headers });
  if (!data?.success || !data?.data) {
    throw new Error('Question Service statistics returned unexpected shape');
  }

  const byDiff = Array.isArray(data.data.byDifficulty) ? data.data.byDifficulty : [];
  const byCat  = Array.isArray(data.data.byCategory)   ? data.data.byCategory   : [];

  // Extract unique ids (ignore empty _id)
  const difficulties = byDiff.map(x => String(x._id)).filter(Boolean);
  const topics       = byCat.map(x => String(x._id)).filter(Boolean);

  if (!difficulties.length || !topics.length) {
    // Fallback just in case QS has no data yet, and I want to test locally
    // const fallbackDiffs = ['Easy','Medium','Hard'];
    // const fallbackTopics = ['Graphs','Trees','Arrays','Dynamic Programming','Sorting'];
    // cache = { diffs: fallbackDiffs, topics: fallbackTopics, fetchedAt: Date.now() };
    // return { difficulties: fallbackDiffs, topics: fallbackTopics };
    throw new Error('Question Service has no difficulties/topics yet (seed data?)');
  }

  cache = { diffs: difficulties, topics, fetchedAt: Date.now() };
  return { difficulties, topics };
}
