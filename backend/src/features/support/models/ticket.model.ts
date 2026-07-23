import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketMessage {
  senderId: string;
  senderName: string;
  message: string;
  createdAt: Date;
}

export interface ITicket {
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketDocument extends ITicket, Document {}

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new Schema<TicketDocument>(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo: { type: String },
    messages: [ticketMessageSchema],
  },
  { timestamps: true }
);

ticketSchema.index({ userId: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ assignedTo: 1 });

export const Ticket = mongoose.model<TicketDocument>('Ticket', ticketSchema);
