/** Preview is opt-in. A failed live API never silently becomes sample data. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
