import assert from 'assert'
import AppContext from '../../../../context'
import { Server } from '../../../../lexicon'
import { mapDefined } from '@atproto/common'
import AtpAgent from '@atproto/api'
import { QueryParams } from '../../../../lexicon/types/app/bsky/actor/searchActors'
import {
  HydrationFnInput,
  PresentationFnInput,
  RulesFnInput,
  SkeletonFnInput,
  createPipeline,
} from '../../../../pipeline'
import { Hydrator } from '../../../../hydration/hydrator'
import { Views } from '../../../../views'
import { DataPlaneClient } from '../../../../data-plane'
import { parseString } from '../../../../hydration/util'

export default function (server: Server, ctx: AppContext) {
  const searchActors = createPipeline(
    skeleton,
    hydration,
    noBlocks,
    presentation,
  )
  server.app.bsky.actor.searchActors({
    auth: ctx.authOptionalVerifier,
    handler: async ({ auth, params }) => {
      const viewer = auth.credentials.did
      const results = await searchActors({ ...params, viewer }, ctx)
      return {
        encoding: 'application/json',
        body: results,
      }
    },
  })
}

const skeleton = async (inputs: SkeletonFnInput<Context, Params>) => {
  const { ctx, params } = inputs

  // @TODO
  // add hits total
  assert(ctx.searchAgent, 'unsupported without search agent')
  const { data: res } =
    await ctx.searchAgent.api.app.bsky.unspecced.searchActorsSkeleton({
      q: params.q ?? params.term ?? '',
      cursor: params.cursor,
      limit: params.limit,
    })

  return {
    dids: res.actors.map(({ did }) => did),
    cursor: parseString(res.cursor),
  }
}

const hydration = async (
  inputs: HydrationFnInput<Context, Params, Skeleton>,
) => {
  const { ctx, params, skeleton } = inputs
  return ctx.hydrator.hydrateProfiles(skeleton.dids, params.viewer)
}

const noBlocks = (inputs: RulesFnInput<Context, Params, Skeleton>) => {
  const { ctx, skeleton, hydration } = inputs
  skeleton.dids = skeleton.dids.filter(
    (did) => !ctx.views.viewerBlockExists(did, hydration),
  )
  return skeleton
}

const presentation = (
  inputs: PresentationFnInput<Context, Params, Skeleton>,
) => {
  const { ctx, skeleton, hydration } = inputs
  const actors = mapDefined(skeleton.dids, (did) =>
    ctx.views.profile(did, hydration),
  )
  return {
    actors,
    cursor: skeleton.cursor,
  }
}

type Context = {
  dataplane: DataPlaneClient
  hydrator: Hydrator
  views: Views
  searchAgent?: AtpAgent
}

type Params = QueryParams & { viewer: string | null }

type Skeleton = {
  dids: string[]
  hitsTotal?: number
  cursor?: string
}
