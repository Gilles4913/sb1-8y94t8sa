import { createContext, useContext, ReactNode } from 'react';

interface RouteParams {
  token?: string;
  slug?: string;
}

const ParamsContext = createContext<RouteParams>({});

export function useParams() {
  return useContext(ParamsContext);
}

interface RouterProps {
  children: ReactNode;
}

export function Router({ children }: RouterProps) {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);

  const params: RouteParams = {};

  if ((parts[0] === 'sponsor' || parts[0] === 'respond') && parts[1]) {
    params.token = parts[1];
  } else if (parts[0] === 'p' && parts[1]) {
    params.slug = parts[1];
  }

  return <ParamsContext.Provider value={params}>{children}</ParamsContext.Provider>;
}
