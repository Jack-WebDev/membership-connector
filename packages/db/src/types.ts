import type { db } from "./client";

type DbLike = typeof db;
type Transaction = Parameters<Parameters<DbLike["transaction"]>[0]>[0];

export type DbExecutor = DbLike | Transaction;
