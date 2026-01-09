import { Dispatch, SetStateAction } from "react";

export type getPageContentType = {
  site: string;
  language: string;
  version: string;
  environmentId: string;
  pageid: string;
  token: string;
};

export type getAllPagesBySiteTypes = {
  token: string;
  siteName: string
};

export type getPageStructureType = {
  token: string;
  pageId: string
};

export type getCollectionsType = {
  token: string;
};

export type getSitesType = {
  token: string;
  collectionId?: string
};

export type getAuthTokenTypes = {
  setToken: Dispatch<SetStateAction<string | undefined>>;
};
