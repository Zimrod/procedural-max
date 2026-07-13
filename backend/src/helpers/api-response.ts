// src/helpers/api-response.ts

import { z, ZodType } from "zod";
import { FastifyReply, FastifyRequest } from "fastify";

export type ApiResponse<Res> =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "success";
      data: Res;
    };

export const executeApi =
  <Res, Req extends ZodType>(
    schema: Req,
    handler: (
      req: FastifyRequest,
      body: z.infer<Req>
    ) => Promise<Res>
  ) =>
  async (
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse<Res>> => {
    try {
      const parsed = schema.parse(req.body);

      const data = await handler(req, parsed);

      return {
        type: "success",
        data,
      };
    } catch (err) {
      req.log.error(err);

      reply.code(500);

      return {
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Unknown server error",
      };
    }
  };