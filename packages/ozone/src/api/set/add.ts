import { AuthRequiredError, InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from '../../lexicon'
import AppContext from '../../context'

export default function (server: Server, ctx: AppContext) {
  server.tools.ozone.sets.add({
    auth: ctx.authVerifier.modOrAdminToken,
    handler: async ({ input, auth }) => {
      const access = auth.credentials
      const db = ctx.db
      const { name, values } = input.body

      if (!access.isModerator) {
        throw new AuthRequiredError(
          'Must be a moderator to add values to a set',
        )
      }

      if (!name || !values || values.length === 0) {
        throw new InvalidRequestError(
          'Name and non-empty values array are required',
        )
      }

      const setService = ctx.setService(db)

      await db.transaction(async (txn) => {
        const set = await setService.getByName(name, txn)
        if (!set) {
          throw new InvalidRequestError(
            `Set with name "${name}" does not exist`,
          )
        }

        await setService.addValues(set.id, values, txn)
      })
    },
  })
}
