import type { IncomingMessage } from "node:http";

/**
 * True when the TCP peer is this machine.
 *
 * Read off the socket, never off a header: `X-Forwarded-For` and friends are attacker-
 * supplied, so trusting them here would let any remote caller claim to be local and walk
 * straight past the guard.
 */
export const isLoopback = (req: IncomingMessage): boolean => {
  const addr = req.socket.remoteAddress ?? "";
  return (
    addr === "127.0.0.1" ||
    addr === "::1" ||
    addr === "::ffff:127.0.0.1" ||
    addr.startsWith("127.")
  );
};
