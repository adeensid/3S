import mongoose, { Schema, type Types } from 'mongoose';

export interface CommentRevision {
  body: string;
  editedAt: Date;
  editedBy: Types.ObjectId;
}

export interface CommentDoc extends mongoose.Document {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  deletedAt: Date | null;
  editHistory: CommentRevision[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDoc>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    deletedAt: { type: Date, default: null },
    editHistory: {
      type: [
        {
          body: { type: String, required: true },
          editedAt: { type: Date, required: true },
          editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Comment = mongoose.model<CommentDoc>('Comment', commentSchema);
