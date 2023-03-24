import { InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from '../../../../lexicon'
import { softDeleted } from '../../../../db/util'
import AppContext from '../../../../context'
import { authVerifier } from '../util'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.actor.getProfile({
    auth: authVerifier,
    handler: async ({ auth, params }) => {
      const { actor } = params
      const requester = auth.credentials.did
      const { db, services } = ctx
      const actorService = services.actor(db)

      const user = await actorService.getUser(actor, true)

      if (!user) {
        throw new InvalidRequestError('Profile not found')
      }
      if (softDeleted(user)) {
        throw new InvalidRequestError(
          'Account has been taken down',
          'AccountTakedown',
        )
      }

      return {
        encoding: 'application/json',
        body: await actorService.views.profile(user, requester),
      }
    },
  })
}
