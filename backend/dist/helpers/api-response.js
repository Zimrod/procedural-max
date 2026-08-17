// src/helpers/api-response.ts
export const executeApi = (schema, handler) => async (req, reply) => {
    try {
        const parsed = schema.parse(req.body);
        const data = await handler(req, parsed);
        return {
            type: "success",
            data,
        };
    }
    catch (err) {
        req.log.error(err);
        reply.code(500);
        return {
            type: "error",
            message: err instanceof Error
                ? err.message
                : "Unknown server error",
        };
    }
};
//# sourceMappingURL=api-response.js.map