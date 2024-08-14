/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { isObj, hasProp } from '../../../../util'
import { lexicons } from '../../../../lexicons'
import { CID } from 'multiformats/cid'
import * as ToolsOzoneSetsDefs from './defs'

export interface QueryParams {
  limit?: number
  cursor?: string
  namePrefix?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
}

export type InputSchema = undefined

export interface OutputSchema {
  sets: ToolsOzoneSetsDefs.SetView[]
  cursor?: string
  [k: string]: unknown
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
