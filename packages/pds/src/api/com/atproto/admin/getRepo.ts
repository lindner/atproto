import { InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from '../../../../lexicon'
import AppContext from '../../../../context'
import { mergeRepoViewPdsDetails } from './util'
import { authPassthru } from '../../../proxy'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.admin.getRepo({
    auth: ctx.authVerifier.role,
    handler: async ({ req, params, auth }) => {
      const access = auth.credentials
      const { db, services } = ctx
      const { did } = params
      const account = await services.account(db).getAccount(did, true)
      const repoDetail =
        account &&
        (await services.moderation(db).views.repoDetail(account, {
          includeEmails: access.moderator,
        }))

      if (ctx.cfg.bskyAppView.proxyModeration) {
        try {
          let { data: repoDetailAppview } =
            await ctx.appViewAgent.com.atproto.admin.getRepo(
              params,
              authPassthru(req),
            )
          if (repoDetail) {
            repoDetailAppview = mergeRepoViewPdsDetails(
              repoDetailAppview,
              repoDetail,
            )
          }
          return {
            encoding: 'application/json',
            body: repoDetailAppview,
          }
        } catch (err) {
          if (err && err['error'] === 'RepoNotFound') {
            throw new InvalidRequestError('Repo not found', 'RepoNotFound')
          } else {
            throw err
          }
        }
      }

      if (!repoDetail) {
        throw new InvalidRequestError('Repo not found', 'RepoNotFound')
      }
      return {
        encoding: 'application/json',
        body: repoDetail,
      }
    },
  })
}
