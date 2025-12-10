import { GenericAdapter } from './generic.js';

/**
 * Registry of all available adapters.
 * Add custom adapters here as they are created.
 */
const adapters = {
  generic: new GenericAdapter(),

  // Add custom adapters for specific directories:
  // betalist: new BetaListAdapter(),
  // producthunt: new ProductHuntAdapter(),
  // indiehackers: new IndieHackersAdapter(),
};

/**
 * Get an adapter by name.
 * Falls back to generic adapter if not found.
 */
export function getAdapter(name) {
  if (!name) return adapters.generic;

  const adapter = adapters[name.toLowerCase()];
  if (!adapter) {
    console.log(`Adapter "${name}" not found, using generic`);
    return adapters.generic;
  }

  return adapter;
}

/**
 * List all available adapter names.
 */
export function listAdapters() {
  return Object.keys(adapters);
}
