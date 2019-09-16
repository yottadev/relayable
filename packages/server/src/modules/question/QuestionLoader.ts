import DataLoader from 'dataloader'
import {
  mongooseLoader,
  connectionFromMongoCursor
} from '@entria/graphql-mongoose-loader'
import mongoose, { Types } from 'mongoose'

import User from '../user/UserLoader'
import QuestionModel, { IQuestion } from './QuestionModel'
import { GraphQLContext } from 'server/src/TypeDefinitions'
import { IUser } from '../user/UserModel'
import { ConnectionArguments, fromGlobalId } from 'graphql-relay'
import Answer from '../answer/AnswerLoader'
import { UserLoader } from '../../loader'
import { IAnswer } from '../answer/AnswerModel'

declare type ObjectId = mongoose.Schema.Types.ObjectId
export default class Question {
  id: string
  _id: string
  title: string
  content: string
  upvotes: IUser[]
  downvotes: IUser[]
  views: IUser[]
  tags: string[] | undefined
  author: User
  answers: Answer[]
  createdAt: any
  updatedAt: any

  constructor (data: Partial<IQuestion>) {
    this.id = data.id
    this._id = data._id
    this.title = data.title!
    this.content = data.content!
    this.upvotes = data.upvotes || []
    this.downvotes = data.downvotes || []
    this.views = data.views || []
    this.tags = data.tags
    this.author = data.author! as User
    this.answers = data.answers! as Answer[]
    this.createdAt = data.createdAt!
    this.updatedAt = data.updatedAt!
  }
}

export const getLoader = () =>
  new DataLoader((ids: ReadonlyArray<string>) =>
    mongooseLoader(QuestionModel, ids)
  )

const viewerCanSee = ({ user }: GraphQLContext, data: IQuestion | null) => {
  if (!data) return null

  if (!user) throw new Error('must be authenticated')

  return new Question(data)
}

export const load = async (
  context: GraphQLContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  id: string | Object | ObjectId
): Promise<Question | null> => {
  if (!id && typeof id !== 'string') {
    return null
  }

  let data
  try {
    data = await context.dataloaders.QuestionLoader.load(id as string)
  } catch (err) {
    return null
  }

  try {
    const author = await UserLoader.load(context, data.author)
    data.author = author as IUser
  } catch (err) {
    throw new Error("author doesn't exists")
  }

  try {
    const answers = await context.dataloaders.AnswerLoader.loadMany(
      (data.answers as unknown) as string[]
    )

    data.answers = answers! as IAnswer[]
  } catch (err) {
    data.answers = []
  }

  return viewerCanSee(context, data)
}

export const clearCache = (
  { dataloaders }: GraphQLContext,
  id: Types.ObjectId
) => dataloaders.QuestionLoader.clear(id.toString())
export const primeCache = (
  { dataloaders }: GraphQLContext,
  id: Types.ObjectId,
  data: IQuestion
) => dataloaders.QuestionLoader.prime(id.toString(), data)
export const clearAndPrimeCache = (
  context: GraphQLContext,
  id: Types.ObjectId,
  data: IQuestion
) => clearCache(context, id) && primeCache(context, id, data)

type QuestionArgs = ConnectionArguments & {
  authorId?: string
}

export const loadQuestions = async (
  context: GraphQLContext,
  args: QuestionArgs
) => {
  const where = args.authorId ? { author: fromGlobalId(args.authorId).id } : {}
  const questions = QuestionModel.find(where).sort({ createdAt: -1 })

  return connectionFromMongoCursor({
    cursor: questions,
    context,
    args,
    loader: load
  })
}
