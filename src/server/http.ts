// Wrap a JSON mutation handler: run it, return its result as JSON, and turn any
// thrown error into a 400 with the message. Keeps the /admin/api/* routes thin.
export function jsonPost<T>(handler: (request: Request) => Promise<T>) {
  return async ({ request }: { request: Request }): Promise<Response> => {
    try {
      return Response.json(await handler(request));
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Bad request" },
        { status: 400 },
      );
    }
  };
}
