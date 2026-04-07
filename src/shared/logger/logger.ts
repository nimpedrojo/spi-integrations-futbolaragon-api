// Offers a narrow logger contract for non-Fastify layers.
export type Logger = {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
};

export const logger: Logger = {
  info(message, context) {
    console.log(message, context ?? {});
  },
  error(message, context) {
    console.error(message, context ?? {});
  },
};
