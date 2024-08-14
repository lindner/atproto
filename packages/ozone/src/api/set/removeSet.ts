import { AuthRequiredError, InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from '../../lexicon'
import AppContext from '../../context'

export default function (server: Server, ctx: AppContext) {
  server.tools.ozone.sets.removeSet({
    auth: ctx.authVerifier.modOrAdminToken,
    handler: async ({ input, auth }) => {
      const access = auth.credentials
      const db = ctx.db
      const { name } = input.body

      if (!access.isModerator) {
        throw new AuthRequiredError('Must be a moderator to delete a set')
      }

      if (!name) {
        throw new InvalidRequestError('Name is required')
      }

      const setService = ctx.setService(db)
      const set = await setService.getByName(name)
      if (!set) {
        throw new InvalidRequestError(`Set with name "${name}" does not exist`)
      }

      await setService.deleteSet(set.id)
    },
  })
}
