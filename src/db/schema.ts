import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const chats = pgTable('chats', {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
    role: text('role').notNull(), // 'user' or 'ai'
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memories = pgTable('memories', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const summaries = pgTable('summaries', {
    id: serial('id').primaryKey(),
    chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rateLimits = pgTable('rate_limits', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    count: integer('count').notNull(),
    lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
});

export const communityFeed = pgTable('community_feed', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    userAvatar: text('user_avatar'),
    userName: text('user_name'),
    imageUrl: text('image_url').notNull(),
    prompt: text('prompt'),
    likes: integer('likes').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userImages = pgTable('user_images', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    imageUrl: text('image_url').notNull(),
    publicId: text('public_id'), // For Cloudinary management
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Text prompts for coding assistance - persisted for AI context
export const textPrompts = pgTable('text_prompts', {
    id: serial('id').primaryKey(),
    promptId: text('prompt_id').unique().notNull(),  // e.g., 'impl-1', 'debug-1'
    title: text('title').notNull(),
    prompt: text('prompt').notNull(),
    category: text('category').notNull(),            // Implementation, Debugging, etc.
    tags: text('tags').notNull(),                    // JSON array stored as text
    usageCount: integer('usage_count').default(0),   // Track popularity
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
