export interface OrganizationState {
  initialOrder: string[];
  order: string[];
  favorites: string[];
  hidden: string[];
}

export function createInitialOrganization(ids: string[]): OrganizationState {
  return { initialOrder: [...ids], order: [...ids], favorites: [], hidden: [] };
}

export function moveModule(
  state: OrganizationState,
  id: string,
  destination: number,
): OrganizationState {
  const source = state.order.indexOf(id);
  if (source < 0) return state;
  const order = state.order.filter((moduleId) => moduleId !== id);
  const target = Math.max(0, Math.min(destination, order.length));
  order.splice(target, 0, id);
  return { ...state, order };
}

export function favoriteModule(
  state: OrganizationState,
  id: string,
): OrganizationState {
  if (!state.initialOrder.includes(id)) return state;
  const favorites = state.favorites.includes(id)
    ? state.favorites.filter((moduleId) => moduleId !== id)
    : [...state.favorites, id];
  return { ...state, favorites };
}

export function hideModule(
  state: OrganizationState,
  id: string,
): OrganizationState {
  if (!state.order.includes(id)) return state;
  return {
    ...state,
    hidden: [...state.hidden, id],
    order: state.order.filter((moduleId) => moduleId !== id),
  };
}

export function restoreModule(
  state: OrganizationState,
  id: string,
): OrganizationState {
  if (!state.hidden.includes(id)) return state;
  const visible = new Set([...state.order, id]);
  return {
    ...state,
    hidden: state.hidden.filter((moduleId) => moduleId !== id),
    order: state.initialOrder.filter((moduleId) => visible.has(moduleId)),
  };
}

export function resetOrganization(state: OrganizationState): OrganizationState {
  return createInitialOrganization(state.initialOrder);
}
