import type { InferInsertModel, InferSelectModel, Table } from "drizzle-orm";
import type { db } from "./client";

type DbLike = typeof db;
type Transaction = Parameters<Parameters<DbLike["transaction"]>[0]>[0];

export type DbExecutor = DbLike | Transaction;
export type SelectModel<TTable extends Table> = InferSelectModel<TTable>;
export type InsertModel<TTable extends Table> = InferInsertModel<TTable>;
