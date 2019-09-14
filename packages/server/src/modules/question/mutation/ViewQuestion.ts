import { mutationWithClientMutationId, fromGlobalId } from 'graphql-relay'
import { GraphQLString, GraphQLNonNull, GraphQLID } from 'graphql'

import { GraphQLContext } from '../../../TypeDefinitions'
import QuestionModel from '../QuestionModel'
import QuestionType from '../QuestionType'
import { EVENTS } from '../../../pubSub'

export default mutationWithClientMutationId({
  name: 'ViewQuestion',
  description:
    'Mutation to view the question\nEach user represents one view\nThe user must the logged in',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) }
  },
  mutateAndGetPayload: async (data, { user, pubSub }: GraphQLContext) => {
    if (!user) return { error: 'You must be authenticated' }

    const { id } = fromGlobalId(data.id)

    const question = await QuestionModel.findById(id)
    if (!question) return { error: "Question doesn't exists" }

    if (question.views.includes(user._id)) {
      return { error: 'You already have seen this question' }
    }

    question.views.push(user)

    await question.save()

    pubSub.publish(EVENTS.QUESTION.NEW_VIEW, { NewView: { question } })

    return { question }
  },
  outputFields: {
    error: {
      type: GraphQLString,
      resolve: obj => obj.error
    },
    question: {
      type: QuestionType,
      resolve: obj => obj.question
    }
  }
})