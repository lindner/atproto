import { Server } from '../../lexicon'
import AppContext from '../../context'
import { addAccountInfoToRepoView, getPdsAccountInfo } from '../util'
import { AtUri } from '@atproto/syntax'
import {
  RecordViewDetail,
  RecordViewNotFound,
} from '../../lexicon/types/tools/ozone/moderation/defs'

export default function (server: Server, ctx: AppContext) {
  server.tools.ozone.moderation.getRecords({
    auth: ctx.authVerifier.modOrAdminToken,
    handler: async ({ params, auth, req }) => {
      const db = ctx.db
      const labelers = ctx.reqLabelers(req)

      const [records, accountInfos] = await Promise.all([
        ctx.modService(db).views.recordDetail(
          params.uris.map((uri) => ({ uri })),
          labelers,
        ),
        getPdsAccountInfo(
          ctx,
          params.uris.map((uri) => new AtUri(uri).hostname),
        ),
      ])

      const results: (RecordViewDetail | RecordViewNotFound)[] = []

      params.uris.forEach((uri) => {
        const record = records.get(uri)
        if (!record) {
          results.push({
            uri,
            $type: 'tools.ozone.moderation.defs#recordViewNotFound',
          })
        } else {
          results.push({
            $type: 'tools.ozone.moderation.defs#recordView',
            ...record,
            repo: addAccountInfoToRepoView(
              record.repo,
              accountInfos.get(record.repo.did) || null,
              auth.credentials.isModerator,
            ),
          })
        }
      })

      return {
        encoding: 'application/json',
        body: { records: results },
      }
    },
  })
}
