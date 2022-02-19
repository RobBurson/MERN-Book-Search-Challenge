const { User } = require('../models');
const { AuthError } = require('apollo-server-express');
const { sigToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({_id: context.user._id})
                .select('-__v -password');
                return userData;
            }
            throw new AuthError('You are not logged in!');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthError('Those seem to be incorrect login credentials! Try again!');
            }

            const accuratePw = await user.isCorrectPassword(password);

            if (!accuratePw) {
                throw new AuthError('Those seem to be incorrect login credentials! Try again!');
            }

            const token = sigToken(user);

            return { token, user };
        },
        addUser: async(parent, args) => {
            const user = await User.create(args);
            const token = sigToken(user);

            return { token, user };
        },
        saveBook: async (parent, { input }, { user }) => {
            if (user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: user._id },
                    { $addToSet: { savedBooks: input } },
                    { new: true, runValidators: true }
                );

                return updatedUser;
            }

            throw new AuthError('You must be logged in to perform this action!');
        },
        removeBook: async (parent, { bookId }, { user }) => {
            if (user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: user._id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true, runValidators: true }
                );

                return updatedUser;
            }

            throw new AuthError('You must be logged in to perform this action!');
        }
    }
};

module.exports = resolvers;