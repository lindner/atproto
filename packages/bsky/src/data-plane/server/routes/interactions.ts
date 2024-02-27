import { keyBy } from '@atproto/common'
import { ServiceImpl } from '@connectrpc/connect'
import { Service } from '../../../proto/bsky_connect'
import { Database } from '../db'
import { countAll } from '../db/util'
import { sql } from 'kysely'

export default (db: Database): Partial<ServiceImpl<typeof Service>> => ({
  async getInteractionCounts(req) {
    const uris = req.refs.map((ref) => ref.uri)
    if (uris.length === 0) {
      return { likes: [], replies: [], reposts: [] }
    }
    const res = await db.db
      .selectFrom('post_agg')
      .where('uri', 'in', uris)
      .selectAll()
      .execute()
    const byUri = keyBy(res, 'uri')
    return {
      likes: uris.map((uri) => byUri[uri]?.likeCount ?? 0),
      replies: uris.map((uri) => byUri[uri]?.replyCount ?? 0),
      reposts: uris.map((uri) => byUri[uri]?.repostCount ?? 0),
    }
  },
  async getCountsForUsers(req) {
    if (req.dids.length === 0) {
      return { followers: [], following: [], posts: [] }
    }
    const { ref } = db.db.dynamic
    const res = await db.db
      .selectFrom('profile_agg')
      .where('did', 'in', req.dids)
      .selectAll('profile_agg')
      .select([
        db.db
          .selectFrom('feed_generator')
          .whereRef('creator', '=', ref('profile_agg.did'))
          .select(countAll.as('val'))
          .as('feedGensCount'),
        db.db
          .selectFrom('list')
          .whereRef('creator', '=', ref('profile_agg.did'))
          .select(countAll.as('val'))
          .as('listsCount'),
        db.db
          .selectFrom('mod_service')
          .whereRef('creator', '=', ref('profile_agg.did'))
          .select(sql<true>`${true}`.as('val'))
          .as('isModService'),
      ])
      .execute()
    const byDid = keyBy(res, 'did')
    return {
      followers: req.dids.map((uri) => byDid[uri]?.followersCount ?? 0),
      following: req.dids.map((uri) => byDid[uri]?.followsCount ?? 0),
      posts: req.dids.map((uri) => byDid[uri]?.postsCount ?? 0),
      lists: req.dids.map((uri) => byDid[uri]?.listsCount ?? 0),
      feeds: req.dids.map((uri) => byDid[uri]?.feedGensCount ?? 0),
      isModService: req.dids.map((uri) => byDid[uri]?.isModService ?? false),
    }
  },
})
