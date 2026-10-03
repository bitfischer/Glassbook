/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

declare global {
  namespace App {
    interface Locals {
      user: { id: number; username: string } | null;
      sessionId: number | null;
    }
  }
}

export {};
